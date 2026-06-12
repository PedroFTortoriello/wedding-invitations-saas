import { AppShell } from "@/components/app/AppShell";
import { cashGiftRevenueModel, cashGiftTransactions, formatCurrency, platformMetrics } from "@/lib/platform-data";

export default function CheckoutPage() {
  return (
    <AppShell
      title="Presentes em dinheiro"
      subtitle="Receita da plataforma via presentes convertidos em dinheiro, com taxa a partir de 1,5% via Pix."
      active="cash-gifts"
    >
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.8rem] bg-[#354022] p-8 text-white shadow-[0_22px_70px_rgba(53,64,34,0.18)]">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#dfe6cc]">{cashGiftRevenueModel.minimumFeeLabel}</p>
          <h2 className="mt-5 font-serif text-7xl italic leading-none">{cashGiftRevenueModel.title}</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/84">{cashGiftRevenueModel.subtitle}</p>
          <ul className="mt-8 grid gap-3">
            {cashGiftRevenueModel.features.map((feature) => (
              <li key={feature} className="flex gap-3 text-sm font-bold text-white/86">
                <span aria-hidden="true">+</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-[1.8rem] border border-[#5b6842]/12 bg-[#fffaf1] p-8 shadow-[0_18px_52px_rgba(53,64,34,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#5b6842]">Simulacao financeira</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-[#f7f0e5] p-5">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#5b6842]">Recebido</span>
              <strong className="mt-3 block font-serif text-4xl font-normal">{formatCurrency(platformMetrics.grossCashGifts)}</strong>
            </div>
            <div className="rounded-3xl bg-[#f7f0e5] p-5">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#5b6842]">Taxa</span>
              <strong className="mt-3 block font-serif text-4xl font-normal">{formatCurrency(platformMetrics.revenue)}</strong>
            </div>
            <div className="rounded-3xl bg-[#f7f0e5] p-5">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#5b6842]">Liquido</span>
              <strong className="mt-3 block font-serif text-4xl font-normal">{formatCurrency(platformMetrics.netCashGifts)}</strong>
            </div>
          </div>
          <p className="mt-6 text-sm leading-6 text-[#5f5148]">
            O casal pode receber presentes em dinheiro com liberdade. A plataforma monetiza por uma pequena taxa sobre Pix confirmado.
          </p>
        </article>
      </section>
      <section className="mt-6 rounded-[1.6rem] border border-[#5b6842]/12 bg-[#fffaf1] p-6 shadow-[0_18px_52px_rgba(53,64,34,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#5b6842]">Recebimentos Pix</p>
        <div className="mt-5 grid gap-3">
          {cashGiftTransactions.map((gift) => (
            <div key={gift.id} className="grid gap-3 rounded-3xl bg-[#f7f0e5] p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <div>
                <strong>{gift.guestName}</strong>
                <p className="text-sm text-[#5f5148]">{gift.message ?? "Presente em dinheiro via Pix"}</p>
              </div>
              <span className="text-sm font-black">{formatCurrency(gift.grossAmount)}</span>
              <span className="text-sm text-[#5f5148]">taxa {formatCurrency(gift.feeAmount)}</span>
              <span className="text-sm font-black text-[#354022]">liquido {formatCurrency(gift.netAmount)}</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
