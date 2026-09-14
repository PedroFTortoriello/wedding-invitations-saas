import { AdminShell } from "@/components/app/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: gifts }, { data: payments }] = await Promise.all([
    supabase
      .from("cash_gifts")
      .select("id, guest_name, message, gross_amount, status")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("publish_payments").select("amount_cents").eq("status", "paid")
  ]);

  const giftList = gifts ?? [];
  const grossCashGifts = giftList.reduce((sum, gift) => sum + Number(gift.gross_amount), 0);
  const revenue = (payments ?? []).reduce((sum, payment) => sum + payment.amount_cents, 0) / 100;

  return (
    <AdminShell
      title="Receita"
      subtitle="A receita da plataforma vem da taxa de publicação. Presentes Pix vão 100% para os casais."
      active="cash-gifts"
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
          <p className="t-eyebrow text-on-forest">Volume de presentes</p>
          <strong className="mt-3 block t-h1 font-normal">{formatCurrency(grossCashGifts)}</strong>
        </article>
        <article className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
          <p className="t-eyebrow text-on-forest">Receita da plataforma</p>
          <strong className="mt-3 block t-h1 font-normal">{formatCurrency(revenue)}</strong>
        </article>
        <article className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
          <p className="t-eyebrow text-on-forest">Taxa sobre presentes</p>
          <strong className="mt-3 block t-h1 font-normal">0%</strong>
        </article>
      </section>
      <section className="mt-6 grid gap-4">
        {giftList.length ? (
          giftList.map((gift) => (
            <article key={gift.id} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
              <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <h2 className="t-h2">{gift.guest_name}</h2>
                  <p className="mt-2 text-sm text-on-forest">{gift.message ?? "Presente em dinheiro via Pix"}</p>
                </div>
                <span>{formatCurrency(Number(gift.gross_amount))}</span>
                <strong>{gift.status === "paid" ? "100% para o casal" : "Pendente"}</strong>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-on-forest">Nenhum presente registrado ainda.</p>
        )}
      </section>
    </AdminShell>
  );
}
