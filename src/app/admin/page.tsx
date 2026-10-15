import Link from "next/link";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/app/AdminShell";
import { Icon, type IconName } from "@/components/app/icons";
import { Avatar, EmptyState, PanelHeader } from "@/components/app/Panel";
import { StatusBadge } from "@/components/app/StatusBadge";
import {
  ADMIN_WEDDING_COLUMNS,
  DAY_MS,
  countBy,
  currentTime,
  dayKey,
  daysUntil,
  detailField,
  fetchAll,
  fetchFunnelEvents,
  formatDate,
  formatDateTime,
  formatPercent,
  formatRelative,
  funnelEventLabel,
  getMpConnections,
  isRealGift,
  journeyHref,
  lastDays,
  lastMonths,
  monthKey,
  sumBy,
  templateIdOf,
  withParams
} from "@/components/admin/data";
import { BarList, FunnelNotice, PaymentBadge, StatStrip } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/platform-data";
import { countsForRevenue } from "./revenue-cutoffs";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATE_IDS, TEMPLATE_NAMES } from "@/lib/wedding";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createClient();
  const now = currentTime();

  // Tudo em paralelo; contagens simples vão como HEAD (sem trazer linhas).
  const [
    profiles,
    weddings,
    payments,
    gifts,
    guestsTotal,
    guestsConfirmed,
    guestsDeclined,
    messagesTotal,
    mpConnections,
    recentErrors,
    errorsTotal,
    recentSignups
  ] = await Promise.all([
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
        .select(ADMIN_WEDDING_COLUMNS)
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to)
    ),
    fetchAll((from, to) =>
      supabase
        .from("publish_payments")
        .select("id, wedding_id, amount_cents, status, provider, paid_at, created_at")
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to)
    ),
    fetchAll((from, to) =>
      supabase
        .from("cash_gifts")
        .select("id, wedding_id, gross_amount, status, payment_method, provider_payment_id, created_at")
        .order("id")
        .range(from, to)
    ),
    supabase.from("guests").select("id", { count: "exact", head: true }),
    supabase.from("guests").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("guests").select("id", { count: "exact", head: true }).eq("status", "declined"),
    supabase.from("messages").select("id", { count: "exact", head: true }),
    getMpConnections(),
    // funnel_events pode não existir ainda (migration 0011): leituras que não lançam.
    // Só as 10 mais recentes + o total: um endpoint público enchendo a tabela não trava o admin.
    fetchFunnelEvents(() =>
      supabase
        .from("funnel_events")
        .select("id, created_at, user_id, event, detail")
        .eq("level", "error")
        .gte("created_at", new Date(now - DAY_MS).toISOString())
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(10)
    ),
    supabase
      .from("funnel_events")
      .select("id", { count: "exact", head: true })
      .eq("level", "error")
      .gte("created_at", new Date(now - DAY_MS).toISOString()),
    fetchFunnelEvents((from, to) =>
      supabase
        .from("funnel_events")
        .select("id, user_id, detail")
        .eq("event", "signup_completed")
        .gte("created_at", new Date(now - 30 * DAY_MS).toISOString())
        .order("id")
        .range(from, to)
    )
  ]);

  const weddingById = new Map(weddings.map((wedding) => [wedding.id, wedding]));
  const ownersOf = (list: typeof weddings) => new Set(list.map((wedding) => wedding.owner_id)).size;

  // Receita (taxa de publicação)
  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const paidAt = (payment: (typeof payments)[number]) => payment.paid_at ?? payment.created_at;
  const revenue = sumBy(paidPayments, (payment) => payment.amount_cents) / 100;
  const recentPaid = paidPayments.filter((payment) => now - Date.parse(paidAt(payment)) <= 30 * DAY_MS);
  const revenue30 = sumBy(recentPaid, (payment) => payment.amount_cents) / 100;
  const paidWeddingIds = new Set(paidPayments.map((payment) => payment.wedding_id));

  // Funil (em pessoas: um dono pode ter mais de um casamento)
  const published = weddings.filter((wedding) => wedding.status === "published");
  const feeSettled = weddings.filter((wedding) => wedding.publish_paid_at);
  const courtesy = feeSettled.filter((wedding) => !paidWeddingIds.has(wedding.id)).length;
  const funnel = [
    { key: "signup", label: "Criaram conta", value: profiles.length },
    { key: "wedding", label: "Criaram um casamento", value: ownersOf(weddings) },
    { key: "fee", label: "Quitaram a taxa", value: ownersOf(feeSettled) },
    { key: "published", label: "Publicaram o site", value: ownersOf(published) }
  ];
  const publishedOwners = funnel[3].value;

  // Cadastros por dia (mais recente primeiro)
  const signupsByDay = countBy(profiles, (profile) => dayKey(profile.created_at));
  const days = lastDays(14, now).reverse();
  const signups14 = sumBy(days, (day) => signupsByDay.get(day.key) ?? 0);
  const signups7 = sumBy(days.slice(0, 7), (day) => signupsByDay.get(day.key) ?? 0);

  // Por mês
  const monthsSignups = countBy(profiles, (profile) => monthKey(profile.created_at));
  const monthsWeddings = countBy(weddings, (wedding) => monthKey(wedding.created_at));
  const monthsPaid = countBy(paidPayments, (payment) => monthKey(paidAt(payment)));
  const monthsRevenue = new Map<string, number>();
  for (const payment of paidPayments) {
    const key = monthKey(paidAt(payment));
    monthsRevenue.set(key, (monthsRevenue.get(key) ?? 0) + payment.amount_cents / 100);
  }
  const months = lastMonths(6, now).reverse();
  const maxMonthRevenue = Math.max(1, ...months.map((month) => monthsRevenue.get(month.key) ?? 0));

  // Modelos
  const templateCounts = countBy(weddings, (wedding) => templateIdOf(wedding.template));
  const templateBars = TEMPLATE_IDS.map((id) => {
    const value = templateCounts.get(id) ?? 0;
    return { key: id, label: TEMPLATE_NAMES[id], value, display: String(value), detail: formatPercent(value, weddings.length) };
  }).sort((a, b) => b.value - a.value);

  // Presentes (informativo: a plataforma não fica com nada)
  const realGifts = gifts.filter((gift) => isRealGift(gift) && countsForRevenue(gift, gift.wedding_id));
  const paidGifts = realGifts.filter((gift) => gift.status === "paid");
  const isCard = (gift: (typeof gifts)[number]) => gift.payment_method === "card";
  const pixReceived = sumBy(paidGifts.filter((gift) => !isCard(gift)), (gift) => Number(gift.gross_amount));
  const cardReceived = sumBy(paidGifts.filter(isCard), (gift) => Number(gift.gross_amount));
  const giftsTotal = pixReceived + cardReceived;
  const pendingPix = realGifts.filter((gift) => gift.status === "pending" && !isCard(gift));
  const cardActive = mpConnections.filter((connection) => connection.status === "active").length;

  // Convidados
  const guests = guestsTotal.count ?? 0;
  const confirmed = guestsConfirmed.count ?? 0;
  const declined = guestsDeclined.count ?? 0;

  // Precisa de atenção
  const weddingLink = (slug: string) => withParams("/admin/casamentos", { q: slug });
  const issues: { key: string; kind: string; couple: string; detail: string; href: string }[] = [];
  for (const wedding of feeSettled) {
    if (wedding.status === "published") continue;
    issues.push({
      key: `fee-${wedding.id}`,
      kind: paidWeddingIds.has(wedding.id) ? "Taxa paga, site não publicado" : "Cortesia liberada, site não publicado",
      couple: wedding.couple_names,
      detail: `Quitada em ${formatDateTime(wedding.publish_paid_at)}`,
      href: weddingLink(wedding.slug)
    });
  }
  for (const connection of mpConnections) {
    const wedding = weddingById.get(connection.wedding_id);
    if (!wedding || connection.status === "revoked" || (connection.status !== "error" && !connection.last_error)) continue;
    issues.push({
      key: `mp-${connection.wedding_id}`,
      kind: "Erro no Mercado Pago",
      couple: wedding.couple_names,
      detail: connection.last_error ?? `Conexão com erro desde ${formatDateTime(connection.updated_at)}`,
      href: weddingLink(wedding.slug)
    });
  }
  const abandoned = new Set<string>();
  for (const payment of payments) {
    const age = now - Date.parse(payment.created_at);
    const wedding = weddingById.get(payment.wedding_id);
    if (payment.status !== "pending" || age < DAY_MS || age > 30 * DAY_MS || !wedding || wedding.publish_paid_at) continue;
    if (abandoned.has(wedding.id)) continue; // pagamentos vêm do mais novo: só o último checkout por casamento
    abandoned.add(wedding.id);
    issues.push({
      key: `checkout-${payment.id}`,
      kind: "Checkout da taxa sem pagamento",
      couple: wedding.couple_names,
      detail: `Aberto ${formatRelative(payment.created_at, now)}, em ${formatDateTime(payment.created_at)}`,
      href: weddingLink(wedding.slug)
    });
  }

  // Contas de clientes com mais de 30 minutos e nenhum casamento (a criação é automática).
  const ownerIds = new Set(weddings.map((wedding) => wedding.owner_id));
  const withoutWedding = profiles.filter(
    (profile) => profile.role !== "admin" && !ownerIds.has(profile.id) && now - Date.parse(profile.created_at) > 30 * 60_000
  );

  // Cadastros por origem (30 dias): UTM gravada no signup_completed, e quem seguiu no funil.
  const paidOwners = new Set(weddings.filter((wedding) => paidWeddingIds.has(wedding.id)).map((wedding) => wedding.owner_id));
  const origins = new Map<string, { source?: string; campaign?: string; users: Set<string> }>();
  for (const signup of recentSignups.rows) {
    if (!signup.user_id) continue; // conta apagada
    const source = detailField(signup.detail, "utm_source");
    const campaign = detailField(signup.detail, "utm_campaign");
    const key = JSON.stringify([source, campaign]);
    const origin = origins.get(key) ?? { source, campaign, users: new Set<string>() };
    origin.users.add(signup.user_id);
    origins.set(key, origin);
  }
  const originRows = [...origins.entries()]
    .map(([key, { source, campaign, users }]) => ({
      key,
      source,
      campaign,
      signups: users.size,
      withWedding: [...users].filter((id) => ownerIds.has(id)).length,
      paid: [...users].filter((id) => paidOwners.has(id)).length
    }))
    .sort((a, b) => b.signups - a.signups);
  const trackedSignups = new Set(recentSignups.rows.map((signup) => signup.user_id));
  const untrackedSignups = profiles.filter(
    (profile) => now - Date.parse(profile.created_at) <= 30 * DAY_MS && !trackedSignups.has(profile.id)
  ).length;
  const errorCount = errorsTotal.count ?? recentErrors.rows.length;
  const attentionCount = issues.length + withoutWedding.length + errorCount;

  const upcoming = weddings
    .map((wedding) => ({ wedding, days: daysUntil(wedding.wedding_date, now) }))
    .filter((item): item is { wedding: (typeof weddings)[number]; days: number } => item.days !== null && item.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  return (
    <AdminShell
      title="Operação"
      subtitle="Cadastros, publicações, receita e uso da plataforma, calculados a cada acesso."
      active="overview"
    >
      <div className="grid gap-5">
        <StatStrip
          label="Resumo da plataforma"
          stats={[
            { label: "Usuários", value: String(profiles.length), note: `${signups7} nos últimos 7 dias` },
            { label: "Casamentos criados", value: String(weddings.length), note: `${ownersOf(weddings)} contas com casamento` },
            { label: "Publicados", value: String(published.length), note: `${formatPercent(published.length, weddings.length)} dos casamentos` },
            {
              label: "Conversão cadastro → publicado",
              value: formatPercent(publishedOwners, profiles.length),
              note: `${publishedOwners} de ${profiles.length} contas`
            },
            { label: "Receita de publicação", value: formatCurrency(revenue), note: `${paidPayments.length} taxas pagas` },
            { label: "Receita (30 dias)", value: formatCurrency(revenue30), note: `${recentPaid.length} taxas no período` }
          ]}
        />

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="grid min-w-0 gap-5">
            <section className="panel" aria-labelledby="funnel-title">
              <div className="px-5 pt-5">
                <h2 id="funnel-title" className="text-base font-semibold">
                  Funil de conversão
                </h2>
                <p className="mt-1 text-sm leading-5 text-ink-soft">Contas em cada etapa, em % do total de cadastros.</p>
              </div>
              <div className="px-5 pb-5 pt-4">
                <BarList
                  label="Funil de conversão"
                  items={funnel.map((step) => ({
                    ...step,
                    display: String(step.value),
                    detail: formatPercent(step.value, profiles.length)
                  }))}
                />
                <p className="mt-4 border-t border-line pt-3 text-[0.8125rem] leading-5 text-ink-soft">
                  {courtesy > 0
                    ? `${courtesy} ${courtesy === 1 ? "casamento liberado" : "casamentos liberados"} como cortesia, sem pagamento.`
                    : "Nenhuma publicação liberada como cortesia."}{" "}
                  Etapas entre si: {formatPercent(funnel[1].value, funnel[0].value)} criam casamento,{" "}
                  {formatPercent(funnel[2].value, funnel[1].value)} quitam a taxa, {formatPercent(funnel[3].value, funnel[2].value)}{" "}
                  publicam.
                </p>
              </div>
            </section>

            <section className="panel min-w-0" aria-labelledby="origins-title">
              <div className="px-5 pt-5">
                <h2 id="origins-title" className="text-base font-semibold">
                  Cadastros por origem (30 dias)
                </h2>
                <p className="mt-1 text-sm leading-5 text-ink-soft">Campanha (UTM) do primeiro acesso e quantos seguiram no funil.</p>
              </div>
              {recentSignups.problem ? (
                <FunnelNotice problem={recentSignups.problem} className="mx-5 mb-5 mt-4" />
              ) : originRows.length === 0 ? (
                <p className="px-5 pb-5 pt-3 text-sm leading-5 text-ink-soft">Nenhum cadastro registrado nos últimos 30 dias.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-left">
                    <thead>
                      <tr className="border-y border-line text-[0.8125rem] text-ink-soft">
                        <th scope="col" className="py-2.5 pl-5 font-medium">
                          Origem
                        </th>
                        <th scope="col" className="px-3 py-2.5 font-medium">
                          Campanha
                        </th>
                        <th scope="col" className="px-3 py-2.5 text-right font-medium">
                          Cadastros
                        </th>
                        <th scope="col" className="px-3 py-2.5 text-right font-medium">
                          Criaram casamento
                        </th>
                        <th scope="col" className="py-2.5 pl-3 pr-5 text-right font-medium">
                          Pagaram a taxa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-sm tabular-nums">
                      {originRows.map((row) => (
                        <tr key={row.key}>
                          <th scope="row" className="max-w-48 py-2.5 pl-5 font-medium text-ink wrap-break-word">
                            {row.source ?? (row.campaign ? "Sem origem" : "Direto / sem campanha")}
                          </th>
                          <td className="max-w-48 px-3 py-2.5 text-ink wrap-break-word">{row.campaign ?? "—"}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-ink">{row.signups}</td>
                          <td className="px-3 py-2.5 text-right text-ink">
                            {row.withWedding} <span className="text-ink-soft">{formatPercent(row.withWedding, row.signups)}</span>
                          </td>
                          <td className="py-2.5 pl-3 pr-5 text-right text-ink">
                            {row.paid} <span className="text-ink-soft">{formatPercent(row.paid, row.signups)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!recentSignups.problem && untrackedSignups > 0 ? (
                <p className="border-t border-line px-5 py-3 text-[0.8125rem] leading-5 text-ink-soft">
                  {untrackedSignups} {untrackedSignups === 1 ? "cadastro" : "cadastros"} dos últimos 30 dias sem evento registrado (anteriores à
                  medição ou falha ao gravar).
                </p>
              ) : null}
            </section>
          </div>

          <section className="panel min-w-0" aria-labelledby="issues-title">
            <div className="flex items-baseline justify-between gap-3 px-5 pt-5">
              <h2 id="issues-title" className="text-base font-semibold">
                Precisa de atenção
              </h2>
              {attentionCount ? <span className="text-sm tabular-nums text-ink-soft">{attentionCount}</span> : null}
            </div>

            <AttentionGroup title="Pagamento e publicação" count={issues.length}>
              {issues.length === 0 ? (
                <AttentionEmpty>Nenhuma taxa paga sem site, checkout abandonado ou erro no Mercado Pago.</AttentionEmpty>
              ) : (
                <ul className="divide-y divide-line px-2">
                  {issues.slice(0, 8).map((issue) => (
                    <li key={issue.key}>
                      <AttentionRow href={issue.href} kind={issue.kind} title={issue.couple} detail={issue.detail} />
                    </li>
                  ))}
                  {issues.length > 8 ? (
                    <li className="px-3 py-2.5 text-[0.8125rem] text-ink-soft">
                      E mais {issues.length - 8}. Veja em{" "}
                      <Link href="/admin/casamentos?status=paid_unpublished" className="font-semibold text-forest underline-offset-2 hover:underline">
                        Casamentos
                      </Link>
                      .
                    </li>
                  ) : null}
                </ul>
              )}
            </AttentionGroup>

            <AttentionGroup title="Contas sem casamento" count={withoutWedding.length}>
              {withoutWedding.length === 0 ? (
                <AttentionEmpty>Toda conta com mais de 30 minutos já tem casamento.</AttentionEmpty>
              ) : (
                <ul className="divide-y divide-line px-2">
                  {withoutWedding.slice(0, 6).map((profile) => (
                    <li key={profile.id}>
                      <AttentionRow
                        href={journeyHref(profile.id)}
                        icon="users"
                        title={profile.name || profile.email || "Sem nome"}
                        detail={
                          <>
                            {profile.name && profile.email ? `${profile.email} · ` : ""}
                            Cadastro em <time dateTime={profile.created_at}>{formatDateTime(profile.created_at)}</time>,{" "}
                            {formatRelative(profile.created_at, now)}
                          </>
                        }
                      />
                    </li>
                  ))}
                  {withoutWedding.length > 6 ? (
                    <li className="px-3 py-2.5 text-[0.8125rem] text-ink-soft">
                      E mais {withoutWedding.length - 6}. Veja em{" "}
                      <Link href="/admin/usuarios" className="font-semibold text-forest underline-offset-2 hover:underline">
                        Usuários
                      </Link>
                      .
                    </li>
                  ) : null}
                </ul>
              )}
            </AttentionGroup>

            <AttentionGroup title="Erros nas últimas 24h" count={errorCount}>
              {recentErrors.problem ? (
                <FunnelNotice problem={recentErrors.problem} className="mx-5 mb-4" />
              ) : recentErrors.rows.length === 0 ? (
                <AttentionEmpty>Nenhuma falha registrada pelo servidor.</AttentionEmpty>
              ) : (
                <ul className="divide-y divide-line px-2">
                  {recentErrors.rows.map((error) => {
                    const scope = detailField(error.detail, "scope");
                    const code = detailField(error.detail, "code");
                    return (
                      <li key={error.id}>
                        <AttentionRow
                          tone="danger"
                          href={error.user_id ? journeyHref(error.user_id) : undefined}
                          kind={funnelEventLabel(error.event)}
                          title={detailField(error.detail, "message") ?? scope ?? "Sem mensagem"}
                          detail={
                            <>
                              {[scope, code && `código ${code}`, formatDateTime(error.created_at)].filter(Boolean).join(" · ")},{" "}
                              {formatRelative(error.created_at, now)}
                            </>
                          }
                        />
                      </li>
                    );
                  })}
                  {errorCount > recentErrors.rows.length ? (
                    <li className="px-3 py-2.5 text-[0.8125rem] text-ink-soft">E mais {errorCount - recentErrors.rows.length} nas últimas 24h.</li>
                  ) : null}
                </ul>
              )}
            </AttentionGroup>
          </section>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <section className="panel" aria-labelledby="daily-title">
            <div className="flex items-baseline justify-between gap-3 px-5 pt-5">
              <h2 id="daily-title" className="text-base font-semibold">
                Cadastros por dia
              </h2>
              <span className="text-sm text-ink-soft">
                <strong className="font-semibold tabular-nums text-ink">{signups14}</strong> em 14 dias
              </span>
            </div>
            <div className="px-5 pb-5 pt-4">
              <BarList
                compact
                label="Cadastros por dia, últimos 14 dias"
                items={days.map((day, index) => {
                  const value = signupsByDay.get(day.key) ?? 0;
                  return { key: day.key, label: index === 0 ? "Hoje" : index === 1 ? "Ontem" : day.label, value, display: String(value) };
                })}
              />
            </div>
          </section>

          <section className="panel">
            <PanelHeader title="Últimos cadastros" href="/admin/usuarios" linkLabel="Ver usuários" />
            {profiles.length === 0 ? (
              <EmptyState icon="users" title="Nenhum cadastro ainda">
                Cada conta criada aparece aqui com data e hora exatas, e se já criou um casamento.
              </EmptyState>
            ) : (
              <ul className="mt-2 divide-y divide-line px-5 pb-2">
                {profiles.slice(0, 8).map((profile) => (
                  <li key={profile.id} className="flex items-center gap-3 py-2.5">
                    <Avatar name={profile.name || profile.email || "?"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.9375rem] font-medium text-ink">{profile.name || profile.email || "Sem nome"}</p>
                      <p className="truncate text-[0.8125rem] text-ink-soft">
                        {profile.name && profile.email ? `${profile.email} · ` : ""}
                        {ownerIds.has(profile.id) ? "Criou casamento" : "Sem casamento"}
                      </p>
                    </div>
                    <div className="grid shrink-0 justify-items-end text-right">
                      <time dateTime={profile.created_at} className="text-[0.8125rem] text-ink">
                        {formatDateTime(profile.created_at)}
                      </time>
                      <span className="text-[0.8125rem] text-ink-soft">{formatRelative(profile.created_at, now)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section className="panel min-w-0" aria-labelledby="months-title">
            <div className="px-5 pt-5">
              <h2 id="months-title" className="text-base font-semibold">
                Últimos 6 meses
              </h2>
              <p className="mt-1 text-sm leading-5 text-ink-soft">Taxas contam no mês do pagamento.</p>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left">
                <thead>
                  <tr className="border-y border-line text-[0.8125rem] text-ink-soft">
                    <th scope="col" className="py-2.5 pl-5 font-medium">
                      Mês
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">
                      Cadastros
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">
                      Casamentos
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">
                      Taxas pagas
                    </th>
                    <th scope="col" className="py-2.5 pl-3 pr-5 font-medium">
                      Receita
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm tabular-nums">
                  {months.map((month) => {
                    const monthRevenue = monthsRevenue.get(month.key) ?? 0;
                    return (
                      <tr key={month.key}>
                        <th scope="row" className="py-2.5 pl-5 font-medium text-ink">
                          {month.label}
                        </th>
                        <td className="px-3 py-2.5 text-right text-ink">{monthsSignups.get(month.key) ?? 0}</td>
                        <td className="px-3 py-2.5 text-right text-ink">{monthsWeddings.get(month.key) ?? 0}</td>
                        <td className="px-3 py-2.5 text-right text-ink">{monthsPaid.get(month.key) ?? 0}</td>
                        <td className="py-2.5 pl-3 pr-5">
                          <span className="flex items-center gap-3">
                            <span className="w-24 shrink-0 font-semibold text-ink">{formatCurrency(monthRevenue)}</span>
                            <span className="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-forest/8" aria-hidden>
                              <span
                                className="block h-full rounded-full bg-forest"
                                style={{ width: `${monthRevenue > 0 ? Math.max(2, (monthRevenue / maxMonthRevenue) * 100) : 0}%` }}
                              />
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" aria-labelledby="templates-title">
            <div className="flex items-start justify-between gap-3 px-5 pt-5">
              <div>
                <h2 id="templates-title" className="text-base font-semibold">
                  Modelos em uso
                </h2>
                <p className="mt-1 text-sm leading-5 text-ink-soft">Casamentos por modelo escolhido.</p>
              </div>
              <Link
                href="/admin/templates"
                className="-mr-1.5 inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-1 text-sm font-semibold text-forest hover:bg-forest/6"
              >
                Modelos
                <Icon name="chevronRight" size={15} />
              </Link>
            </div>
            <div className="px-5 pb-5 pt-4">
              {weddings.length === 0 ? (
                <p className="text-sm leading-5 text-ink-soft">
                  Quando os casais criarem sites, a distribuição por modelo aparece aqui.
                </p>
              ) : (
                <BarList label="Casamentos por modelo" items={templateBars} />
              )}
            </div>
          </section>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section className="panel p-5" aria-labelledby="gifts-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="gifts-title" className="text-base font-semibold">
                  Presentes recebidos pelos casais
                </h2>
                <p className="mt-1 text-sm leading-5 text-ink-soft">Informativo: a plataforma fica com 0% dos presentes.</p>
              </div>
              <Link
                href="/admin/pacotes"
                className="-mr-1.5 inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-1 text-sm font-semibold text-forest hover:bg-forest/6"
              >
                Por casamento
                <Icon name="chevronRight" size={15} />
              </Link>
            </div>
            <p className="mt-4 font-serif text-[2.25rem] leading-none tabular-nums text-ink">{formatCurrency(giftsTotal)}</p>
            <p className="mt-1.5 text-sm text-ink-soft">
              {paidGifts.length} {paidGifts.length === 1 ? "presente pago" : "presentes pagos"}
            </p>
            <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-forest/8" aria-hidden>
              <span className="h-full bg-forest" style={{ width: `${giftsTotal ? (pixReceived / giftsTotal) * 100 : 0}%` }} />
              <span className="h-full bg-gold" style={{ width: `${giftsTotal ? (cardReceived / giftsTotal) * 100 : 0}%` }} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 text-ink-soft">
                  <span className="size-2 rounded-full bg-forest" aria-hidden />
                  Via Pix
                </dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">{formatCurrency(pixReceived)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-ink-soft">
                  <span className="size-2 rounded-full bg-gold" aria-hidden />
                  No cartão
                </dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">{formatCurrency(cardReceived)}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Pix a confirmar pelos casais</dt>
                <dd className={`mt-0.5 font-semibold tabular-nums ${pendingPix.length ? "text-warn" : "text-ink"}`}>
                  {pendingPix.length} · {formatCurrency(sumBy(pendingPix, (gift) => Number(gift.gross_amount)))}
                </dd>
              </div>
              <div>
                <dt className="text-ink-soft">Casais com cartão ativo</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">{cardActive}</dd>
              </div>
            </dl>
          </section>

          <section className="panel p-5" aria-labelledby="rsvp-title">
            <h2 id="rsvp-title" className="text-base font-semibold">
              Convidados e recados
            </h2>
            <p className="mt-1 text-sm leading-5 text-ink-soft">Somando as listas de todos os casamentos.</p>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="font-serif text-[2.25rem] leading-none tabular-nums text-ink">{confirmed}</span>
              <span className="text-sm text-ink-soft">confirmados de {guests} convidados</span>
            </p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-forest/8" aria-hidden>
              <div className="h-full rounded-full bg-forest" style={{ width: `${guests ? (confirmed / guests) * 100 : 0}%` }} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-ink-soft">Confirmados</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">{formatPercent(confirmed, guests)}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Não vão</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">{declined}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Sem resposta</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">{Math.max(0, guests - confirmed - declined)}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Recados</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">{messagesTotal.count ?? 0}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section className="panel">
            <PanelHeader title="Últimos pagamentos da taxa" href="/admin/pacotes#taxas" linkLabel="Ver todos" />
            {payments.length === 0 ? (
              <EmptyState icon="wallet" title="Nenhum pagamento ainda">
                Cada checkout da taxa de publicação aparece aqui, pago ou não, com o casal e o valor.
              </EmptyState>
            ) : (
              <ul className="mt-2 divide-y divide-line px-5 pb-2">
                {payments.slice(0, 6).map((payment) => {
                  const wedding = weddingById.get(payment.wedding_id);
                  return (
                    <li key={payment.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.9375rem] font-medium text-ink">{wedding?.couple_names ?? "Casamento removido"}</p>
                        <p className="truncate text-[0.8125rem] text-ink-soft">
                          {formatDateTime(paidAt(payment))} · {payment.provider}
                        </p>
                      </div>
                      <div className="grid shrink-0 justify-items-end gap-1">
                        <span className="text-[0.9375rem] font-semibold tabular-nums text-ink">
                          {formatCurrency(payment.amount_cents / 100)}
                        </span>
                        <PaymentBadge status={payment.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="panel">
            <PanelHeader title="Casamentos mais próximos" href="/admin/casamentos" linkLabel="Ver todos" />
            {upcoming.length === 0 ? (
              <EmptyState icon="calendar" title="Nenhuma data futura">
                Os casamentos com data definida no editor aparecem aqui, do mais próximo ao mais distante.
              </EmptyState>
            ) : (
              <ul className="mt-2 divide-y divide-line px-5 pb-2">
                {upcoming.map(({ wedding, days: left }) => (
                  <li key={wedding.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={weddingLink(wedding.slug)}
                        className="block truncate text-[0.9375rem] font-medium text-ink underline-offset-2 hover:underline"
                      >
                        {wedding.couple_names}
                      </Link>
                      <p className="truncate text-[0.8125rem] text-ink-soft">
                        {formatDate(wedding.wedding_date)} · {left === 0 ? "hoje" : left === 1 ? "amanhã" : `em ${left} dias`}
                      </p>
                    </div>
                    <StatusBadge status={wedding.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}

/** Grupo dentro de "Precisa de atenção": rótulo pequeno + contagem, separado por linha fina. */
function AttentionGroup({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <div className="mt-3 border-t border-line pb-2">
      <h3 className="flex items-baseline justify-between gap-3 px-5 pb-1 pt-4">
        <span className="t-eyebrow text-ink-soft">{title}</span>
        <span className="text-sm tabular-nums text-ink-soft">{count}</span>
      </h3>
      {children}
    </div>
  );
}

function AttentionEmpty({ children }: { children: ReactNode }) {
  return <p className="px-5 pb-3 pt-1 text-sm leading-5 text-ink-soft">{children}</p>;
}

/** Linha de pendência: ícone, tipo, título e detalhe; vira link quando há para onde ir. */
function AttentionRow({
  href,
  tone = "warn",
  icon = "alert",
  kind,
  title,
  detail
}: {
  href?: string;
  tone?: "warn" | "danger";
  icon?: IconName;
  kind?: string;
  title: string;
  detail: ReactNode;
}) {
  const body = (
    <>
      <span
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${tone === "danger" ? "bg-danger/10 text-danger" : "bg-warn-soft text-warn"}`}
      >
        <Icon name={icon} size={16} />
      </span>
      <span className="grid min-w-0 flex-1">
        {kind ? <span className={`text-[0.8125rem] font-semibold ${tone === "danger" ? "text-danger" : "text-warn"}`}>{kind}</span> : null}
        <span className="line-clamp-2 text-[0.9375rem] font-medium text-ink wrap-break-word">{title}</span>
        <span className="line-clamp-2 text-[0.8125rem] text-ink-soft">{detail}</span>
      </span>
    </>
  );
  if (!href) return <div className="flex items-start gap-3 px-3 py-3">{body}</div>;
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg px-3 py-3 transition-colors duration-150 hover:bg-forest/4 focus-visible:outline-2 focus-visible:outline-forest motion-reduce:transition-none"
    >
      {body}
      <Icon name="chevronRight" size={16} className="mt-2 shrink-0 text-ink-soft" />
    </Link>
  );
}
