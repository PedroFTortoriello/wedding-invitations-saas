import Link from "next/link";
import { Fragment } from "react";
import { AdminShell } from "@/components/app/AdminShell";
import { Icon } from "@/components/app/icons";
import { Notice } from "@/components/app/Notice";
import { Avatar, EmptyState } from "@/components/app/Panel";
import { StatusBadge } from "@/components/app/StatusBadge";
import { SubmitButton } from "@/components/app/SubmitButton";
import { accountActionBlock, isHighStakes, type DeletionImpact } from "@/components/admin/account-deletion";
import { DeleteAccountForm } from "@/components/admin/DeleteAccountForm";
import {
  DAY_MS,
  currentTime,
  dayKey,
  detailField,
  fetchAll,
  fetchFunnelEvents,
  formatDate,
  formatDateTime,
  formatGap,
  formatRelative,
  funnelEventLabel,
  loadDeletionImpact,
  matchesQuery,
  summarizeAdminDetail,
  summarizeDetail,
  withParams
} from "@/components/admin/data";
import { DateTimeCell, FilterTabs, FunnelNotice, SearchForm, StatStrip, ViewAccountButton, td, th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { logServerError, type FunnelEventName } from "@/lib/funnel";
import { formatCurrency } from "@/lib/platform-data";
import { createClient } from "@/lib/supabase/server";
import { setUserRoleAction } from "./actions";

export const dynamic = "force-dynamic";

const ROLES = [
  { key: "todos", label: "Todos" },
  { key: "clientes", label: "Clientes" },
  { key: "admins", label: "Admins" }
] as const;
type RoleKey = (typeof ROLES)[number]["key"];

const PERIODS = [
  { key: "todos", label: "Todo o período" },
  { key: "hoje", label: "Hoje" },
  { key: "7-dias", label: "7 dias" },
  { key: "30-dias", label: "30 dias" }
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];

const pick = <K extends string>(options: readonly { key: K }[], value: string | undefined, fallback: K) =>
  options.some((option) => option.key === value) ? (value as K) : fallback;

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    papel?: string;
    periodo?: string;
    ordem?: string;
    usuario?: string;
    apagar?: string;
    apagada?: string;
    fotos?: string;
  }>;
}) {
  const me = await requireAdmin();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const role = pick(ROLES, params.papel, "todos");
  const period = pick(PERIODS, params.periodo, "todos");
  const oldestFirst = params.ordem === "antigos";
  const current = {
    q: q || undefined,
    papel: role === "todos" ? undefined : role,
    periodo: period === "todos" ? undefined : period,
    ordem: oldestFirst ? "antigos" : undefined
  };

  const supabase = await createClient();
  const [profiles, weddings] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from("profiles")
        .select("id, name, email, role, created_at")
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to)
    ),
    fetchAll((from, to) =>
      supabase
        .from("weddings")
        .select("id, owner_id, slug, couple_names, status, created_at, publish_paid_at")
        .order("created_at")
        .order("id")
        .range(from, to)
    )
  ]);

  const weddingsByOwner = new Map<string, typeof weddings>();
  for (const wedding of weddings) {
    weddingsByOwner.set(wedding.owner_id, [...(weddingsByOwner.get(wedding.owner_id) ?? []), wedding]);
  }

  const profileById = new Map(profiles.map((user) => [user.id, user]));
  const nameOf = (id: string) => {
    const user = profileById.get(id);
    return user ? (user.name && user.email ? `${user.name} (${user.email})` : user.name || user.email || undefined) : undefined;
  };

  const selected = profiles.find((user) => user.id === params.usuario);
  const selectedBlock = selected ? accountActionBlock({ adminId: me.id, targetId: selected.id, targetRole: selected.role }) : null;
  const confirmingDelete = Boolean(selected) && !selectedBlock && params.apagar === "1";
  const [journey, deletion] = await Promise.all([
    selected ? loadJourney(supabase, selected, weddingsByOwner.get(selected.id) ?? []) : null,
    confirmingDelete && selected
      ? loadDeletionImpact(selected.id).then(
          (impact) => ({ impact, failed: false }),
          async (error: unknown) => {
            await logServerError("admin.delete_account.preview", error, { path: "/admin/usuarios", detail: { adminId: me.id } });
            return { impact: null, failed: true };
          }
        )
      : null
  ]);

  const now = currentTime();
  const today = dayKey(new Date(now).toISOString());
  const matchesRole: Record<RoleKey, (user: (typeof profiles)[number]) => boolean> = {
    todos: () => true,
    clientes: (user) => user.role !== "admin",
    admins: (user) => user.role === "admin"
  };
  const matchesPeriod: Record<PeriodKey, (user: (typeof profiles)[number]) => boolean> = {
    todos: () => true,
    hoje: (user) => dayKey(user.created_at) === today,
    "7-dias": (user) => now - Date.parse(user.created_at) <= 7 * DAY_MS,
    "30-dias": (user) => now - Date.parse(user.created_at) <= 30 * DAY_MS
  };

  const searched = profiles.filter((user) => matchesQuery(q, user.name, user.email));
  const visible = searched.filter((user) => matchesRole[role](user) && matchesPeriod[period](user));
  if (oldestFirst) visible.reverse();

  // Contagens facetadas: cada grupo de filtros conta respeitando o outro.
  const roleTabs = ROLES.map((r) => ({
    key: r.key,
    label: r.label,
    count: searched.filter((user) => matchesRole[r.key](user) && matchesPeriod[period](user)).length,
    href: withParams("/admin/usuarios", { ...current, papel: r.key === "todos" ? undefined : r.key })
  }));
  const periodTabs = PERIODS.map((p) => ({
    ...p,
    count: searched.filter((user) => matchesRole[role](user) && matchesPeriod[p.key](user)).length,
    href: withParams("/admin/usuarios", { ...current, periodo: p.key === "todos" ? undefined : p.key })
  }));

  return (
    <AdminShell title="Usuários" subtitle="Contas de clientes e administradores, com data exata de cadastro e casamento vinculado." active="users">
      <div className="grid gap-5">
        {params.apagada === "1" ? (
          params.fotos === "falha" ? (
            <Notice tone="warn">
              Conta apagada, com o site e os dados do casal. Algumas fotos não saíram do armazenamento; a falha ficou registrada nos erros.
            </Notice>
          ) : (
            <Notice tone="success">Conta apagada, com o site, as fotos e todos os dados do casal.</Notice>
          )
        ) : null}
        <StatStrip
          label="Resumo de usuários"
          stats={[
            { label: "Contas", value: String(profiles.length), note: `${profiles.filter(matchesRole.admins).length} administradores` },
            { label: "Novas hoje", value: String(profiles.filter(matchesPeriod.hoje).length) },
            { label: "Últimos 7 dias", value: String(profiles.filter(matchesPeriod["7-dias"]).length) },
            { label: "Últimos 30 dias", value: String(profiles.filter(matchesPeriod["30-dias"]).length) },
            {
              label: "Com casamento",
              value: String(profiles.filter((user) => weddingsByOwner.has(user.id)).length)
            },
            {
              label: "Sem casamento",
              value: String(profiles.filter((user) => !weddingsByOwner.has(user.id)).length),
              note: "Criaram conta e pararam"
            }
          ]}
        />

        <section className="panel min-w-0" aria-labelledby="users-title">
          <div className="grid gap-3 px-5 pt-5 md:grid-cols-[1fr_minmax(0,24rem)] md:items-center">
            <div>
              <h2 id="users-title" className="text-base font-semibold">
                {visible.length} de {profiles.length} {profiles.length === 1 ? "conta" : "contas"}
              </h2>
              {q ? (
                <p className="mt-1 text-sm text-ink-soft">
                  Busca por “{q}”.{" "}
                  <Link
                    href={withParams("/admin/usuarios", { ...current, q: undefined })}
                    className="font-semibold text-forest underline-offset-2 hover:underline"
                  >
                    Limpar busca
                  </Link>
                </p>
              ) : null}
            </div>
            <SearchForm
              action="/admin/usuarios"
              q={q}
              label="Buscar usuários"
              placeholder="Nome ou e-mail"
              keep={{ papel: current.papel, periodo: current.periodo, ordem: current.ordem }}
            />
          </div>

          <FilterTabs label="Filtrar por papel" current={role} tabs={roleTabs} className="mt-4" />

          <nav aria-label="Filtrar por data de cadastro" className="flex flex-wrap items-center gap-1.5 border-b border-line px-5 py-3">
            <span className="mr-1 text-[0.8125rem] text-ink-soft">Cadastro:</span>
            {periodTabs.map((p) => {
              const active = p.key === period;
              return (
                <Link
                  key={p.key}
                  href={p.href}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest motion-reduce:transition-none ${
                    active ? "border-forest bg-forest text-on-forest" : "border-line-strong text-ink hover:bg-forest/6"
                  }`}
                >
                  {p.label}
                  <span className="tabular-nums opacity-90">{p.count}</span>
                </Link>
              );
            })}
          </nav>

          {profiles.length === 0 ? (
            <EmptyState icon="users" title="Nenhum usuário cadastrado ainda">
              Cada conta criada aparece aqui com data e hora do cadastro, papel e o casamento que ela criou.
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState icon="search" title="Nenhuma conta encontrada">
              {q ? `Nada corresponde a “${q}” com esses filtros.` : "Nenhuma conta com esses filtros."} Troque o papel, o período ou
              limpe a busca.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-4xl text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className={th}>
                      Usuário
                    </th>
                    <th scope="col" className={th}>
                      Papel
                    </th>
                    <th scope="col" className={th}>
                      Casamento
                    </th>
                    <th scope="col" className={th} aria-sort={oldestFirst ? "ascending" : "descending"}>
                      <Link
                        href={withParams("/admin/usuarios", { ...current, ordem: oldestFirst ? undefined : "antigos" })}
                        scroll={false}
                        className="-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-forest/6 hover:text-ink focus-visible:outline-2 focus-visible:outline-forest"
                      >
                        Cadastrado em
                        <Icon name="chevronDown" size={14} className={oldestFirst ? "rotate-180" : undefined} />
                        <span className="sr-only">{oldestFirst ? "(mais antigos primeiro)" : "(mais recentes primeiro)"}</span>
                      </Link>
                    </th>
                    <th scope="col" className={th}>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((user) => {
                    const isAdmin = user.role === "admin";
                    const owned = weddingsByOwner.get(user.id) ?? [];
                    const open = journey !== null && selected?.id === user.id;
                    return (
                      <Fragment key={user.id}>
                        <tr className={`transition-colors duration-150 motion-reduce:transition-none ${open ? "bg-forest/4" : "hover:bg-forest/3"}`}>
                          <td className={td}>
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar name={user.name || user.email || "?"} />
                              <div className="min-w-0">
                                <p className="max-w-64 truncate font-medium text-ink">{user.name || "Sem nome"}</p>
                                <p className="max-w-64 truncate text-[0.8125rem] text-ink-soft">{user.email ?? "Sem e-mail"}</p>
                              </div>
                            </div>
                          </td>
                          <td className={td}>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isAdmin ? "bg-forest text-on-forest" : "bg-forest/8 text-ink"
                              }`}
                            >
                              {isAdmin ? "Admin" : "Cliente"}
                            </span>
                          </td>
                          <td className={td}>
                            {owned.length === 0 ? (
                              <span className="text-ink-soft">Sem casamento</span>
                            ) : (
                              <ul className="grid gap-1.5">
                                {owned.map((wedding) => (
                                  <li key={wedding.id}>
                                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                      <Link
                                        href={withParams("/admin/casamentos", { q: wedding.slug })}
                                        className="font-medium text-ink underline decoration-line-strong underline-offset-2 hover:decoration-forest"
                                      >
                                        {wedding.couple_names}
                                      </Link>
                                      <StatusBadge status={wedding.status} />
                                    </span>
                                    <span className="block text-[0.8125rem] text-ink-soft">
                                      Criado {formatGap(Date.parse(wedding.created_at) - Date.parse(user.created_at))} após o cadastro
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                          <td className={td}>
                            <DateTimeCell iso={user.created_at} />
                          </td>
                          <td className={`${td} text-right`}>
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={withParams("/admin/usuarios", { ...current, usuario: open ? undefined : user.id })}
                                scroll={false}
                                className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-semibold text-forest transition-colors duration-150 hover:bg-forest/6 focus-visible:outline-2 focus-visible:outline-forest motion-reduce:transition-none"
                              >
                                {open ? "Ocultar" : "Jornada"}
                                <Icon name="chevronDown" size={15} className={open ? "rotate-180" : undefined} />
                              </Link>
                              {!isAdmin && user.id !== me.id ? (
                                <ViewAccountButton userId={user.id} label={owned[0]?.couple_names || user.name || user.email || "cliente"} />
                              ) : null}
                              {user.id === me.id ? (
                                <span className="inline-flex rounded-full border border-line-strong px-2.5 py-1 text-xs font-semibold text-ink-soft">
                                  Você
                                </span>
                              ) : (
                                <form action={setUserRoleAction}>
                                  <input type="hidden" name="userId" value={user.id} />
                                  <input type="hidden" name="role" value={isAdmin ? "client" : "admin"} />
                                  <SubmitButton
                                    className={`btn btn-sm whitespace-nowrap ${isAdmin ? "btn-ghost text-danger" : "btn-secondary"}`}
                                    pendingLabel="Salvando…"
                                  >
                                    {isAdmin ? "Remover admin" : "Tornar admin"}
                                  </SubmitButton>
                                </form>
                              )}
                            </div>
                          </td>
                        </tr>
                        {open ? (
                          <tr id="jornada" className="scroll-mt-20">
                            <td colSpan={5} className="bg-bg-2/60 px-5 py-5">
                              <AccountActions
                                userId={user.id}
                                label={owned[0]?.couple_names || user.name || user.email || "cliente"}
                                block={selectedBlock}
                                confirmHref={`${withParams("/admin/usuarios", { ...current, usuario: user.id, apagar: "1" })}#apagar`}
                                cancelHref={`${withParams("/admin/usuarios", { ...current, usuario: user.id })}#jornada`}
                                deletion={deletion}
                              />
                              <Journey {...journey} userId={user.id} nameOf={nameOf} now={now} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

type Supabase = Awaited<ReturnType<typeof createClient>>;
type OwnedWedding = { id: string; status: string; created_at: string; publish_paid_at: string | null };

/** Primeiro instante válido da lista (ou null). */
const earliest = (list: (string | null | undefined)[]) =>
  list.filter((iso): iso is string => Boolean(iso)).sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null;

/**
 * Onde a conta parou: marcos tirados dos dados reais (conta, casamento, pagamento, publicação)
 * mais os eventos de `funnel_events` (editor aberto, erros), que podem ainda não existir.
 * Marco sem registro conta como alcançado quando um posterior foi (ex.: contas antigas).
 */
async function loadJourney(supabase: Supabase, user: { id: string; created_at: string; role: string }, owned: OwnedWedding[]) {
  const weddingIds = owned.map((wedding) => wedding.id);
  // Eventos da conta ou do casamento dela (o webhook de pagamento pode gravar só o casamento).
  // Admin: também o que ele fez em outras contas (suporte, exclusões com user_id nulo).
  const scope = [
    `user_id.eq.${user.id}`,
    ...(weddingIds.length ? [`wedding_id.in.(${weddingIds.join(",")})`] : []),
    ...(user.role === "admin" ? [`detail->>adminId.eq.${user.id}`] : [])
  ].join(",");
  const [payments, events] = await Promise.all([
    weddingIds.length
      ? fetchAll((from, to) =>
          supabase.from("publish_payments").select("id, created_at").in("wedding_id", weddingIds).order("created_at").order("id").range(from, to)
        )
      : [],
    // Os 200 MAIS RECENTES (onde a conta parou), devolvidos em ordem cronológica.
    fetchFunnelEvents(() =>
      supabase
        .from("funnel_events")
        .select("id, created_at, event, level, detail, user_id")
        .or(scope)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(200)
    )
  ]);
  events.rows.reverse();

  // Marcos só com o que o próprio casal fez (eventos com adminId são do suporte).
  const eventAt = (name: FunnelEventName) =>
    events.rows.find((event) => event.event === name && !detailField(event.detail, "adminId"))?.created_at;
  const marks = [
    { label: "Conta criada", at: user.created_at },
    { label: "Casamento criado", at: earliest([...owned.map((w) => w.created_at), eventAt("wedding_created")]) },
    { label: "Editor aberto", at: earliest([eventAt("editor_opened")]) },
    { label: "Pagamento iniciado", at: earliest([payments[0]?.created_at, eventAt("publish_checkout_started")]) },
    { label: "Taxa paga", at: earliest([...owned.map((w) => w.publish_paid_at), eventAt("publish_paid")]) },
    { label: "Site publicado", at: earliest([eventAt("site_published")]), hit: owned.some((w) => w.status === "published") }
  ];
  const furthest = marks.findLastIndex((mark) => mark.at || mark.hit);
  return { steps: marks.map(({ label, at }) => ({ label, at })), furthest, events };
}

function Journey({
  steps,
  furthest,
  events,
  userId,
  nameOf,
  now
}: Awaited<ReturnType<typeof loadJourney>> & { userId: string; nameOf: (id: string) => string | undefined; now: number }) {
  const next = steps[furthest + 1];
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
      <div>
        <p className="t-eyebrow text-ink-soft">Parou em</p>
        <p className="mt-2 font-serif text-[1.625rem] leading-tight text-ink">{steps[furthest].label}</p>
        <p className="mt-1 text-[0.8125rem] text-ink-soft">{next ? `Próximo passo: ${next.label.toLowerCase()}` : "Jornada completa"}</p>
        <ol className="mt-4 grid" aria-label="Marcos da jornada">
          {steps.map((step, index) => {
            const reached = index <= furthest;
            const stopped = index === furthest + 1;
            return (
              <li key={step.label} className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 pb-3 last:pb-0">
                {index < steps.length - 1 ? (
                  <span aria-hidden className={`absolute bottom-0 left-2.5 top-6 w-px ${index < furthest ? "bg-forest" : "bg-line-strong"}`} />
                ) : null}
                <span
                  aria-hidden
                  className={`relative mt-0.5 grid size-5 place-items-center rounded-full ${
                    reached ? "bg-forest text-on-forest" : stopped ? "border-2 border-warn bg-warn-soft" : "border border-line-strong bg-surface"
                  }`}
                >
                  {reached ? <Icon name="check" size={12} /> : null}
                </span>
                <div className={stopped ? "-mx-2 -my-1 rounded-md bg-warn-soft px-2 py-1" : undefined}>
                  <p className={`text-sm font-semibold ${stopped ? "text-warn" : reached ? "text-ink" : "text-ink-soft"}`}>
                    {step.label}
                    <span className="sr-only">{reached ? " (alcançado)" : stopped ? " (parou aqui)" : " (não alcançado)"}</span>
                  </p>
                  <p className={`text-[0.8125rem] ${stopped ? "text-warn" : "text-ink-soft"}`}>
                    {step.at ? (
                      <>
                        <time dateTime={step.at}>{formatDateTime(step.at)}</time> · {formatRelative(step.at, now)}
                      </>
                    ) : reached ? (
                      "Sem data registrada"
                    ) : stopped ? (
                      "Parou aqui"
                    ) : (
                      "Não alcançado"
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="t-eyebrow text-ink-soft">Eventos</p>
          {events.rows.length ? <span className="text-[0.8125rem] tabular-nums text-ink-soft">{events.rows.length}</span> : null}
        </div>
        {events.problem ? (
          <FunnelNotice problem={events.problem} className="mt-3" />
        ) : events.rows.length === 0 ? (
          <p className="mt-3 text-sm leading-5 text-ink-soft">Nenhum evento registrado para esta conta.</p>
        ) : (
          <ol className="mt-2 divide-y divide-line">
            {events.rows.map((event) => {
              const isError = event.level === "error";
              const summary = summarizeAdminDetail(event, userId, nameOf) || summarizeDetail(event.detail);
              return (
                <li key={event.id} className="grid gap-x-4 py-2.5 text-sm sm:grid-cols-[11.5rem_minmax(0,1fr)]">
                  <time dateTime={event.created_at} className="whitespace-nowrap tabular-nums text-ink-soft">
                    {formatDateTime(event.created_at)}
                  </time>
                  <div className="min-w-0">
                    <p className={`flex flex-wrap items-center gap-x-2 font-medium ${isError ? "text-danger" : "text-ink"}`}>
                      {funnelEventLabel(event.event)}
                      {isError ? <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">Erro</span> : null}
                    </p>
                    {summary ? (
                      <p className="line-clamp-2 text-[0.8125rem] text-ink-soft wrap-break-word" title={summary}>
                        {summary}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

/**
 * Ações sobre a conta aberta: "Ver conta" (modo suporte) e "Apagar conta", que abre a
 * confirmação inline (?apagar=1) com o impacto calculado no servidor.
 */
function AccountActions({
  userId,
  label,
  block,
  confirmHref,
  cancelHref,
  deletion
}: {
  userId: string;
  label: string;
  block: "self" | "admin" | null;
  confirmHref: string;
  cancelHref: string;
  deletion: { impact: DeletionImpact | null; failed: boolean } | null;
}) {
  return (
    <div className="mb-6 grid gap-4 border-b border-line pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="t-eyebrow text-ink-soft">Conta</p>
          <p className="mt-1 text-sm leading-5 text-ink-soft">
            {block === "self"
              ? "Esta é a sua conta: não abre no modo suporte e não pode ser apagada por aqui."
              : block === "admin"
                ? "Conta de administrador: não abre no modo suporte e não pode ser apagada."
                : "Ver conta abre o painel do casal como ele vê. Dinheiro, publicação, links públicos e exclusões ficam bloqueados."}
          </p>
        </div>
        {block ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <ViewAccountButton userId={userId} label={label} />
            {deletion ? null : (
              <Link href={confirmHref} className="btn btn-sm btn-ghost whitespace-nowrap text-danger">
                <Icon name="trash" size={16} />
                Apagar conta
              </Link>
            )}
          </div>
        )}
      </div>
      {deletion ? <DeleteConfirm userId={userId} cancelHref={cancelHref} {...deletion} /> : null}
    </div>
  );
}

function DeleteConfirm({
  userId,
  cancelHref,
  impact,
  failed
}: {
  userId: string;
  cancelHref: string;
  impact: DeletionImpact | null;
  failed: boolean;
}) {
  const wedding = impact?.wedding;
  const stakes = impact && isHighStakes(impact)
    ? [
        wedding?.status === "published" && "o site está no ar e os convidados perdem o acesso",
        wedding?.publishPaidAt &&
          (impact.paymentsPaidCents > 0
            ? `a taxa de publicação foi paga em ${formatDate(wedding.publishPaidAt)} (${formatCurrency(impact.paymentsPaidCents / 100)})`
            : `a publicação foi liberada em ${formatDate(wedding.publishPaidAt)}`),
        impact.cashGiftsPaid > 0 &&
          `${impact.cashGiftsPaid} ${impact.cashGiftsPaid === 1 ? "presente já foi pago" : "presentes já foram pagos"} (${formatCurrency(impact.cashGiftsPaidTotal)}) e o histórico some`
      ].filter((item): item is string => Boolean(item))
    : [];
  const count = (value: number, one: string, many: string) => `${value} ${value === 1 ? one : many}`;

  return (
    <section
      id="apagar"
      aria-labelledby="apagar-title"
      className="scroll-mt-20 rounded-xl border border-danger/30 bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <p className="t-eyebrow text-danger">Apagar conta</p>
          <h3 id="apagar-title" className="mt-1.5 font-serif text-[1.375rem] leading-tight text-ink">
            Isso apaga a conta, o site e todos os dados do casal. Não dá para desfazer.
          </h3>
        </div>
        <Link href={cancelHref} className="btn btn-sm btn-ghost">
          Cancelar
        </Link>
      </div>

      {failed ? (
        <Notice tone="error" className="mt-4">
          Não foi possível calcular o que será apagado. Nada foi apagado; recarregue a página para tentar de novo.
        </Notice>
      ) : !impact ? (
        <Notice tone="warn" className="mt-4">
          Conta não encontrada no login. Ela pode já ter sido apagada.
        </Notice>
      ) : (
        <>
          {stakes.length ? (
            <div role="note" className="mt-4 rounded-lg border-l-4 border-danger bg-danger/8 px-4 py-3 text-sm leading-5 text-ink">
              <p className="font-semibold text-danger">Atenção: esta conta tem dinheiro ou site no ar.</p>
              <ul className="mt-1.5 list-disc pl-5">
                {stakes.map((item) => (
                  <li key={item}>{item.charAt(0).toUpperCase() + item.slice(1)}.</li>
                ))}
              </ul>
            </div>
          ) : null}

          <dl className="mt-4 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "E-mail", value: impact.email ?? "Sem e-mail" },
              { label: "Casal", value: wedding?.coupleNames || impact.name || "Sem casamento" },
              {
                label: "Site",
                value: wedding ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="wrap-break-word">/casamento/{wedding.slug}</span>
                    <StatusBadge status={wedding.status} />
                  </span>
                ) : (
                  "Nenhum"
                )
              },
              {
                label: "Taxa de publicação",
                value: wedding?.publishPaidAt
                  ? impact.paymentsPaidCents > 0
                    ? `Paga em ${formatDate(wedding.publishPaidAt)} · ${formatCurrency(impact.paymentsPaidCents / 100)}`
                    : `Cortesia, liberada em ${formatDate(wedding.publishPaidAt)}`
                  : "Não paga"
              },
              { label: "Convidados", value: count(impact.guests, "convidado", "convidados") },
              { label: "Recados", value: count(impact.messages, "recado", "recados") },
              {
                label: "Presentes em dinheiro",
                value: `${count(impact.cashGifts, "registro", "registros")} · ${impact.cashGiftsPaid} pagos (${formatCurrency(impact.cashGiftsPaidTotal)})`
              },
              { label: "Cotas de presente", value: count(impact.giftCotas, "cota", "cotas") },
              {
                label: "Fotos no armazenamento",
                value: impact.photosListFailed ? "Não foi possível contar" : count(impact.photoPaths.length, "arquivo", "arquivos")
              },
              { label: "Mercado Pago", value: impact.mpConnected ? "Conectado (a conexão será removida)" : "Não conectado" }
            ].map((item) => (
              <div key={item.label} className="grid min-w-0 content-start gap-0.5 bg-surface px-4 py-3">
                <dt className="text-[0.8125rem] text-ink-soft">{item.label}</dt>
                <dd className="text-sm font-medium text-ink wrap-break-word">{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5">
            {impact.email ? (
              <DeleteAccountForm userId={userId} email={impact.email} />
            ) : (
              <Notice tone="warn">Conta sem e-mail: a exclusão precisa do e-mail para confirmar e não pode ser feita por aqui.</Notice>
            )}
          </div>
        </>
      )}
    </section>
  );
}
