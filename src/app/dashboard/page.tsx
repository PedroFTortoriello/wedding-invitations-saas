import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { MetricCard } from "@/components/app/MetricCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import {
  cashGiftRevenueModel,
  cashGiftTransactions,
  demoGuests,
  demoMessages,
  demoWedding,
  formatCurrency,
  platformMetrics
} from "@/lib/platform-data";

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const weddingDate = new Date(demoWedding.weddingDate);
  const daysLeft = Math.max(0, Math.ceil((weddingDate.getTime() - Date.now()) / 86400000));
  const confirmed = demoGuests.filter((guest) => guest.status === "confirmed").length;
  const pending = demoGuests.filter((guest) => guest.status === "pending").length;

  const nextSteps = [
    { done: true, label: "Site publicado e link ativo" },
    {
      done: pending === 0,
      label: pending > 0 ? `Acompanhe ${pending} convidado(s) ainda pendente(s)` : "Todos os convidados responderam"
    },
    { done: false, label: "Adicione novas fotos à galeria do site" },
    { done: false, label: "Compartilhe o link no WhatsApp e nas redes" }
  ];

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
          <StatusBadge status="paid" onDark />
          <Link href="/checkout" className="btn btn-inverse mt-7 w-full text-sm">
            Ver recebimentos
          </Link>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <article className="card p-6">
          <div className="flex items-center justify-between">
            <p className="t-eyebrow text-ink-soft">Confirmações de presença</p>
            <span className="t-eyebrow text-ink-soft">
              {confirmed}/{demoGuests.length}
            </span>
          </div>
          <ul className="mt-5 grid gap-3">
            {demoGuests.map((guest) => (
              <li
                key={guest.id}
                className="flex items-center justify-between gap-3 border-t border-[#5b6842]/10 pt-3 first:border-0 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{guest.name}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {guest.companionsConfirmed > 0 ? `+${guest.companionsConfirmed} acompanhante` : guest.contact}
                  </p>
                </div>
                <StatusBadge status={guest.status} />
              </li>
            ))}
          </ul>
        </article>

        <article className="card p-6">
          <p className="t-eyebrow text-ink-soft">Mensagens recentes</p>
          <ul className="mt-5 grid gap-4">
            {demoMessages.map((message) => (
              <li key={message.id} className="border-t border-[#5b6842]/10 pt-4 first:border-0 first:pt-0">
                <p className="text-sm leading-6 text-ink">“{message.message}”</p>
                <p className="mt-2 text-xs font-bold text-ink-soft">— {message.guestName}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="card p-6 md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <p className="t-eyebrow text-ink-soft">Recebimentos via Pix</p>
            <span className="t-eyebrow text-ink-soft">{formatCurrency(platformMetrics.grossCashGifts)}</span>
          </div>
          <ul className="mt-5 grid gap-3">
            {cashGiftTransactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between gap-3 border-t border-[#5b6842]/10 pt-3 first:border-0 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{transaction.guestName}</p>
                  <p className="text-xs text-ink-soft">{formatDay(transaction.paidAt ?? transaction.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-black text-ink">{formatCurrency(transaction.grossAmount)}</span>
                  <StatusBadge status={transaction.status} />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-6">
        <article className="card p-6">
          <p className="t-eyebrow text-ink-soft">Próximos passos</p>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {nextSteps.map((step) => (
              <li key={step.label} className="flex items-center gap-3">
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full ${
                    step.done ? "bg-forest text-on-forest" : "border-2 border-[#5b6842]/30 text-transparent"
                  }`}
                >
                  <CheckIcon />
                </span>
                <span className={step.done ? "text-sm text-ink-soft line-through" : "text-sm font-bold text-ink"}>
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </AppShell>
  );
}
