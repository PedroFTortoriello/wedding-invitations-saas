import { AdminShell } from "@/components/app/AdminShell";
import { cashGiftRevenueModel, cashGiftTransactions, formatCurrency, platformMetrics } from "@/lib/platform-data";

export default function AdminPackagesPage() {
  return (
    <AdminShell title="Receita Pix" subtitle="Acompanhe a monetizacao por presentes em dinheiro." active="cash-gifts">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#dfe6cc]">Volume bruto</p>
          <strong className="mt-3 block font-serif text-5xl font-normal">{formatCurrency(platformMetrics.grossCashGifts)}</strong>
        </article>
        <article className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#dfe6cc]">Receita da plataforma</p>
          <strong className="mt-3 block font-serif text-5xl font-normal">{formatCurrency(platformMetrics.revenue)}</strong>
        </article>
        <article className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#dfe6cc]">Taxa base</p>
          <strong className="mt-3 block font-serif text-5xl font-normal">{cashGiftRevenueModel.feePercent}%</strong>
        </article>
      </section>
      <section className="mt-6 grid gap-4">
        {cashGiftTransactions.map((gift) => (
          <article key={gift.id} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <div>
                <h2 className="font-serif text-4xl leading-none">{gift.guestName}</h2>
                <p className="mt-2 text-sm text-white/78">{gift.message ?? "Presente em dinheiro via Pix"}</p>
              </div>
              <span>{formatCurrency(gift.grossAmount)}</span>
              <span className="text-white/78">taxa {formatCurrency(gift.feeAmount)}</span>
              <strong>{formatCurrency(gift.netAmount)}</strong>
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
