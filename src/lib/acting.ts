import type { User } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth";
import { recordFunnelEvent } from "@/lib/funnel";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { readSupportCookie } from "@/lib/support-session";

/**
 * "Quem está agindo" no painel do casal. Normalmente é o próprio usuário logado (RLS
 * da sessão). No modo suporte, um ADMIN logado age sobre a conta de um cliente: o
 * dono passa a ser o cliente e as consultas usam o service role, então TODO filtro
 * por dono tem que usar `ctx.ownerId` (nunca `sessionUser.id`) e toda escrita tem que
 * passar por `guardSupportWrite()` antes.
 */

type SessionDb = Awaited<ReturnType<typeof createClient>>;

export type SupportInfo = {
  adminId: string;
  targetUserId: string;
  /** Rótulo para a barra flutuante: nomes do casal, nome do perfil ou e-mail. */
  targetLabel: string;
  /** epoch em segundos */
  expiresAt: number;
};

export type ActingContext = {
  /** Quem está logado de verdade (o admin, no modo suporte). */
  sessionUser: User;
  /** Dono dos dados em uso: o cliente no modo suporte, senão o próprio usuário. */
  ownerId: string;
  support: SupportInfo | null;
  /** Sessão (RLS) normalmente; service role no modo suporte. */
  db: SessionDb;
};

/**
 * Resolve o contexto da requisição. O cookie de suporte só vale se: assinatura e validade
 * ok, o admin do cookie é o usuário da sessão, o papel dele AINDA é admin (consulta fresca)
 * e o alvo existe e não é admin. Qualquer falha cai no modo normal, em silêncio.
 */
export async function getActingContext(): Promise<ActingContext> {
  const sessionUser = await requireUser();
  const sessionDb = await createClient();
  const normal: ActingContext = { sessionUser, ownerId: sessionUser.id, support: null, db: sessionDb };

  const cookie = await readSupportCookie();
  if (!cookie || cookie.adminId !== sessionUser.id) return normal;

  // ponytail: cast — os dois clientes são SupabaseClient<Database> com os mesmos métodos.
  const admin = createAdminClient() as unknown as SessionDb;
  const [{ data: me }, { data: target }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", sessionUser.id).maybeSingle(),
    admin.from("profiles").select("id, role, name, email").eq("id", cookie.targetUserId).maybeSingle()
  ]);
  if (me?.role !== "admin" || !target || target.role === "admin") return normal;

  const { data: wedding } = await admin
    .from("weddings")
    .select("couple_names")
    .eq("owner_id", target.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    sessionUser,
    ownerId: target.id,
    db: admin,
    support: {
      adminId: sessionUser.id,
      targetUserId: target.id,
      targetLabel: wedding?.couple_names || target.name || target.email || "cliente",
      expiresAt: cookie.exp
    }
  };
}

/**
 * Escritas no modo suporte. "allowed": edição de conteúdo que o suporte pode fazer pelo
 * casal (registrada). "blocked": dinheiro, publicação, identidade/links públicos e
 * exclusões — nunca pelo admin em nome do cliente.
 */
export const SUPPORT_WRITES = {
  // permitidas
  autosave: "allowed",
  guests_add: "allowed",
  gifts_add: "allowed",
  gifts_edit: "allowed",
  gifts_toggle: "allowed",
  gifts_image: "allowed",
  gifts_import: "allowed",
  // bloqueadas
  pix_change: "blocked",
  slug_change: "blocked",
  profile_whatsapp: "blocked",
  guests_remove: "blocked",
  gifts_remove: "blocked",
  cash_gift_mark_received: "blocked",
  coordinator_link: "blocked",
  mercadopago: "blocked",
  publish: "blocked",
  publish_checkout: "blocked",
  wedding_create: "blocked",
  // Gerar com a IA muda o preço da publicação: só o casal decide.
  ai_generate: "blocked"
} as const;

export type SupportWrite = keyof typeof SUPPORT_WRITES;

export const SUPPORT_BLOCKED_MESSAGE = "Bloqueado no modo suporte. Só o casal pode fazer isso pela própria conta.";

/** Janela de agrupamento do registro de escritas permitidas (autosave dispara muito). */
const AUDIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Chame ANTES de qualquer escrita em actions/rotas do painel do casal.
 * Modo normal: sempre { ok: true }. Modo suporte: bloqueadas → { ok: false, message } +
 * evento support_blocked; permitidas → { ok: true } + evento support_action (no máximo um
 * por tipo a cada 15 min por conta).
 */
export async function guardSupportWrite(
  ctx: ActingContext,
  action: SupportWrite,
  weddingId?: string | null
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!ctx.support) return { ok: true };

  const base = {
    userId: ctx.ownerId,
    weddingId: weddingId ?? null,
    // targetUserId no detail: user_id/wedding_id viram null se a conta for apagada depois.
    detail: { adminId: ctx.support.adminId, targetUserId: ctx.ownerId, action }
  };

  if (SUPPORT_WRITES[action] === "blocked") {
    // info, não error: tentativa bloqueada é auditoria, não falha do sistema.
    await recordFunnelEvent({ ...base, event: "support_blocked" });
    return { ok: false, message: SUPPORT_BLOCKED_MESSAGE };
  }

  try {
    const since = new Date(Date.now() - AUDIT_WINDOW_MS).toISOString();
    const { data } = await ctx.db
      .from("funnel_events")
      .select("id")
      .eq("event", "support_action")
      .eq("user_id", ctx.ownerId)
      .gte("created_at", since)
      .contains("detail", { action })
      .limit(1);
    if (!data?.length) await recordFunnelEvent({ ...base, event: "support_action" });
  } catch {
    await recordFunnelEvent({ ...base, event: "support_action" });
  }
  return { ok: true };
}
