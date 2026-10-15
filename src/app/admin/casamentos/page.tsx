import Link from "next/link";
import { AdminShell } from "@/components/app/AdminShell";
import { Icon } from "@/components/app/icons";
import { EmptyState } from "@/components/app/Panel";
import { StatusBadge } from "@/components/app/StatusBadge";
import { SubmitButton } from "@/components/app/SubmitButton";
import {
  ADMIN_WEDDING_COLUMNS,
  currentTime,
  daysUntil,
  fetchAll,
  formatDate,
  formatGap,
  isRealGift,
  matchesQuery,
  templateIdOf,
  withParams
} from "@/components/admin/data";
import { DateTimeCell, FilterTabs, SearchForm, ViewAccountButton, td, th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/platform-data";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATE_NAMES } from "@/lib/wedding";
import { countsForRevenue } from "../revenue-cutoffs";
import { releasePublicationAction } from "./actions";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "published", label: "Publicados" },
  { key: "draft", label: "Rascunhos" },
  { key: "paid_unpublished", label: "Taxa paga, sem publicar" },
  { key: "inactive", label: "Suspensos ou expirados" }
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

export default async function AdminWeddingsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const me = await requireAdmin();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const filter: FilterKey = FILTERS.some((f) => f.key === params.status) ? (params.status as FilterKey) : "all";

  const supabase = await createClient();
  const [weddings, profiles, guests, gifts, paidFees] = await Promise.all([
    fetchAll((from, to) =>
      supabase.from("weddings").select(ADMIN_WEDDING_COLUMNS).order("created_at", { ascending: false }).order("id").range(from, to)
    ),
    fetchAll((from, to) => supabase.from("profiles").select("id, email, name, role, created_at").order("id").range(from, to)),
    fetchAll((from, to) => supabase.from("guests").select("wedding_id, status").order("id").range(from, to)),
    fetchAll((from, to) =>
      supabase
        .from("cash_gifts")
        .select("wedding_id, gross_amount, status, payment_method, provider_payment_id, created_at")
        .order("id")
        .range(from, to)
    ),
    fetchAll((from, to) =>
      supabase.from("publish_payments").select("wedding_id").eq("status", "paid").order("id").range(from, to)
    )
  ]);

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const paidFeeIds = new Set(paidFees.map((payment) => payment.wedding_id));

  const guestStats = new Map<string, { total: number; confirmed: number }>();
  for (const guest of guests) {
    const stats = guestStats.get(guest.wedding_id) ?? { total: 0, confirmed: 0 };
    stats.total += 1;
    if (guest.status === "confirmed") stats.confirmed += 1;
    guestStats.set(guest.wedding_id, stats);
  }
  const giftsReceived = new Map<string, number>();
  for (const gift of gifts) {
    if (gift.status !== "paid" || !isRealGift(gift) || !countsForRevenue(gift, gift.wedding_id)) continue;
    giftsReceived.set(gift.wedding_id, (giftsReceived.get(gift.wedding_id) ?? 0) + Number(gift.gross_amount));
  }

  const matchesFilter: Record<FilterKey, (wedding: (typeof weddings)[number]) => boolean> = {
    all: () => true,
    published: (wedding) => wedding.status === "published",
    draft: (wedding) => wedding.status === "draft",
    paid_unpublished: (wedding) => Boolean(wedding.publish_paid_at) && wedding.status !== "published",
    inactive: (wedding) => wedding.status === "suspended" || wedding.status === "expired"
  };

  const searched = weddings.filter((wedding) =>
    matchesQuery(q, wedding.couple_names, wedding.slug, profileById.get(wedding.owner_id)?.email)
  );
  const visible = searched.filter(matchesFilter[filter]);
  const tabs = FILTERS.map((f) => ({
    key: f.key,
    label: f.label,
    count: searched.filter(matchesFilter[f.key]).length,
    href: withParams("/admin/casamentos", { q, status: f.key === "all" ? undefined : f.key })
  })).filter((tab) => tab.key !== "inactive" || tab.count > 0 || filter === "inactive");

  const now = currentTime();

  return (
    <AdminShell
      title="Casamentos"
      subtitle="Todos os sites criados: dono, modelo, data, publicação, taxa, convidados e presentes."
      active="weddings"
    >
      <section className="panel min-w-0" aria-labelledby="weddings-title">
        <div className="grid gap-3 px-5 pt-5 md:grid-cols-[1fr_minmax(0,26rem)] md:items-center">
          <div>
            <h2 id="weddings-title" className="text-base font-semibold">
              {visible.length} de {weddings.length} {weddings.length === 1 ? "casamento" : "casamentos"}
            </h2>
            {q ? (
              <p className="mt-1 text-sm text-ink-soft">
                Busca por “{q}”.{" "}
                <Link
                  href={withParams("/admin/casamentos", { status: filter === "all" ? undefined : filter })}
                  className="font-semibold text-forest underline-offset-2 hover:underline"
                >
                  Limpar busca
                </Link>
              </p>
            ) : null}
          </div>
          <SearchForm
            action="/admin/casamentos"
            q={q}
            label="Buscar casamentos"
            placeholder="Casal, endereço do site ou e-mail do dono"
            keep={{ status: filter === "all" ? undefined : filter }}
          />
        </div>

        <FilterTabs label="Filtrar por situação" current={filter} tabs={tabs} className="mt-4" />

        {weddings.length === 0 ? (
          <EmptyState icon="heart" title="Nenhum casamento criado ainda">
            Quando um casal concluir o cadastro e criar o site, ele aparece aqui com status, taxa, convidados e presentes.
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState icon="search" title="Nenhum casamento encontrado">
            {q ? `Nada corresponde a “${q}” neste filtro.` : "Nenhum casamento nesta situação."} Troque o filtro ou limpe a busca.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-6xl text-left">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className={th}>
                    Casal
                  </th>
                  <th scope="col" className={th}>
                    Modelo
                  </th>
                  <th scope="col" className={th}>
                    Data do casamento
                  </th>
                  <th scope="col" className={th}>
                    Status
                  </th>
                  <th scope="col" className={th}>
                    Taxa
                  </th>
                  <th scope="col" className={`${th} text-right`}>
                    Convidados
                  </th>
                  <th scope="col" className={`${th} text-right`}>
                    Presentes
                  </th>
                  <th scope="col" className={th}>
                    Criado em
                  </th>
                  <th scope="col" className={th}>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((wedding) => {
                  const owner = profileById.get(wedding.owner_id);
                  const guestsOf = guestStats.get(wedding.id);
                  const left = daysUntil(wedding.wedding_date, now);
                  const isPublished = wedding.status === "published";
                  const signupGap = owner ? Date.parse(wedding.created_at) - Date.parse(owner.created_at) : null;
                  return (
                    <tr key={wedding.id} className="transition-colors duration-150 hover:bg-forest/3 motion-reduce:transition-none">
                      <td className={td}>
                        <p className="max-w-64 font-medium text-ink wrap-break-word">{wedding.couple_names}</p>
                        <p className="max-w-64 truncate text-[0.8125rem] text-ink-soft">{owner?.email ?? "Dono sem e-mail"}</p>
                        <p className="max-w-64 truncate text-[0.8125rem] text-ink-soft">/casamento/{wedding.slug}</p>
                      </td>
                      <td className={`${td} text-ink`}>{TEMPLATE_NAMES[templateIdOf(wedding.template)]}</td>
                      <td className={td}>
                        {wedding.wedding_date ? (
                          <span className="grid">
                            <span className="text-ink tabular-nums">{formatDate(wedding.wedding_date)}</span>
                            <span className="text-[0.8125rem] text-ink-soft">
                              {left === null
                                ? ""
                                : left < 0
                                  ? "Já aconteceu"
                                  : left === 0
                                    ? "Hoje"
                                    : `Em ${left} ${left === 1 ? "dia" : "dias"}`}
                            </span>
                          </span>
                        ) : (
                          <span className="text-ink-soft">A definir</span>
                        )}
                      </td>
                      <td className={td}>
                        <StatusBadge status={wedding.status} />
                      </td>
                      <td className={td}>
                        {wedding.publish_paid_at ? (
                          <span className="grid">
                            <span className="font-medium text-ink">{paidFeeIds.has(wedding.id) ? "Paga" : "Cortesia"}</span>
                            <span className="text-[0.8125rem] tabular-nums text-ink-soft">em {formatDate(wedding.publish_paid_at)}</span>
                          </span>
                        ) : (
                          <span className="font-medium text-warn">Em aberto</span>
                        )}
                      </td>
                      <td className={`${td} text-right tabular-nums`}>
                        <span className="text-ink">
                          {guestsOf?.confirmed ?? 0}/{guestsOf?.total ?? 0}
                        </span>
                        <span className="block text-[0.8125rem] text-ink-soft">confirmados</span>
                      </td>
                      <td className={`${td} text-right font-medium tabular-nums text-ink`}>
                        {formatCurrency(giftsReceived.get(wedding.id) ?? 0)}
                      </td>
                      <td className={td}>
                        <DateTimeCell
                          iso={wedding.created_at}
                          extra={signupGap !== null ? ` · ${formatGap(signupGap)} após o cadastro` : null}
                        />
                      </td>
                      <td className={td}>
                        <div className="flex items-center justify-end gap-1">
                          {owner && owner.role !== "admin" && owner.id !== me.id ? (
                            <ViewAccountButton userId={owner.id} label={wedding.couple_names} />
                          ) : (
                            <span className="whitespace-nowrap px-2 text-[0.8125rem] text-ink-soft">
                              {!owner ? "Dono não encontrado" : owner.id === me.id ? "Sua conta" : "Conta admin"}
                            </span>
                          )}
                          {!isPublished ? (
                            <form action={releasePublicationAction}>
                              <input type="hidden" name="weddingId" value={wedding.id} />
                              <SubmitButton className="btn btn-sm btn-secondary whitespace-nowrap" pendingLabel="Liberando…">
                                Liberar publicação
                              </SubmitButton>
                            </form>
                          ) : null}
                          <a
                            href={`/casamento/${wedding.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="icon-btn"
                            aria-label={`Abrir o site de ${wedding.couple_names} em nova aba`}
                            title="Abrir site"
                          >
                            <Icon name="external" size={17} />
                          </a>
                          {owner && owner.role !== "admin" && owner.id !== me.id ? (
                            <Link
                              href={`${withParams("/admin/usuarios", { usuario: owner.id, apagar: "1" })}#apagar`}
                              className="icon-btn hover:text-danger"
                              aria-label={`Apagar a conta de ${wedding.couple_names}`}
                              title="Apagar conta (pede confirmação)"
                            >
                              <Icon name="trash" size={17} />
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
