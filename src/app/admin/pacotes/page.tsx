import { AdminShell } from "@/components/app/AdminShell";
import { cashGiftTransactions, formatCurrency, platformMetrics } from "@/lib/platform-data";

export default function AdminPackagesPage() {
  return (
    <AdminShell
      title="Receita"
      subtitle="A receita da plataforma vem da taxa de publicação. Presentes Pix vão 100% para os casais."
      active="cash-gifts"
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-on-forest">Volume de presentes</p>
          <strong className="mt-3 block font-serif text-5xl font-normal">{formatCurrency(platformMetrics.grossCashGifts)}</strong>
        </article>
        <article className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-on-forest">Receita da plataforma</p>
          <strong className="mt-3 block font-serif text-5xl font-normal">{formatCurrency(platformMetrics.revenue)}</strong>
        </article>
        <article className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-on-forest">Taxa sobre presentes</p>
          <strong className="mt-3 block font-serif text-5xl font-normal">0%</strong>
        </article>
      </section>
      <section className="mt-6 grid gap-4">
        {cashGiftTransactions.map((gift) => (
          <article key={gift.id} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <h2 className="font-serif text-4xl leading-none">{gift.guestName}</h2>
                <p className="mt-2 text-sm text-on-forest">{gift.message ?? "Presente em dinheiro via Pix"}</p>
              </div>
              <span>{formatCurrency(gift.grossAmount)}</span>
              <strong>100% para o casal</strong>
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
