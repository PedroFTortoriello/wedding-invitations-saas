import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { Icon } from "@/components/app/icons";
import { Avatar, EmptyState, PanelHeader } from "@/components/app/Panel";
import { SubmitButton } from "@/components/app/SubmitButton";
import { SupportBlockedButton, SupportBlockedNote } from "@/components/app/SupportBar";
import { getActingContext } from "@/lib/acting";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { rowToWeddingSite } from "@/lib/wedding";
import { formatCurrency } from "@/lib/platform-data";
import { markGiftReceivedAction } from "./actions";

export const dynamic = "force-dynamic";

const formatDay = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

export default async function CheckoutPage() {
  const ctx = await getActingContext();
  const row = await getOwnedWeddingRow(ctx);
  if (!row) {
    redirect("/onboarding");
  }

  const site = rowToWeddingSite(row);
  const { data: gifts } = await ctx.db
    .from("cash_gifts")
    .select("*")
    .eq("wedding_id", row.id)
    .order("created_at", { ascending: false });

  const list = gifts ?? [];
  // Só Pix espera confirmação manual; cartão é confirmado pelo webhook do Mercado Pago.
  const pending = list.filter((gift) => gift.status === "pending" && gift.payment_method === "pix");
  const paid = list.filter((gift) => gift.status === "paid");
  const totalPaid = paid.reduce((total, gift) => total + Number(gift.gross_amount), 0);
  const totalPending = pending.reduce((total, gift) => total + Number(gift.gross_amount), 0);

  return (
    <AppShell
      title="Recebimentos"
      subtitle="Presentes em dinheiro enviados pelos convidados. Confirme aqui os Pix que já caíram na sua conta."
      active="cash-gifts"
      wedding={{ coupleNames: site.coupleNames, slug: site.slug, status: site.status }}
      support={ctx.support}
    >
      <div className="grid gap-5">
        <section aria-label="Resumo" className="panel grid sm:grid-cols-3">
          <div className="grid content-start gap-1 border-b border-line p-5 sm:border-b-0 sm:border-r">
            <span className="text-[0.8125rem] text-ink-soft">Recebido</span>
            <span className="font-serif text-[2rem] leading-none tabular-nums">{formatCurrency(totalPaid)}</span>
            <span className="mt-1 text-[0.8125rem] text-ink-soft">
              {paid.length} {paid.length === 1 ? "presente confirmado" : "presentes confirmados"}
            </span>
          </div>
          <div className="grid content-start gap-1 border-b border-line p-5 sm:border-b-0 sm:border-r">
            <span className="text-[0.8125rem] text-ink-soft">A confirmar</span>
            <span className="font-serif text-[2rem] leading-none tabular-nums">{formatCurrency(totalPending)}</span>
            <span className={`mt-1 text-[0.8125rem] ${pending.length ? "font-medium text-warn" : "text-ink-soft"}`}>
              {pending.length ? `${pending.length} Pix aguardando você` : "Nada pendente"}
            </span>
          </div>
          <div className="grid min-w-0 content-start gap-1 p-5">
            <span className="text-[0.8125rem] text-ink-soft">Chave Pix</span>
            {site.pixKey ? (
              <span className="truncate text-[1.0625rem] font-semibold text-ink" title={site.pixKey}>
                {site.pixKey}
              </span>
            ) : (
              <span className="text-[1.0625rem] font-semibold text-danger">Não cadastrada</span>
            )}
            <Link
              href="/editor?secao=pix"
              className="mt-1 inline-flex items-center gap-0.5 justify-self-start text-[0.8125rem] font-semibold text-forest hover:underline"
            >
              {site.pixKey ? "Alterar chave" : "Cadastrar chave"}
              <Icon name="chevronRight" size={14} />
            </Link>
          </div>
        </section>

        <section className="panel" aria-labelledby="pending-title">
          <div className="px-5 pt-5">
            <h2 id="pending-title" className="text-base font-semibold">
              Pix para confirmar
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-ink-soft">
              O Pix vai direto para a sua conta, sem passar pela Noivar. Confira no app do banco e marque aqui o que já
              caiu. Presentes no cartão se confirmam sozinhos.
            </p>
            {ctx.support && pending.length ? <SupportBlockedNote className="mt-2" /> : null}
          </div>
          {pending.length === 0 ? (
            <EmptyState icon="check" title="Tudo em dia">
              Quando um convidado gerar um Pix de presente, ele aparece aqui para você confirmar.
            </EmptyState>
          ) : (
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {pending.map((gift) => (
                <li key={gift.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5">
                  <div className="flex min-w-0 flex-1 basis-60 items-center gap-3">
                    <Avatar name={gift.guest_name} />
                    <div className="min-w-0">
                      <p className="truncate text-[0.9375rem] font-medium text-ink">{gift.guest_name}</p>
                      <p className="truncate text-[0.8125rem] text-ink-soft">
                        {formatDay(gift.created_at)} · {gift.message || "Presente via Pix"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[0.9375rem] font-semibold tabular-nums">{formatCurrency(Number(gift.gross_amount))}</span>
                  {ctx.support ? (
                    <SupportBlockedButton className="btn btn-sm btn-primary">
                      <Icon name="check" size={16} />
                      Marcar como recebido
                    </SupportBlockedButton>
                  ) : (
                    <form action={markGiftReceivedAction}>
                      <input type="hidden" name="giftId" value={gift.id} />
                      <SubmitButton className="btn btn-sm btn-primary" pendingLabel="Confirmando…">
                        <Icon name="check" size={16} />
                        Marcar como recebido
                      </SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <PanelHeader title="Histórico" description="Presentes já confirmados, do mais recente ao mais antigo." />
          {paid.length === 0 ? (
            <EmptyState icon="wallet" title="Nenhum presente confirmado ainda">
              Os presentes recebidos, no Pix ou no cartão, ficam registrados aqui.
            </EmptyState>
          ) : (
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {paid.map((gift) => (
                <li key={gift.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={gift.guest_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.9375rem] font-medium text-ink">{gift.guest_name}</p>
                    <p className="truncate text-[0.8125rem] text-ink-soft">
                      {formatDay(gift.paid_at ?? gift.created_at)} · {gift.payment_method === "card" ? "Cartão" : "Pix"}
                      {gift.message ? ` · ${gift.message}` : ""}
                    </p>
                  </div>
                  <div className="grid justify-items-end">
                    <span className="text-[0.9375rem] font-semibold tabular-nums">{formatCurrency(Number(gift.gross_amount))}</span>
                    {gift.payment_method === "card" && gift.net_amount != null ? (
                      <span className="text-[0.8125rem] tabular-nums text-ink-soft">
                        líquido {formatCurrency(Number(gift.net_amount))}
                      </span>
                    ) : (
                      <span className="text-[0.8125rem] text-ink-soft">100% para vocês</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
