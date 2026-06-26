import { AppShell } from "@/components/app/AppShell";
import { PixChargeGenerator } from "@/components/app/PixChargeGenerator";
import { cashGiftRevenueModel, cashGiftTransactions, demoWedding, formatCurrency, platformMetrics } from "@/lib/platform-data";

export default function GiftsPage() {
  return (
    <AppShell
      title="Presentes em dinheiro"
      subtitle="Configure cotas simbólicas e acompanhe os presentes Pix — 100% para o casal, sem taxa."
      active="gifts"
    >
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.4rem] border border-[#5b6842]/12 bg-[#354022] p-6 text-white shadow-[0_18px_52px_rgba(53,64,34,0.12)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#dfe6cc]">Modelo</p>
          <h2 className="mt-3 font-serif text-4xl leading-none">{cashGiftRevenueModel.highlight}</h2>
        </article>
        <article className="rounded-[1.4rem] border border-[#5b6842]/12 bg-[#fffaf1] p-6 shadow-[0_18px_52px_rgba(53,64,34,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5b6842]">Recebido</p>
          <h2 className="mt-3 font-serif text-4xl leading-none">{formatCurrency(platformMetrics.grossCashGifts)}</h2>
        </article>
        <article className="rounded-[1.4rem] border border-[#5b6842]/12 bg-[#fffaf1] p-6 shadow-[0_18px_52px_rgba(53,64,34,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5b6842]">Para o casal</p>
          <h2 className="mt-3 font-serif text-4xl leading-none">100%</h2>
        </article>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {demoWedding.gifts.map((gift) => (
          <article key={gift.id} className="rounded-[1.4rem] border border-[#5b6842]/12 bg-[#fffaf1] p-6 shadow-[0_18px_52px_rgba(53,64,34,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5b6842]">{gift.active ? "Ativo" : "Oculto"}</p>
            <h2 className="mt-3 font-serif text-4xl leading-none">{gift.title}</h2>
            <p className="mt-3 text-sm font-black text-[#354022]">{gift.price}</p>
            <p className="mt-3 min-h-12 text-sm leading-6 text-[#5f5148]">{gift.description}</p>
            <button type="button" className="mt-6 inline-flex min-h-11 rounded-full bg-[#354022] px-5 text-sm font-black text-white">
              Simular Pix
            </button>
          </article>
        ))}
      </div>
      <PixChargeGenerator wedding={demoWedding} gifts={demoWedding.gifts.filter((gift) => gift.active)} />
      <section className="mt-6 rounded-[1.6rem] border border-[#5b6842]/12 bg-[#fffaf1] p-6 shadow-[0_18px_52px_rgba(53,64,34,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#5b6842]">Recebimentos</p>
        <div className="mt-5 grid gap-3">
          {cashGiftTransactions.map((gift) => (
            <div key={gift.id} className="grid gap-3 rounded-3xl bg-[#f7f0e5] p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <strong>{gift.guestName}</strong>
                <p className="text-sm text-[#5f5148]">{gift.message ?? "Presente em dinheiro via Pix"}</p>
              </div>
              <span className="text-sm font-black">{formatCurrency(gift.grossAmount)}</span>
              <span className="text-sm font-black text-[#354022]">100% para o casal</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
