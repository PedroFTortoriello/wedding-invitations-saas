import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/app/icons";
import { PublishButton } from "@/components/app/PublishButton";
import { SupportBar } from "@/components/app/SupportBar";
import { getActingContext } from "@/lib/acting";
import { COMPANY, whatsappLink } from "@/lib/company";
import { recordFunnelEventAfter } from "@/lib/funnel";
import { platformName, publishFee } from "@/lib/platform-data";
import { getPublishReadiness } from "@/lib/publish-readiness";
import { rowToWeddingSite } from "@/lib/wedding";
import { getOwnedWeddingRow, isAiMade } from "@/lib/wedding-server";
import { PurchaseTracker } from "../dashboard/PurchaseTracker";
import { PublishStatus } from "./PublishStatus";
import { hasRecentPurchase } from "./recent-purchase";
import { LiveNow, SiteCard, StatusLayout, type SiteCardData } from "./SiteLive";

export const dynamic = "force-dynamic";
export const metadata = { title: "Publicar o site" };

/** O que a taxa libera — só recursos que existem de fato. */
const INCLUDED = [
  "Link próprio para mandar no WhatsApp e no convite",
  "Confirmação de presença pela lista de convidados",
  "Presentes em dinheiro via Pix, direto na conta de vocês",
  "Mural de recados dos convidados",
  "Edições ilimitadas, que aparecem na hora",
  `No ar por pelo menos ${COMPANY.siteMonthsAfterWedding} meses depois do casamento`
];

