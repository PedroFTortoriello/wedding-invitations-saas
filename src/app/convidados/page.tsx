import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { Icon } from "@/components/app/icons";
import { Avatar, EmptyState } from "@/components/app/Panel";
import { StatusBadge } from "@/components/app/StatusBadge";
import { SubmitButton } from "@/components/app/SubmitButton";
import { SupportBlockedButton } from "@/components/app/SupportBar";
import { getActingContext } from "@/lib/acting";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { addGuestsAction, removeGuestAction } from "./actions";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "confirmed", label: "Confirmados" },
  { key: "pending", label: "Sem resposta" },
  { key: "declined", label: "Não vão" }
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

export default async function GuestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const ctx = await getActingContext();
  const row = await getOwnedWeddingRow(ctx);
  if (!row) {
    redirect("/onboarding");
  }

  const { data: guests } = await ctx.db.from("guests").select("*").eq("wedding_id", row.id);

  const guestList = (guests ?? []).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const filter: FilterKey = FILTERS.some((f) => f.key === status) ? (status as FilterKey) : "all";
  const counts: Record<FilterKey, number> = {
    all: guestList.length,
    confirmed: guestList.filter((guest) => guest.status === "confirmed").length,
    pending: guestList.filter((guest) => guest.status === "pending").length,
    declined: guestList.filter((guest) => guest.status === "declined").length
  };
  const headcount = guestList
    .filter((guest) => guest.status === "confirmed")
    .reduce((total, guest) => total + 1 + guest.companions_confirmed, 0);
  const visible = filter === "all" ? guestList : guestList.filter((guest) => guest.status === filter);

  return (
    <AppShell
      title="Convidados"
      subtitle="Quem está na lista confirma presença no site digitando o próprio nome."
      active="guests"
      wedding={{ coupleNames: row.couple_names, slug: row.slug, status: row.status }}
      support={ctx.support}
    >
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="panel min-w-0" aria-labelledby="guest-list-title">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-5">
            <h2 id="guest-list-title" className="text-base font-semibold">
              Lista de convidados
            </h2>
            {headcount > 0 ? (
              <p className="text-sm text-ink-soft">
                <strong className="font-semibold text-ink">{headcount}</strong>{" "}
                {headcount === 1 ? "pessoa confirmada" : "pessoas confirmadas"}, contando acompanhantes
              </p>
            ) : null}
          </div>

          {guestList.length === 0 ? (
            <EmptyState icon="users" title="Sua lista está vazia">
              Adicione os nomes em “Adicionar convidados”. Depois é só compartilhar o link: cada convidado encontra o próprio nome e
              confirma presença.
            </EmptyState>
          ) : (
            <>
              <nav aria-label="Filtrar por resposta" className="mt-3 flex gap-1 overflow-x-auto border-b border-line px-3">
                {FILTERS.map((f) => {
                  const current = f.key === filter;
                  return (
                    <Link
                      key={f.key}
                      href={f.key === "all" ? "/convidados" : `/convidados?status=${f.key}`}
                      aria-current={current ? "page" : undefined}
                      scroll={false}
                      className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                        current ? "border-forest text-ink" : "border-transparent text-ink-soft hover:text-ink"
                      }`}
                    >
                      {f.label}
                      <span
                        className={`rounded-full px-1.5 text-xs tabular-nums ${current ? "bg-forest text-on-forest" : "bg-forest/8"}`}
                      >
                        {counts[f.key]}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {visible.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-ink-soft">Ninguém da lista com essa resposta.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-line text-[0.8125rem] text-ink-soft">
                      <th scope="col" className="py-2.5 pl-5 font-medium">
                        Nome
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-medium">
                        Resposta
                      </th>
                      <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">
                        Acompanhantes
                      </th>
                      <th scope="col" className="w-12 pr-3">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {visible.map((guest) => (
                      <tr key={guest.id} className="transition-colors duration-150 hover:bg-forest/3">
                        <td className="py-2.5 pl-5">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={guest.name} />
                            <span className="min-w-0 wrap-break-word text-[0.9375rem] font-medium text-ink">{guest.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={guest.status} />
                        </td>
                        <td className="hidden px-3 py-2.5 text-sm tabular-nums text-ink sm:table-cell">
                          {guest.companions_allowed > 0 ? `${guest.companions_confirmed} de ${guest.companions_allowed}` : "—"}
                        </td>
                        <td className="py-1.5 pr-3 text-right">
                          {ctx.support ? (
                            <SupportBlockedButton className="icon-btn" aria-label={`Remover ${guest.name} da lista`}>
                              <Icon name="trash" size={17} />
                            </SupportBlockedButton>
                          ) : (
                            <form action={removeGuestAction}>
                              <input type="hidden" name="id" value={guest.id} />
                              <SubmitButton className="icon-btn hover:text-danger" aria-label={`Remover ${guest.name} da lista`}>
                                <Icon name="trash" size={17} />
                              </SubmitButton>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </section>

        <section
          className={`panel order-first p-5 lg:sticky lg:order-0 ${ctx.support ? "lg:top-18" : "lg:top-6"}`}
          aria-labelledby="add-guests-title"
        >
          <h2 id="add-guests-title" className="text-base font-semibold">
            Adicionar convidados
          </h2>
          <form action={addGuestsAction} className="mt-3 grid gap-3">
            <input type="hidden" name="weddingId" value={row.id} />
            <p id="guest-names-hint" className="text-sm leading-5 text-ink-soft">
              Um nome por linha. Pode colar a lista inteira de uma vez; nomes repetidos são ignorados.
            </p>
            <textarea
              id="guest-names"
              aria-labelledby="add-guests-title"
              aria-describedby="guest-names-hint"
              name="names"
              rows={6}
              required
              placeholder={"Mariana Souza\nLucas Ferreira\nTia Ana"}
              className="field"
            />
            <SubmitButton className="btn btn-sm btn-primary w-full" pendingLabel="Adicionando…">
              <Icon name="plus" size={16} />
              Adicionar à lista
            </SubmitButton>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
