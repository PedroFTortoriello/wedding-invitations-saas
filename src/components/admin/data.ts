import type { DeletionImpact } from "@/components/admin/account-deletion";
import type { SupportWrite } from "@/lib/acting";
import type { FunnelEventName } from "@/lib/funnel";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { isTemplateId } from "@/lib/wedding";
import type { WeddingSite } from "@/types/wedding";

/* ------------------------------------------------------------------ consultas */

const PAGE_SIZE = 1000;

type DbError = { message: string; code?: string };
type PagedQuery<T> = (from: number, to: number) => PromiseLike<{ data: T[] | null; error: DbError | null }>;

async function readPages<T>(query: PagedQuery<T>): Promise<{ rows: T[]; error: DbError | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await query(from, from + PAGE_SIZE - 1);
    if (error) return { rows, error };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return { rows, error: null };
  }
}

/**
 * Lê todas as linhas de uma consulta em páginas de 1000 (teto de linhas do PostgREST;
 * sem isso os totais sairiam cortados em silêncio). A consulta precisa de ordem estável.
 * ponytail: agrega em JS; mover para uma view/RPC SQL quando passar de alguns milhares de linhas.
 */
export async function fetchAll<T>(query: PagedQuery<T>): Promise<T[]> {
  const { rows, error } = await readPages(query);
  if (error) throw new Error(`Admin: falha ao consultar o banco (${error.message})`);
  return rows;
}

/** Migration 0011 ainda não aplicada: o PostgREST responde PGRST205 (tabela fora do cache); o Postgres, 42P01. */
const MISSING_TABLE_CODES = ["PGRST205", "42P01"];

/**
 * Como fetchAll, mas para `funnel_events` e sem lançar: a tabela pode não existir ainda e a
 * medição não pode derrubar o admin. `problem` é "missing" (rode a migration), a mensagem de
 * outro erro, ou null.
 */
export async function fetchFunnelEvents<T>(query: PagedQuery<T>): Promise<{ rows: T[]; problem: string | null }> {
  const { rows, error } = await readPages(query);
  if (!error) return { rows, problem: null };
  return { rows: [], problem: MISSING_TABLE_CODES.includes(error.code ?? "") ? "missing" : error.message };
}

/** Colunas de `weddings` usadas no admin. O modelo e a data saem do JSONB sem trazer o `content` inteiro. */
export const ADMIN_WEDDING_COLUMNS =
  "id, owner_id, slug, status, couple_names, created_at, publish_paid_at, template:content->>templateId, wedding_date:content->>weddingDate";

/** Sem templateId gravado, o site renderiza o modelo padrão (ver rowToWeddingSite). */
export function templateIdOf(raw: string | null): WeddingSite["templateId"] {
  return raw && isTemplateId(raw) ? raw : "classico-romantico";
}

/**
 * Conexões do Mercado Pago, só colunas sem segredo. A tabela guarda tokens cifrados e não
 * tem policy de leitura: apenas o service-role lê. Chame só depois de requireAdmin().
 */
export async function getMpConnections() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return []; // ambiente sem service-role: o bloco some
  const { data } = await createAdminClient()
    .from("mp_connections")
    .select("wedding_id, status, last_error, updated_at");
  return data ?? [];
}

export const PHOTOS_BUCKET = "wedding-photos";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Todos os arquivos sob `prefix/` no bucket de fotos: lista paginada de 100 em 100, descendo em subpastas. */
async function listPhotoPaths(admin: AdminClient, prefix: string): Promise<string[]> {
  const paths: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await admin.storage
      .from(PHOTOS_BUCKET)
      .list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    for (const item of data ?? []) {
      const path = `${prefix}/${item.name}`;
      // Pastas vêm sem id.
      if (item.id) paths.push(path);
      else paths.push(...(await listPhotoPaths(admin, path)));
    }
    if (!data || data.length < 100) return paths;
  }
}

/**
 * O que some junto com a conta (tela de confirmação e a própria exclusão). Service role:
 * chame só depois de requireAdmin(). null = a conta não existe mais no Auth. Se a listagem
 * do storage falhar, `photoPaths` vem vazio e `photosListFailed` true (o resto segue).
 */
