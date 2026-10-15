import Link from "next/link";
import { Fragment } from "react";
import { AdminShell } from "@/components/app/AdminShell";
import { Icon } from "@/components/app/icons";
import { EmptyState } from "@/components/app/Panel";
import { StatusBadge } from "@/components/app/StatusBadge";
import { fetchAll, formatDate, formatDateTime, formatRelative, isRealGift, matchesQuery, sumBy, withParams } from "@/components/admin/data";
import { DateTimeCell, FilterTabs, PaymentBadge, SearchForm, StatStrip, td, th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/platform-data";
import { createClient } from "@/lib/supabase/server";
import { REVENUE_CUTOFFS, countsForRevenue } from "../revenue-cutoffs";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "com-presentes", label: "Com presentes" },
  { key: "pix-pendente", label: "Pix a confirmar" }
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const FEE_ROWS = 50;

/** "2026-08-13" → instante no fuso de São Paulo (sem horário de verão desde 2019). */
function parseDay(value: string | undefined, endOfDay: boolean) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}-03:00`);
  return Number.isNaN(time) ? null : time;
}

export default async function AdminRevenuePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; filtro?: string; casamento?: string; desde?: string; ate?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const filter: FilterKey = FILTERS.some((f) => f.key === params.filtro) ? (params.filtro as FilterKey) : "todos";
  const since = parseDay(params.desde, false);
  const until = parseDay(params.ate, true);
  const desde = since === null ? undefined : params.desde;
  const ate = until === null ? undefined : params.ate;
  const hasPeriod = Boolean(desde || ate);
  // Parâmetros atuais, para cada link mudar só o que precisa.
  const current = { q: q || undefined, filtro: filter === "todos" ? undefined : filter, desde, ate };

  const supabase = await createClient();
  const [weddingRows, profiles, gifts, payments] = await Promise.all([
    fetchAll((from, to) =>
      supabase.from("weddings").select("id, owner_id, slug, status, couple_names, pix_key").order("id").range(from, to)
    ),
    fetchAll((from, to) => supabase.from("profiles").select("id, email").order("id").range(from, to)),
    fetchAll((from, to) =>
      supabase
        .from("cash_gifts")
        .select(
          "id, wedding_id, guest_name, message, gross_amount, charged_amount, net_amount, installments, status, payment_method, provider_payment_id, paid_at, created_at"
        )
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
    )
  ]);

  const emailByOwner = new Map(profiles.map((profile) => [profile.id, profile.email]));
  const inPeriod = (iso: string) => {
    const time = Date.parse(iso);
    return (since === null || time >= since) && (until === null || time <= until);
  };
  /** Por que um presente não entra nas contas (null = entra). */
  const exclusion = (gift: { wedding_id: string; created_at: string }) =>
    !countsForRevenue(gift, gift.wedding_id) ? "Fora do período" : !inPeriod(gift.created_at) ? "Fora do filtro de datas" : null;

  // Tentativa de cartão sem pagamento no MP não é presente: some da tela.
  const giftsByWedding = new Map<string, typeof gifts>();
  for (const gift of gifts) {
    if (!isRealGift(gift)) continue;
    giftsByWedding.set(gift.wedding_id, [...(giftsByWedding.get(gift.wedding_id) ?? []), gift]);
  }

  const isCard = (gift: (typeof gifts)[number]) => gift.payment_method === "card";
  const amount = (gift: (typeof gifts)[number]) => Number(gift.gross_amount);

  const weddings = weddingRows.map((wedding) => {
    const all = giftsByWedding.get(wedding.id) ?? [];
    const counted = all.filter((gift) => exclusion(gift) === null);
    const paid = counted.filter((gift) => gift.status === "paid");
    const paidCard = paid.filter(isCard);
    const pendingPix = counted.filter((gift) => gift.status === "pending" && !isCard(gift));
    const pixReceived = sumBy(paid.filter((gift) => !isCard(gift)), amount);
    const cardGross = sumBy(paidCard, amount);
    const withNet = paidCard.filter((gift) => gift.net_amount !== null);
    const total = pixReceived + cardGross;
    return {
      ...wedding,
      hasPixKey: Boolean(wedding.pix_key), // a chave em si nunca é exibida
      ownerEmail: emailByOwner.get(wedding.owner_id) ?? null,
      gifts: all,
      counted: counted.length,
      paidCount: paid.length,
      pixReceived,
      pendingPixCount: pendingPix.length,
      pendingPixSum: sumBy(pendingPix, amount),
      cardGross,
      cardNet: withNet.length ? sumBy(withNet, (gift) => Number(gift.net_amount)) : null,
      total,
      ticket: paid.length ? total / paid.length : 0,
      lastGiftAt: counted[0]?.created_at ?? null, // presentes vêm do mais novo
      cutoff: REVENUE_CUTOFFS[wedding.id]
    };
  });

  const matchesFilter: Record<FilterKey, (wedding: (typeof weddings)[number]) => boolean> = {
    todos: () => true,
    "com-presentes": (wedding) => wedding.counted > 0,
    "pix-pendente": (wedding) => wedding.pendingPixCount > 0
  };
  const searched = weddings.filter((wedding) => matchesQuery(q, wedding.couple_names, wedding.slug, wedding.ownerEmail));
  const visible = searched
    .filter(matchesFilter[filter])
    .sort(
      (a, b) =>
        b.total - a.total || b.pendingPixSum - a.pendingPixSum || a.couple_names.localeCompare(b.couple_names, "pt-BR")
    );
  const tabs = FILTERS.map((f) => ({
    key: f.key,
    label: f.label,
    count: searched.filter(matchesFilter[f.key]).length,
    href: withParams("/admin/pacotes", { ...current, filtro: f.key === "todos" ? undefined : f.key })
  }));

  // Totais gerais (busca + datas aplicadas; as abas só recortam a tabela)
  const totalReceived = sumBy(searched, (w) => w.total);
  const totalPaid = sumBy(searched, (w) => w.paidCount);
  const totalCardNet = searched.some((w) => w.cardNet !== null) ? sumBy(searched, (w) => w.cardNet ?? 0) : null;
  const withGifts = searched.filter((w) => w.counted > 0).length;

  // Taxa de publicação (receita da plataforma), com o mesmo filtro de datas
  const feePayments = payments.filter((payment) => inPeriod(payment.created_at));
  const feePaid = feePayments.filter((payment) => payment.status === "paid");
  const weddingById = new Map(weddingRows.map((wedding) => [wedding.id, wedding]));

  const expanded = params.casamento;
  const COLUMNS = 10;

  return (
    <AdminShell
      title="Receita Pix"
      subtitle="Presentes recebidos por casamento. O dinheiro vai direto para o casal: a plataforma fica com 0%."
      active="revenue"
    >
      <div className="grid gap-5">
        <form
          action="/admin/pacotes"
          className="panel flex flex-wrap items-end gap-x-3 gap-y-3 p-4 sm:px-5"
          aria-label="Filtrar por período"
        >
          <label className="grid gap-1 text-[0.8125rem] font-medium text-ink-soft">
            De
            <input type="date" name="desde" defaultValue={desde} className="field min-w-40" />
          </label>
          <label className="grid gap-1 text-[0.8125rem] font-medium text-ink-soft">
            Até
            <input type="date" name="ate" defaultValue={ate} className="field min-w-40" />
          </label>
          {current.q ? <input type="hidden" name="q" value={current.q} /> : null}
          {current.filtro ? <input type="hidden" name="filtro" value={current.filtro} /> : null}
          <button type="submit" className="btn btn-sm btn-secondary min-h-11">
            Aplicar período
          </button>
          {hasPeriod ? (
            <Link
              href={withParams("/admin/pacotes", { ...current, desde: undefined, ate: undefined })}
              className="btn btn-sm btn-ghost min-h-11"
            >
              Limpar
            </Link>
          ) : null}
          <p className="basis-full text-[0.8125rem] leading-5 text-ink-soft sm:ml-auto sm:basis-auto sm:self-center">
            {hasPeriod
              ? `Contando presentes e taxas feitos ${desde ? `de ${formatDate(`${desde}T12:00:00-03:00`)}` : "desde o início"} ${
                  ate ? `até ${formatDate(`${ate}T12:00:00-03:00`)}` : "até hoje"
                }.`
              : "Sem filtro de datas: todo o histórico."}
          </p>
        </form>

        <StatStrip
          label="Totais de presentes"
          stats={[
            { label: "Total recebido pelos casais", value: formatCurrency(totalReceived), note: `${totalPaid} presentes pagos` },
            { label: "Via Pix", value: formatCurrency(sumBy(searched, (w) => w.pixReceived)), note: "0% de taxa, direto na chave" },
            {
              label: "No cartão (bruto)",
              value: formatCurrency(sumBy(searched, (w) => w.cardGross)),
              note: totalCardNet !== null ? `Líquido ${formatCurrency(totalCardNet)}` : "Sem líquido informado"
            },
            {
              label: "Pix a confirmar",
              value: String(sumBy(searched, (w) => w.pendingPixCount)),
              note: `${formatCurrency(sumBy(searched, (w) => w.pendingPixSum))} aguardando o casal`
            },
            { label: "Ticket médio", value: formatCurrency(totalPaid ? totalReceived / totalPaid : 0), note: "Por presente pago" },
            {
              label: "Casamentos com presentes",
              value: `${withGifts} de ${searched.length}`,
              note: `${searched.filter((w) => w.hasPixKey).length} com chave Pix cadastrada`
            }
          ]}
        />

        <section className="panel min-w-0" aria-labelledby="per-wedding-title">
          <div className="grid gap-3 px-5 pt-5 md:grid-cols-[1fr_minmax(0,24rem)] md:items-center">
            <div>
              <h2 id="per-wedding-title" className="text-base font-semibold">
                Por casamento
              </h2>
              <p className="mt-1 text-sm leading-5 text-ink-soft">
                Do maior total recebido para o menor. Abra uma linha para ver cada presente.
              </p>
            </div>
            <SearchForm
              action="/admin/pacotes"
              q={q}
              label="Buscar casamento"
              placeholder="Casal ou e-mail do dono"
              keep={{ filtro: current.filtro, desde, ate }}
            />
          </div>

          <FilterTabs label="Filtrar casamentos" current={filter} tabs={tabs} className="mt-4" />

          {weddingRows.length === 0 ? (
            <EmptyState icon="wallet" title="Nenhum casamento criado ainda">
              Quando os casais criarem sites e receberem presentes, os totais de cada casamento aparecem aqui.
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState icon="search" title="Nenhum casamento encontrado">
              {q ? `Nada corresponde a “${q}” neste filtro.` : "Nenhum casamento nesta situação."} Troque o filtro, o período ou limpe a
              busca.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-7xl text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className={th}>
                      Casal
                    </th>
                    <th scope="col" className={th}>
                      Site
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      Presentes
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      Pix recebido
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      Pix a confirmar
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      Cartão
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      Ticket médio
                    </th>
                    <th scope="col" className={th}>
                      Último presente
                    </th>
                    <th scope="col" className={th}>
                      Chave Pix
                    </th>
                    <th scope="col" className={th}>
                      <span className="sr-only">Detalhes</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((wedding) => {
                    const open = expanded === wedding.id;
                    return (
                      <Fragment key={wedding.id}>
                        <tr className={`transition-colors duration-150 motion-reduce:transition-none ${open ? "bg-forest/4" : "hover:bg-forest/3"}`}>
                          <td className={td}>
                            <span className="flex max-w-72 items-start gap-1">
                              <span className="min-w-0">
                                <span className="block font-medium text-ink wrap-break-word">{wedding.couple_names}</span>
                                <span className="block truncate text-[0.8125rem] text-ink-soft">{wedding.ownerEmail ?? "Dono sem e-mail"}</span>
                              </span>
                              <a
                                href={`/casamento/${wedding.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="icon-btn -my-2 size-8"
                                aria-label={`Abrir o site de ${wedding.couple_names} em nova aba`}
                                title="Abrir site"
                              >
                                <Icon name="external" size={15} />
                              </a>
                            </span>
                            {wedding.cutoff ? (
                              <span className="mt-1 flex max-w-72 items-start gap-1 text-[0.8125rem] font-medium leading-5 text-warn">
                                <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
                                Receita contada a partir de {formatDate(wedding.cutoff.since)} · {wedding.cutoff.reason}
                              </span>
                            ) : null}
                          </td>
                          <td className={td}>
                            <StatusBadge status={wedding.status} />
                          </td>
                          <td className={`${td} text-right tabular-nums text-ink`}>{wedding.paidCount}</td>
                          <td className={`${td} text-right font-medium tabular-nums text-ink`}>{formatCurrency(wedding.pixReceived)}</td>
                          <td className={`${td} text-right tabular-nums`}>
                            {wedding.pendingPixCount ? (
                              <span className="grid">
                                <span className="font-medium text-warn">{wedding.pendingPixCount}</span>
                                <span className="text-[0.8125rem] text-ink-soft">{formatCurrency(wedding.pendingPixSum)}</span>
                              </span>
                            ) : (
                              <span className="text-ink-soft">—</span>
                            )}
                          </td>
                          <td className={`${td} text-right tabular-nums`}>
                            {wedding.cardGross ? (
                              <span className="grid">
                                <span className="text-ink">{formatCurrency(wedding.cardGross)}</span>
                                {wedding.cardNet !== null ? (
                                  <span className="text-[0.8125rem] text-ink-soft">líquido {formatCurrency(wedding.cardNet)}</span>
                                ) : null}
                              </span>
                            ) : (
                              <span className="text-ink-soft">—</span>
                            )}
                          </td>
                          <td className={`${td} text-right tabular-nums text-ink`}>
                            {wedding.paidCount ? formatCurrency(wedding.ticket) : <span className="text-ink-soft">—</span>}
                          </td>
                          <td className={td}>
                            <DateTimeCell iso={wedding.lastGiftAt} />
                          </td>
                          <td className={td}>
                            {wedding.hasPixKey ? (
                              <span className="font-medium text-ink">Sim</span>
                            ) : (
                              <span className="font-medium text-warn">Não</span>
                            )}
                          </td>
                          <td className={`${td} text-right`}>
                            <Link
                              href={withParams("/admin/pacotes", { ...current, casamento: open ? undefined : wedding.id })}
                              scroll={false}
                              className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-semibold text-forest transition-colors duration-150 hover:bg-forest/6 focus-visible:outline-2 focus-visible:outline-forest motion-reduce:transition-none"
                            >
                              {open ? "Ocultar" : `Ver presentes (${wedding.gifts.length})`}
                              <Icon name="chevronDown" size={15} className={open ? "rotate-180" : undefined} />
                            </Link>
                          </td>
                        </tr>
                        {open ? (
                          <tr>
                            <td colSpan={COLUMNS} className="bg-bg-2/60 px-5 py-4">
                              <GiftList couple={wedding.couple_names} gifts={wedding.gifts} exclusion={exclusion} />
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

        <section id="taxas" className="panel min-w-0 scroll-mt-20" aria-labelledby="fees-title">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-5">
            <div>
              <h2 id="fees-title" className="text-base font-semibold">
                Taxa de publicação
              </h2>
              <p className="mt-1 text-sm leading-5 text-ink-soft">A receita da plataforma: checkouts da taxa única, pagos ou não.</p>
            </div>
            <p className="text-sm text-ink-soft">
              <strong className="font-semibold tabular-nums text-ink">
                {formatCurrency(sumBy(feePaid, (payment) => payment.amount_cents) / 100)}
              </strong>{" "}
              em {feePaid.length} {feePaid.length === 1 ? "taxa paga" : "taxas pagas"}
            </p>
          </div>
          {feePayments.length === 0 ? (
            <EmptyState icon="wallet" title="Nenhum checkout da taxa">
              {hasPeriod ? "Nenhum checkout da taxa neste período." : "Cada checkout da taxa de publicação aparece aqui com casal, valor e status."}
            </EmptyState>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-3xl text-left">
                <thead>
                  <tr className="border-y border-line">
                    <th scope="col" className={th}>
                      Casal
                    </th>
                    <th scope="col" className={th}>
                      Provedor
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      Valor
                    </th>
                    <th scope="col" className={th}>
                      Status
                    </th>
                    <th scope="col" className={th}>
                      Criado em
                    </th>
                    <th scope="col" className={th}>
                      Pago em
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {feePayments.slice(0, FEE_ROWS).map((payment) => (
                    <tr key={payment.id}>
                      <td className={`${td} font-medium text-ink`}>{weddingById.get(payment.wedding_id)?.couple_names ?? "Casamento removido"}</td>
                      <td className={`${td} text-ink`}>{payment.provider}</td>
                      <td className={`${td} text-right font-medium tabular-nums text-ink`}>{formatCurrency(payment.amount_cents / 100)}</td>
                      <td className={td}>
                        <PaymentBadge status={payment.status} />
                      </td>
                      <td className={td}>
                        <DateTimeCell iso={payment.created_at} />
                      </td>
                      <td className={td}>
                        <DateTimeCell iso={payment.paid_at} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {feePayments.length > FEE_ROWS ? (
                <p className="border-t border-line px-5 py-3 text-[0.8125rem] text-ink-soft">
                  Mostrando os {FEE_ROWS} checkouts mais recentes de {feePayments.length}. Use o período para ver os anteriores.
                </p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

type Gift = {
  id: string;
  wedding_id: string;
  guest_name: string;
  message: string | null;
  gross_amount: number;
  charged_amount: number | null;
  net_amount: number | null;
  installments: number | null;
  status: string;
  payment_method: string;
  paid_at: string | null;
  created_at: string;
};

function GiftList({
  couple,
  gifts,
  exclusion
}: {
  couple: string;
  gifts: Gift[];
  exclusion: (gift: Gift) => string | null;
}) {
  if (gifts.length === 0) {
    return (
      <p className="py-2 text-sm leading-5 text-ink-soft">
        Nenhum presente de {couple} ainda. Quando um convidado presentear pelo site, cada presente aparece aqui com valor, forma de
        pagamento, mensagem e datas.
      </p>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">
        Presentes de {couple} <span className="font-normal text-ink-soft">· {gifts.length}, do mais recente</span>
      </h3>
      <table className="mt-2 w-full text-left">
        <thead>
          <tr className="border-b border-line-strong text-[0.8125rem] text-ink-soft">
            <th scope="col" className="py-2 pr-3 font-medium">
              Convidado
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Valor
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Forma
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Status
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Criado em
            </th>
            <th scope="col" className="py-2 pl-3 font-medium">
              Pago em
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {gifts.map((gift) => {
            const excluded = exclusion(gift);
            const muted = excluded ? "text-ink-soft" : "text-ink";
            const card = gift.payment_method === "card";
            return (
              <tr key={gift.id} className="align-top text-sm">
                <td className="max-w-96 py-2.5 pr-3">
                  <span className={`font-medium ${muted}`}>{gift.guest_name}</span>
                  {excluded ? (
                    <span className="ml-2 inline-block rounded-full border border-line-strong px-2 py-0.5 text-xs font-semibold text-ink-soft">
                      {excluded}
                    </span>
                  ) : null}
                  {gift.message ? <span className="mt-0.5 block text-[0.8125rem] leading-5 text-ink-soft wrap-break-word">“{gift.message}”</span> : null}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  <span className={`font-medium ${muted} ${excluded ? "line-through" : ""}`}>{formatCurrency(Number(gift.gross_amount))}</span>
                  {excluded ? <span className="sr-only"> (não entra nos totais)</span> : null}
                  {card && gift.net_amount !== null ? (
                    <span className="block text-[0.8125rem] text-ink-soft">líquido {formatCurrency(Number(gift.net_amount))}</span>
                  ) : null}
                </td>
                <td className={`px-3 py-2.5 ${muted}`}>
                  {card ? `Cartão${gift.installments && gift.installments > 1 ? ` ${gift.installments}x` : ""}` : "Pix"}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={gift.status} />
                </td>
                <td className="px-3 py-2.5">
                  <time dateTime={gift.created_at} className={`whitespace-nowrap ${muted}`}>
                    {formatDateTime(gift.created_at)}
                  </time>
                  <span className="block text-[0.8125rem] text-ink-soft">{formatRelative(gift.created_at)}</span>
                </td>
                <td className={`py-2.5 pl-3 whitespace-nowrap ${gift.paid_at ? muted : "text-ink-soft"}`}>
                  {formatDateTime(gift.paid_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
