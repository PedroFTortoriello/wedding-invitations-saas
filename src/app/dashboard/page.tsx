import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { MetricCard } from "@/components/app/MetricCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { cashGiftRevenueModel, demoGuests, demoMessages, demoWedding, formatCurrency, platformMetrics } from "@/lib/platform-data";

export default function DashboardPage() {
  const weddingDate = new Date(demoWedding.weddingDate);
  const daysLeft = Math.max(0, Math.ceil((weddingDate.getTime() - Date.now()) / 86400000));
  const confirmed = demoGuests.filter((guest) => guest.status === "confirmed").length;

  return (
    <AppShell
      title="Painel do casal"
      subtitle="Acompanhe publicação, convidados, presentes e personalização do site em um painel único."
      active="dashboard"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Status do site" value="Publicado" helper="Seu link público está ativo para convidados." />
        <MetricCard label="Contagem regressiva" value={`${daysLeft} dias`} helper={demoWedding.weddingDateLabel} />
        <MetricCard label="Confirmações recebidas" value={`${confirmed}/${demoGuests.length}`} helper="Confirmações registradas no painel." />
        <MetricCard label="Mensagens" value={String(demoMessages.length)} helper="Recados carinhosos dos convidados." />
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="card card-accent p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="t-eyebrow text-ink-soft">Site publicado</p>
              <h2 className="mt-3 t-h1 italic">{demoWedding.coupleNames}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">
                O modelo Clássico Romântico está renderizando dados dinâmicos e pronto para evoluir para banco real.
              </p>
            </div>
            <StatusBadge status={demoWedding.status} />
          </div>
          <div className="mt-7 grid gap-3 rounded-3xl bg-[#f7f0e5] p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
            <code className="break-all text-sm text-ink-soft">/casamento/{demoWedding.slug}</code>
            <Link href={`/casamento/${demoWedding.slug}`} className="btn btn-primary text-sm">
              Visualizar
            </Link>
            <Link href="/editor" className="btn btn-secondary text-sm">
              Editar site
            </Link>
          </div>
        </article>

        <article className="card-forest p-6 text-on-forest">
          <p className="t-eyebrow text-on-forest">Presentes em dinheiro</p>
          <h2 className="mt-3 t-h1">{cashGiftRevenueModel.highlight}</h2>
          <p className="mt-4 text-sm leading-6 text-on-forest">
            Recebidos {formatCurrency(platformMetrics.grossCashGifts)} em presentes Pix — 100% para o casal, direto na chave Pix do casal.
          </p>
          <StatusBadge status="paid" />
          <Link href="/checkout" className="btn btn-inverse mt-7 w-full text-sm">
            Ver recebimentos
          </Link>
        </article>
      </section>
    </AppShell>
  );
}
