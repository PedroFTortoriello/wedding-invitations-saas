import { AppShell } from "@/components/app/AppShell";
import { cashGiftRevenueModel, cashGiftTransactions, formatCurrency, platformMetrics } from "@/lib/platform-data";

export default function CheckoutPage() {
  return (
    <AppShell
      title="Presentes em dinheiro"
      subtitle="Presentes via Pix vão 100% para o casal, direto na chave do casal, sem taxa da plataforma."
      active="cash-gifts"
    >
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="card-forest p-8 text-on-forest">
          <p className="t-eyebrow text-on-forest">{cashGiftRevenueModel.highlight}</p>
          <h2 className="mt-5 t-display italic">{cashGiftRevenueModel.title}</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-on-forest">{cashGiftRevenueModel.subtitle}</p>
          <ul className="mt-8 grid gap-3">
            {cashGiftRevenueModel.features.map((feature) => (
              <li key={feature} className="flex gap-3 text-sm font-bold text-on-forest">
                <span aria-hidden="true">+</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="card p-8">
          <p className="t-eyebrow text-ink-soft">Resumo dos presentes</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-[#f7f0e5] p-5">
              <span className="t-eyebrow text-ink-soft">Recebido</span>
              <strong className="mt-3 block t-h2 font-normal">{formatCurrency(platformMetrics.grossCashGifts)}</strong>
            </div>
            <div className="rounded-3xl bg-[#f7f0e5] p-5">
              <span className="t-eyebrow text-ink-soft">Taxa sobre presentes</span>
              <strong className="mt-3 block t-h2 font-normal">0%</strong>
            </div>
          </div>
          <p className="mt-6 text-sm leading-6 text-ink-soft">
            Os presentes em dinheiro caem direto na chave Pix do casal — 100% do valor, sem intermediação da plataforma.
          </p>
        </article>
      </section>
      <section className="mt-6 card p-6">
        <p className="t-eyebrow text-ink-soft">Recebimentos Pix</p>
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