export default async function PublishPage({ searchParams }: { searchParams: Promise<{ pagamento?: string }> }) {
  const { pagamento } = await searchParams;
  const ctx = await getActingContext();
  const support = ctx.support;
  const row = await getOwnedWeddingRow(ctx);
  if (!row) {
    redirect("/onboarding");
  }

  const site = rowToWeddingSite(row);
  const paid = Boolean(row.publish_paid_at);
  const fee = publishFee(await isAiMade(ctx.db, row.id).catch(() => false));

  // Origem absoluta para os links (APP_URL em prod, host da requisição em dev).
  const hdrs = await headers();
  const appOrigin =
    process.env.APP_URL || `${hdrs.get("x-forwarded-proto") ?? "http"}://${hdrs.get("host") ?? "localhost:3000"}`;
  const card: SiteCardData = {
    slug: site.slug,
    coupleNames: site.coupleNames,
    dateLabel: site.weddingDateLabel,
    heroImage: site.heroImage,
    url: `${appOrigin}/casamento/${site.slug}`
  };

  // Modo suporte: nunca dispara o Purchase da campanha no navegador do admin.
  const recentPurchase = support ? false : await hasRecentPurchase(row.id, row.publish_paid_at);
  const inactive = site.status === "suspended" || site.status === "expired";

  let content: ReactNode;
  if (inactive) {
    content = (
      <StatusLayout site={card} status={site.status}>
        <h1 className="t-h1 text-balance">
          Este site está <em>{site.status === "suspended" ? "suspenso" : "expirado"}</em>
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-ink-soft">
          Para reativar, fale com a gente no WhatsApp ({COMPANY.whatsappHours}).
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          <a
            href={whatsappLink("Olá! Quero reativar o meu site de casamento.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primary"
          >
            <Icon name="whatsapp" size={16} />
            Falar no WhatsApp
          </a>
          <Link href="/dashboard" className="btn btn-sm btn-ghost">
            Voltar ao painel
          </Link>
        </div>
      </StatusLayout>
    );
  } else if (pagamento === "concluido") {
    content = (
      <PublishStatus weddingId={row.id} site={card} initial={{ status: site.status, paid }} blocked={Boolean(support)} />
    );
  } else if (site.status === "published") {
    content = (
      <StatusLayout site={card} status={site.status}>
        <LiveNow site={card} title={<>Seu site está <em>no ar</em></>} />
      </StatusLayout>
    );
  } else {
    const readiness = getPublishReadiness(site);
    // A visita do suporte não é do casal: fica fora do funil.
    if (!support) {
      recordFunnelEventAfter({
        event: "publish_page_viewed",
        userId: row.owner_id,
        weddingId: row.id,
        path: "/publicar",
        detail: { paid, ready: readiness.ready, doneCount: readiness.doneCount }
      });
    }
    content = (
      <Decision weddingId={row.id} card={card} paid={paid} fee={fee} readiness={readiness} blocked={Boolean(support)} />
    );
  }

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {support ? <SupportBar support={support} /> : null}
      <header className="flex h-16 items-center justify-between gap-4 border-b border-line px-4 md:px-8">
        <Link href="/dashboard" className="font-serif text-[1.75rem] italic leading-none">
          {platformName}
        </Link>
        <Link href="/editor" className="btn btn-sm btn-ghost">
          <Icon name="chevronLeft" size={16} />
          Voltar ao editor
        </Link>
      </header>
      {recentPurchase ? <PurchaseTracker weddingId={row.id} value={fee.brl} /> : null}
      {content}
    </div>
  );
}

function Decision({
  weddingId,
  card,
  paid,
  fee,
  readiness,
  blocked
}: {
  weddingId: string;
  card: SiteCardData;
  paid: boolean;
  fee: ReturnType<typeof publishFee>;
  readiness: ReturnType<typeof getPublishReadiness>;
  /** Modo suporte: pagar e publicar ficam só com o casal. */
  blocked: boolean;
}) {
  return (
    <main className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:gap-14 lg:py-14">
      <div className="grid gap-6">
        <div className="hero-rise">
          <h1 className="t-h1 text-balance">
            {paid ? (
              <>
                Pagamento confirmado. <em>Falta só publicar.</em>
              </>
            ) : readiness.ready ? (
              <>
                Tudo pronto para <em>ir ao ar</em>
              </>
            ) : (
              <>
                Quase pronto para <em>ir ao ar</em>
              </>
            )}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
            {paid
              ? "A taxa já está paga. Publiquem quando quiserem: o link passa a funcionar para os convidados na hora."
              : "Confiram como o site está e publiquem quando quiserem. Até lá, só vocês veem a prévia."}
          </p>
          <Link href={`/casamento/${card.slug}`} target="_blank" className="btn btn-sm btn-secondary mt-5">
            Ver prévia
            <Icon name="external" size={15} />
          </Link>
        </div>

        <div className="hero-rise [animation-delay:80ms]">
          <SiteCard site={card} status="draft" row />
        </div>

        <section className="panel hero-rise [animation-delay:160ms]" aria-labelledby="readiness-title">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <h2 id="readiness-title" className="text-base font-semibold">
              O que os convidados vão ver
            </h2>
            <span className="text-sm text-ink-soft">
              {readiness.doneCount} de {readiness.requiredCount}
            </span>
          </div>
          <ul className="mt-3 px-2 pb-2">
            {readiness.items.map((item) =>
              item.done ? (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest text-on-forest">
                    <Icon name="check" size={15} strokeWidth={2.6} />
                  </span>
                  <span className="text-[0.9375rem] text-ink-soft">
                    {item.label}
                    <span className="sr-only"> (feito)</span>
                  </span>
                </li>
              ) : (
                <li key={item.id}>
                  <Link
                    href={`/editor?secao=${item.section}`}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-forest/5 motion-reduce:transition-none"
                  >
                    <span className="size-8 shrink-0 rounded-full border border-dashed border-line-strong" aria-hidden />
                    <span className="grid min-w-0 flex-1">
                      <span className="text-[0.9375rem] font-semibold text-ink">{item.label}</span>
                      {item.optional ? <span className="text-[0.8125rem] text-ink-soft">Recomendado</span> : null}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-forest">
                      Completar
                      <Icon
                        name="chevronRight"
                        size={16}
                        className="transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
                      />
                    </span>
                  </Link>
                </li>
              )
            )}
          </ul>
          {readiness.ready ? null : (
            <p className="mx-5 mb-5 flex items-start gap-2.5 rounded-lg bg-bg-2 px-3.5 py-3 text-sm leading-5 text-ink">
              <Icon name="clock" size={17} className="mt-px shrink-0 text-ink-soft" />
              Dá para publicar agora e completar depois — mudanças aparecem na hora para os convidados.
            </p>
          )}
        </section>
      </div>

      <aside
        aria-label="Publicação"
        className={`hero-rise rounded-[0.875rem] bg-forest p-6 text-on-forest [animation-delay:120ms] sm:p-7 lg:sticky ${blocked ? "lg:top-20" : "lg:top-8"}`}
      >
        {paid ? (
          <>
            <p className="t-eyebrow text-on-forest/80">Taxa paga</p>
            <p className="mt-4 font-serif text-[2.25rem] leading-[1.05]">Pronto para publicar</p>
            <p className="mt-2 text-[0.9375rem] leading-6 text-on-forest/90">
              O link passa a funcionar para os convidados assim que vocês publicarem.
            </p>
            <div className="mt-6">
              <PublishButton weddingId={weddingId} paid onDark block blocked={blocked} />
            </div>
          </>
        ) : (
          <>
            <p className="t-eyebrow text-on-forest/80">Taxa única de publicação</p>
            <p className="mt-4 font-serif text-[3.25rem] leading-none tracking-[-0.02em]">{fee.label}</p>
            <p className="mt-2 text-[0.9375rem] text-on-forest/90">pagamento único via Pix · sem mensalidade</p>
            <div className="mt-6">
              <PublishButton weddingId={weddingId} paid={false} fee={fee} onDark block blocked={blocked} />
            </div>
            <p className="mt-3 text-sm leading-5 text-on-forest/90">O site entra no ar assim que o Pix é confirmado.</p>
            <ul className="mt-5 grid gap-2 text-sm font-medium">
              {(
                [
                  { icon: "wallet", text: `Reembolso integral em até ${COMPANY.refundDays} dias` },
                  { icon: "pix", text: "0% de taxa nos presentes via Pix" }
                ] satisfies { icon: IconName; text: string }[]
              ).map((item) => (
                <li key={item.text} className="flex items-center gap-2.5">
                  <Icon name={item.icon} size={17} className="shrink-0" />
                  {item.text}
                </li>
              ))}
            </ul>
            {/* Preço e botão primeiro: no celular o CTA não fica a duas telas de distância. */}
            <h2 className="t-eyebrow mt-6 border-t border-on-forest/15 pt-6 text-on-forest/80">Incluso na taxa</h2>
            <ul className="mt-4 grid gap-2.5">
              {INCLUDED.map((text) => (
                <li key={text} className="flex items-start gap-2.5 text-[0.9375rem] leading-6">
                  <Icon name="check" size={16} strokeWidth={2.4} className="mt-1 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-6 border-t border-on-forest/15 pt-5 text-[0.8125rem] leading-5 text-on-forest/85">
          Dúvidas?{" "}
          <a
            href={whatsappLink("Olá! Tenho uma dúvida sobre a publicação do meu site.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-on-forest underline underline-offset-2"
          >
            Fale com a gente no WhatsApp
          </a>
          , {COMPANY.whatsappHours}.
        </p>
      </aside>
    </main>
  );
}
