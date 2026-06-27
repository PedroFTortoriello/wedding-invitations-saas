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
        <article className="card-forest p-6 text-on-forest">
          <p className="t-eyebrow text-on-forest">Modelo</p>
          <h2 className="mt-3 t-h2">{cashGiftRevenueModel.highlight}</h2>
        </article>
        <article className="card p-6">
          <p className="t-eyebrow text-ink-soft">Recebido</p>
          <h2 className="mt-3 t-h2">{formatCurrency(platformMetrics.grossCashGifts)}</h2>
        </article>
        <article className="card p-6">
          <p className="t-eyebrow text-ink-soft">Para o casal</p>
          <h2 className="mt-3 t-h2">100%</h2>
        </article>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {demoWedding.gifts.map((gift) => (
          <article key={gift.id} className="card p-6">
            <p className="t-eyebrow text-ink-soft">{gift.active ? "Ativo" : "Oculto"}</p>
            <h2 className="mt-3 t-h2">{gift.title}</h2>
            <p className="mt-3 text-sm font-black text-forest">{gift.price}</p>
            <p className="mt-3 min-h-12 text-sm leading-6 text-ink-soft">{gift.description}</p>
            <button type="button" className="btn btn-primary mt-6 min-h-11 text-sm">
              Simular Pix
            </button>
          </article>
        ))}
      </div>
      <PixChargeGenerator wedding={demoWedding} gifts={demoWedding.gifts.filter((gift) => gift.active)} />
      <section className="mt-6 card p-6">
        <p className="t-eyebrow text-ink-soft">Recebimentos</p>
        <div className="mt-5 grid gap-3">
          {cashGiftTransactions.map((gift) => (
            <div key={gift.id} className="grid gap-3 rounded-3xl bg-[#f7f0e5] p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <strong>{gift.guestName}</strong>
                <p className="text-sm text-ink-soft">{gift.message ?? "Presente em dinheiro via Pix"}</p>
              </div>
              <span className="text-sm font-black">{formatCurrency(gift.grossAmount)}</span>
              <span className="text-sm font-black text-forest">100% para o casal</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
