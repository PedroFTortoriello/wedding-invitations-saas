import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { StatusBadge } from "@/components/app/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { rowToWeddingSite } from "@/lib/wedding";
import { formatCurrency } from "@/lib/platform-data";
import { markGiftReceivedAction } from "./actions";

export const dynamic = "force-dynamic";

const formatDay = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

export default async function CheckoutPage() {
  const row = await getOwnedWeddingRow();
  if (!row) {
    redirect("/onboarding");
  }

  const site = rowToWeddingSite(row);
  const supabase = await createClient();
  const { data: gifts } = await supabase
    .from("cash_gifts")
    .select("*")
    .eq("wedding_id", row.id)
    .order("created_at", { ascending: false });

  const list = gifts ?? [];
  const pending = list.filter((gift) => gift.status === "pending");
  const paid = list.filter((gift) => gift.status === "paid");
  const totalPaid = paid.reduce((total, gift) => total + Number(gift.gross_amount), 0);
  const totalPending = pending.reduce((total, gift) => total + Number(gift.gross_amount), 0);

  return (
    <AppShell
      title="Presentes em dinheiro"
      subtitle="Os presentes via Pix caem 100% na sua chave, sem intermediação. Confirme aqui o que já recebeu."
      active="cash-gifts"
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="card p-6">
          <p className="t-eyebrow text-ink-soft">Recebido (confirmado)</p>
          <h2 className="mt-3 t-h2">{formatCurrency(totalPaid)}</h2>
        </article>
        <article className="card p-6">
          <p className="t-eyebrow text-ink-soft">Aguardando confirmação</p>
          <h2 className="mt-3 t-h2">{formatCurrency(totalPending)}</h2>
        </article>
        <article className="card p-6">
          <p className="t-eyebrow text-ink-soft">Chave Pix</p>
          <h2 className="mt-3 t-h2 break-all">{site.pixKey || "—"}</h2>
        </article>
      </section>

      <section className="mt-6 card p-6">
        <p className="t-eyebrow text-ink-soft">Aguardando confirmação</p>
        {pending.length === 0 ? (
          <p className="mt-5 text-sm leading-6 text-ink-soft">
            Quando um convidado gerar um Pix de presente, ele aparece aqui para você confirmar o recebimento na sua conta.
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {pending.map((gift) => (
              <div
                key={gift.id}
                className="grid gap-3 rounded-3xl bg-[#f7f0e5] p-4 md:grid-cols-[1fr_auto_auto] md:items-center"
              >
                <div className="min-w-0">
                  <strong>{gift.guest_name}</strong>
                  <p className="text-sm text-ink-soft">{gift.message ?? "Presente em dinheiro via Pix"}</p>
                  <p className="text-xs text-ink-soft">{formatDay(gift.created_at)}</p>
                </div>
                <span className="text-sm font-black">{formatCurrency(Number(gift.gross_amount))}</span>
                <form action={markGiftReceivedAction}>
                  <input type="hidden" name="giftId" value={gift.id} />
                  <button type="submit" className="btn btn-primary min-h-11 text-sm">
                    Marcar recebido
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 card p-6">
        <p className="t-eyebrow text-ink-soft">Confirmados</p>
        {paid.length === 0 ? (
          <p className="mt-5 text-sm leading-6 text-ink-soft">Os presentes confirmados aparecem aqui.</p>
        ) : (
          <div className="mt-5 grid gap-3">
            {paid.map((gift) => (
              <div
                key={gift.id}
                className="grid gap-3 rounded-3xl bg-[#f7f0e5] p-4 md:grid-cols-[1fr_auto_auto] md:items-center"
              >
                <div className="min-w-0">
                  <strong>{gift.guest_name}</strong>
                  <p className="text-sm text-ink-soft">{gift.message ?? "Presente em dinheiro via Pix"}</p>
                  <p className="text-xs text-ink-soft">{formatDay(gift.paid_at ?? gift.created_at)}</p>
                </div>
                <span className="text-sm font-black">{formatCurrency(Number(gift.gross_amount))}</span>
                <StatusBadge status="paid" />
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