export async function loadDeletionImpact(userId: string): Promise<DeletionImpact | null> {
  const admin = createAdminClient();
  const [authResult, profileResult, weddingResult] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("profiles").select("name, email, role").eq("id", userId).maybeSingle(),
    admin
      .from("weddings")
      .select("id, slug, status, couple_names, publish_paid_at, gifts:content->gifts")
      .eq("owner_id", userId)
      .maybeSingle()
  ]);
  if (authResult.error && authResult.error.status !== 404) throw authResult.error;
  if (profileResult.error) throw profileResult.error;
  if (weddingResult.error) throw weddingResult.error;
  const user = authResult.data.user;
  if (!user) return null;

  const wedding = weddingResult.data;
  const empty = { data: [], count: 0, error: null };
  const [guests, messages, cashGifts, payments, mp, photos] = await Promise.all([
    wedding ? admin.from("guests").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id) : empty,
    wedding ? admin.from("messages").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id) : empty,
    wedding
      ? fetchAll((from, to) =>
          admin.from("cash_gifts").select("status, gross_amount").eq("wedding_id", wedding.id).order("id").range(from, to)
        )
      : [],
    wedding
      ? fetchAll((from, to) =>
          admin.from("publish_payments").select("amount_cents").eq("wedding_id", wedding.id).eq("status", "paid").order("id").range(from, to)
        )
      : [],
    wedding ? admin.from("mp_connections").select("status").eq("wedding_id", wedding.id).maybeSingle() : { data: null, error: null },
    listPhotoPaths(admin, userId).then(
      (paths) => ({ paths, failed: false }),
      () => ({ paths: [] as string[], failed: true })
    )
  ]);
  for (const result of [guests, messages, mp]) if (result.error) throw result.error;
  const paid = cashGifts.filter((gift) => gift.status === "paid");

  return {
    userId,
    role: profileResult.data?.role ?? null,
    email: user.email ?? profileResult.data?.email ?? null,
    name: profileResult.data?.name ?? null,
    wedding: wedding
      ? {
          id: wedding.id,
          slug: wedding.slug,
          status: wedding.status,
          coupleNames: wedding.couple_names,
          publishPaidAt: wedding.publish_paid_at
        }
      : null,
    paymentsPaidCents: sumBy(payments, (payment) => payment.amount_cents),
    guests: guests.count ?? 0,
    messages: messages.count ?? 0,
    cashGifts: cashGifts.length,
    cashGiftsPaid: paid.length,
    cashGiftsPaidTotal: sumBy(paid, (gift) => Number(gift.gross_amount)),
    giftCotas: Array.isArray(wedding?.gifts) ? wedding.gifts.length : 0,
    photoPaths: photos.paths,
    photosListFailed: photos.failed,
    mpConnected: Boolean(mp.data && mp.data.status !== "revoked")
  };
}

/** Tentativa de cartão sem pagamento criado no MP não é presente (mesma regra do painel do casal). */
export function isRealGift(gift: { payment_method: string; provider_payment_id: string | null }) {
  return gift.payment_method !== "card" || Boolean(gift.provider_payment_id);
}

/* ------------------------------------------------------------------ funil */

const FUNNEL_EVENT_LABELS: Record<FunnelEventName, string> = {
  signup_completed: "Conta criada",
  signup_failed: "Falha no cadastro",
  wedding_created: "Casamento criado",
  wedding_create_failed: "Falha ao criar o casamento",
  editor_opened: "Abriu o editor",
  autosave_failed: "Falha ao salvar no editor",
  publish_page_viewed: "Viu a página de publicação",
  publish_checkout_started: "Abriu o pagamento da taxa",
  publish_checkout_failed: "Falha ao abrir o pagamento",
  publish_paid: "Taxa paga",
  site_published: "Site publicado",
  publish_failed: "Falha ao publicar",
  ai_site_generated: "Gerou o site com a IA",
  action_failed: "Erro em uma ação",
  support_session_started: "Admin abriu a conta (suporte)",
  support_session_ended: "Admin saiu da conta (suporte)",
  support_action: "Admin editou pela conta (suporte)",
  support_blocked: "Ação bloqueada no modo suporte",
  account_deleted: "Conta apagada pelo admin",
  account_payments_archived: "Pagamentos arquivados antes de apagar a conta",
  role_changed: "Papel da conta alterado"
};

