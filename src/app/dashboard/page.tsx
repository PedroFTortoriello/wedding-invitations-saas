import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { MetricCard } from "@/components/app/MetricCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { rowToWeddingSite } from "@/lib/wedding";
import { formatCurrency } from "@/lib/platform-data";
import { PublishPanel } from "./PublishPanel";

export const dynamic = "force-dynamic";

const formatDay = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - Date.now()) / 86400000));
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ publicacao?: string }>;
}) {
  const { publicacao } = await searchParams;
  const row = await getOwnedWeddingRow();
  if (!row) {
    redirect("/onboarding");
  }

  const site = rowToWeddingSite(row);
  const supabase = await createClient();

  const [{ data: guests }, { data: messages }, { data: gifts }] = await Promise.all([
    supabase.from("guests").select("*").eq("wedding_id", row.id).order("created_at", { ascending: false }),
    supabase.from("messages").select("*").eq("wedding_id", row.id).order("created_at", { ascending: false }),
    supabase.from("cash_gifts").select("*").eq("wedding_id", row.id).order("created_at", { ascending: false })
  ]);

  const guestList = guests ?? [];
  const messageList = messages ?? [];
  const giftList = gifts ?? [];

  const confirmed = guestList.filter((guest) => guest.status === "confirmed").length;
  const pending = guestList.filter((guest) => guest.status === "pending").length;
  const grossCashGifts = giftList
    .filter((gift) => gift.status === "paid")
    .reduce((total, gift) => total + Number(gift.gross_amount), 0);

  const daysLeft = daysUntil(site.weddingDate);
  const isPublished = site.status === "published";

  const nextSteps = [
    { done: isPublished, label: isPublished ? "Site publicado e link ativo" : "Publicar o site (pague a taxa única)" },
    {
      done: pending === 0 && guestList.length > 0,
      label:
        guestList.length === 0
          ? "Compartilhe o link para receber as primeiras confirmações"
          : pending > 0
            ? `Acompanhe ${pending} convidado(s) ainda pendente(s)`
            : "Todos os convidados responderam"
    },
    { done: Boolean(site.pixKey), label: site.pixKey ? "Chave Pix configurada" : "Configure sua chave Pix no editor" },
    { done: false, label: "Compartilhe o link no WhatsApp e nas redes" }
  ];

  return (
    <AppShell
      title="Painel do casal"
      subtitle="Acompanhe publicação, convidados, presentes e personalização do site em um painel único."
      active="dashboard"
    >
      {publicacao === "paga" && !isPublished ? (
        <p className="mb-6 rounded-2xl bg-forest/10 px-4 py-3 text-sm font-bold text-forest">
          Pagamento recebido. Clique em “Publicar agora” para colocar seu site no ar.
        </p>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Status do site" value={isPublished ? "Publicado" : "Rascunho"} helper={isPublished ? "Seu link público está ativo." : "Publique para deixar o site no ar."} />
        <MetricCard label="Contagem regressiva" value={`${daysLeft} dias`} helper={site.weddingDateLabel} />
        <MetricCard label="Confirmações" value={`${confirmed}/${guestList.length}`} helper="Confirmações registradas no painel." />
        <MetricCard label="Mensagens" value={String(messageList.length)} helper="Recados carinhosos dos convidados." />
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="card card-accent p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="t-eyebrow text-ink-soft">{isPublished ? "Site publicado" : "Rascunho"}</p>
              <h2 className="mt-3 t-h1 italic">{site.coupleNames}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">
                Modelo {site.templateName}. Edite os dados e publique quando estiver pronto.
              </p>
            </div>
            <StatusBadge status={site.status} />
          </div>
          <div className="mt-7 grid gap-3 rounded-3xl bg-[#f7f0e5] p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
            <code className="break-all text-sm text-ink-soft">/casamento/{site.slug}</code>
            <Link href={`/casamento/${site.slug}`} className="btn btn-primary text-sm">
              Visualizar
            </Link>
            <Link href="/editor" className="btn btn-secondary text-sm">
              Editar site
            </Link>
          </div>
          <PublishPanel weddingId={row.id} status={site.status} paid={Boolean(row.publish_paid_at)} />
        </article>

        <article className="card-forest p-6 text-on-forest">
          <p className="t-eyebrow text-on-forest">Presentes em dinheiro</p>
          <h2 className="mt-3 t-h1">0% de taxa · 100% para o casal</h2>
          <p className="mt-4 text-sm leading-6 text-on-forest">
            Recebidos {formatCurrency(grossCashGifts)} em presentes Pix — direto na sua chave, sem intermediação.
          </p>
          <Link href="/presentes" className="btn btn-inverse mt-7 w-full text-sm">
            Ver presentes
          </Link>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <article className="card p-6">
          <div className="flex items-center justify-between">
            <p className="t-eyebrow text-ink-soft">Confirmações de presença</p>
            <span className="t-eyebrow text-ink-soft">
              {confirmed}/{guestList.length}
            </span>
          </div>
          {guestList.length === 0 ? (
            <p className="mt-5 text-sm leading-6 text-ink-soft">Nenhuma confirmação ainda. Compartilhe o link do site.</p>
          ) : (
            <ul className="mt-5 grid gap-3">
              {guestList.slice(0, 6).map((guest) => (
                <li
                  key={guest.id}
                  className="flex items-center justify-between gap-3 border-t border-[#5b6842]/10 pt-3 first:border-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{guest.name}</p>
                    <p className="truncate text-xs text-ink-soft">
                      {guest.companions_confirmed > 0 ? `+${guest.companions_confirmed} acompanhante` : guest.contact ?? "—"}
                    </p>
                  </div>
                  <StatusBadge status={guest.status} />
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card p-6">
          <p className="t-eyebrow text-ink-soft">Mensagens recentes</p>
          {messageList.length === 0 ? (
            <p className="mt-5 text-sm leading-6 text-ink-soft">Os recados dos convidados aparecem aqui.</p>
          ) : (
            <ul className="mt-5 grid gap-4">
              {messageList.slice(0, 4).map((message) => (
                <li key={message.id} className="border-t border-[#5b6842]/10 pt-4 first:border-0 first:pt-0">
                  <p className="text-sm leading-6 text-ink">“{message.message}”</p>
                  <p className="mt-2 text-xs font-bold text-ink-soft">— {message.guest_name}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card p-6 md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <p className="t-eyebrow text-ink-soft">Recebimentos via Pix</p>
            <span className="t-eyebrow text-ink-soft">{formatCurrency(grossCashGifts)}</span>
          </div>
          {giftList.length === 0 ? (
            <p className="mt-5 text-sm leading-6 text-ink-soft">Os presentes em dinheiro recebidos aparecem aqui.</p>
          ) : (
            <ul className="mt-5 grid gap-3">
              {giftList.slice(0, 6).map((gift) => (
                <li
                  key={gift.id}
                  className="flex items-center justify-between gap-3 border-t border-[#5b6842]/10 pt-3 first:border-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{gift.guest_name}</p>
                    <p className="text-xs text-ink-soft">{formatDay(gift.paid_at ?? gift.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-black text-ink">{formatCurrency(Number(gift.gross_amount))}</span>
                    <StatusBadge status={gift.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
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
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
                    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className={step.done ? "text-sm text-ink-soft line-through" : "text-sm font-bold text-ink"}>{step.label}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </AppShell>
  );
}