const SUPPORT_WRITE_LABELS: Record<SupportWrite, string> = {
  autosave: "salvou o editor",
  guests_add: "adicionou convidado",
  gifts_add: "adicionou presente",
  gifts_edit: "editou presente",
  gifts_toggle: "ativou/desativou presente",
  gifts_image: "trocou foto de presente",
  gifts_import: "importou presente",
  pix_change: "trocar a chave Pix",
  slug_change: "trocar o endereço do site",
  profile_whatsapp: "alterar o WhatsApp",
  guests_remove: "remover convidado",
  gifts_remove: "remover presente",
  cash_gift_mark_received: "marcar presente como recebido",
  coordinator_link: "gerar link do cerimonialista",
  mercadopago: "mexer no Mercado Pago",
  publish: "publicar o site",
  publish_checkout: "pagar a taxa",
  wedding_create: "criar casamento",
  ai_generate: "gerar o site com a IA"
};

/**
 * Linha de auditoria dos eventos do admin (support_*, account_deleted): quem agiu, o que
 * fez e, na jornada de um admin, em qual conta. `nameOf` resolve ids de perfil para nome/e-mail.
 */
export function summarizeAdminDetail(
  event: { event: string; user_id: string | null; detail: Json },
  viewedUserId: string,
  nameOf: (id: string) => string | undefined
) {
  const adminId = detailField(event.detail, "adminId");
  if (!adminId) return "";
  const action = detailField(event.detail, "action");
  const actionLabel = action ? (SUPPORT_WRITE_LABELS[action as SupportWrite] ?? action) : undefined;
  // user_id vira null quando a conta é apagada: detail.targetUserId guarda o vínculo.
  const targetId = event.user_id ?? detailField(event.detail, "targetUserId");
  const target =
    event.event === "account_deleted"
      ? `${detailField(event.detail, "guests") ?? 0} convidados · ${detailField(event.detail, "cashGiftsPaid") ?? 0} presentes pagos`
      : targetId && targetId !== viewedUserId
        ? `conta ${nameOf(targetId) ?? `removida (${targetId.slice(0, 8)})`}`
        : undefined;
  const role = event.event === "role_changed" ? detailField(event.detail, "role") : undefined;
  return [
    `por ${adminId === viewedUserId ? "esta conta" : (nameOf(adminId) ?? "admin removido")}`,
    actionLabel && (event.event === "support_blocked" ? `tentou ${actionLabel}` : actionLabel),
    role && `virou ${role === "admin" ? "admin" : "cliente"}`,
    target
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Rótulo pt-BR do evento; nomes desconhecidos (eventos futuros) aparecem crus. */
export const funnelEventLabel = (event: string) => FUNNEL_EVENT_LABELS[event as FunnelEventName] ?? event;

/** Campo de texto/número do `detail` (JSONB), ou undefined se ausente ou vazio. */
export function detailField(detail: Json, key: string) {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) return undefined;
  const value = detail[key];
  return typeof value === "string" || typeof value === "number" ? String(value).trim() || undefined : undefined;
}

/** Uma linha legível do `detail` (nunca o JSON cru): escopo, mensagem, código, origem, modelo, campanha. */
export function summarizeDetail(detail: Json) {
  const get = (key: string) => detailField(detail, key);
  const code = get("code") ?? get("reason");
  const source = get("source");
  const template = get("template") ?? get("templateId");
  const campaign = [get("utm_source"), get("utm_campaign")].filter(Boolean).join(" / ");
  return [
    get("scope"),
    get("message"),
    code && `código ${code}`,
    source && `origem ${source}`,
    template && `modelo ${template}`,
    campaign && `campanha ${campaign}`
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Link para a jornada da conta em /admin/usuarios (a linha expandida tem id="jornada"). */
export const journeyHref = (userId: string) => `${withParams("/admin/usuarios", { usuario: userId })}#jornada`;

/* ------------------------------------------------------------------ agregação */

export function countBy<T>(list: T[], key: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of list) map.set(key(item), (map.get(key(item)) ?? 0) + 1);
  return map;
}

export function sumBy<T>(list: T[], value: (item: T) => number) {
  return list.reduce((total, item) => total + value(item), 0);
}

const percentFmt = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

/** "12,5%" (0% quando o total é zero). */
export const formatPercent = (part: number, whole: number) => percentFmt.format(whole ? part / whole : 0);

/* ------------------------------------------------------------------ busca e URLs */

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Busca sem acento e sem caixa em qualquer um dos campos. */
export function matchesQuery(query: string, ...fields: (string | null | undefined)[]) {
  const needle = normalize(query.trim());
  if (!needle) return true;
  return fields.some((field) => field && normalize(field).includes(needle));
}

/** Monta um href descartando parâmetros vazios. */
export function withParams(path: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

/* ------------------------------------------------------------------ datas */

export const DAY_MS = 86_400_000;

/** Instante da requisição. Server Components renderizam uma vez por acesso, então ler o relógio aqui é seguro. */
export const currentTime = () => Date.now();
const TZ = "America/Sao_Paulo";

const toDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayLabelFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "short" });
const monthLabelFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" });
const relativeFmt = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

/** 14/09/2026 */
export const formatDate = (iso: string | null | undefined, fallback = "—") => {
  const date = toDate(iso);
  return date ? dateFmt.format(date) : fallback;
};

/** 14 de set. de 2026, 19:40 */
export const formatDateTime = (iso: string | null | undefined, fallback = "—") => {
  const date = toDate(iso);
  return date ? dateTimeFmt.format(date) : fallback;
};

/** "agora mesmo", "há 12 minutos", "ontem", "há 3 dias", "há 2 meses" */
export function formatRelative(iso: string | null | undefined, now = Date.now()) {
  const date = toDate(iso);
  if (!date) return "";
  const minutes = Math.round((date.getTime() - now) / 60_000);
  if (Math.abs(minutes) < 1) return "agora mesmo";
  if (Math.abs(minutes) < 60) return relativeFmt.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeFmt.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return relativeFmt.format(days, "day");
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return relativeFmt.format(months, "month");
  return relativeFmt.format(Math.round(days / 365), "year");
}

/** Intervalo entre dois instantes em texto curto: "12 min", "5 h", "3 dias". */
export function formatGap(ms: number) {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "dia" : "dias"}`;
}

/** Dias inteiros até a data (negativo = já passou). */
export function daysUntil(iso: string | null | undefined, now = Date.now()) {
  const date = toDate(iso);
  return date ? Math.ceil((date.getTime() - now) / DAY_MS) : null;
}

/** Dia civil em São Paulo: "2026-09-14". */
export const dayKey = (iso: string | null | undefined) => {
  const date = toDate(iso);
  return date ? dayKeyFmt.format(date) : "";
};

/** Mês civil em São Paulo: "2026-09". */
export const monthKey = (iso: string | null | undefined) => dayKey(iso).slice(0, 7);

/** Últimos `count` dias (mais antigo primeiro), com rótulo "seg., 14 de set.". */
export function lastDays(count: number, now = Date.now()) {
  const [y, m, d] = dayKey(new Date(now).toISOString()).split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(y, m - 1, d - (count - 1 - index), 12));
    return { key: date.toISOString().slice(0, 10), label: dayLabelFmt.format(date) };
  });
}

/** Últimos `count` meses (mais antigo primeiro), com rótulo "Setembro de 2026". */
export function lastMonths(count: number, now = Date.now()) {
  const [y, m] = monthKey(new Date(now).toISOString()).split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(y, m - 1 - (count - 1 - index), 15));
    const label = monthLabelFmt.format(date);
    return { key: date.toISOString().slice(0, 7), label: label.charAt(0).toUpperCase() + label.slice(1) };
  });
}
