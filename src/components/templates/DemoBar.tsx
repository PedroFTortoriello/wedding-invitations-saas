"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { getConsent, track } from "@/lib/analytics";
import { TEMPLATE_CHOICES } from "@/lib/template-options";
import { TEMPLATE_NAMES, isTemplateId } from "@/lib/wedding";

const POLL_MS = 500;
const MAX_TRIES = 20;

const noSubscribe = () => () => {};

/**
 * Barra fixa das demos (/modelo/<template>/<slug>): diz que é demonstração, leva ao
 * cadastro já com o modelo escolhido e volta para os modelos da landing. Some
 * dentro de iframe (a prévia embutida tem os próprios controles).
 */
export function DemoBar() {
  const templateId = (usePathname() ?? "").split("/")[2] ?? "";
  // false no servidor: a barra já vem no HTML; só some depois da hidratação se estiver num iframe.
  const inIframe = useSyncExternalStore(noSubscribe, () => window.self !== window.top, () => false);

  // ViewContent uma vez por modelo aberto, só com aceite (track() não envia sem ele). Os scripts
  // carregam depois da hidratação, então espera por ~10s (mesmo padrão do PurchaseTracker).
  // ponytail: aceite dos cookies depois de 10s na demo não conta a visita; ouvir CONSENT_EVENT se fizer falta.
  useEffect(() => {
    if (!templateId || inIframe) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      if (getConsent() === "granted" && (window.fbq || window.gtag)) track("view_template", { template: templateId });
      else if (++tries < MAX_TRIES) return;
      window.clearInterval(timer);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [templateId, inIframe]);

  if (inIframe) return null;

  const label = isTemplateId(templateId) ? TEMPLATE_NAMES[templateId] : null;
  // Só modelos oferecidos no cadastro vão no ?modelo (os demais cairiam num id inválido).
  const signupHref = TEMPLATE_CHOICES.some((choice) => choice.id === templateId)
    ? `/cadastro?modelo=${templateId}`
    : "/cadastro";

  return (
    <aside
      data-demo-bar
      aria-label="Demonstração do modelo"
      className="fixed inset-x-0 bottom-0 z-40 bg-forest pb-[env(safe-area-inset-bottom)] font-sans text-on-forest shadow-[0_-12px_32px_rgb(0_0_0/0.2)]"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-2.5 md:flex-row md:items-center md:gap-6 md:px-6 md:py-3">
        <div className="min-w-0 md:flex-1">
          <p className="truncate text-sm leading-5 md:text-base md:leading-6">
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Demonstração</span>
            {label ? (
              <>
                {" · "}
                <span className="font-serif text-lg leading-none md:text-xl md:leading-none">{label}</span>
              </>
            ) : null}
          </p>
          <p className="text-[11px] leading-4 text-on-forest/80 md:text-xs">
            Nesta demonstração, confirmações, recados e Pix não enviam nada.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/#modelos"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-on-forest/30 px-4 text-sm font-semibold transition-colors duration-150 hover:border-on-forest/70 hover:bg-on-forest/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-forest motion-reduce:transition-none"
          >
            <span aria-hidden="true">←</span> Voltar
          </Link>
          <Link
            href={signupHref}
            className="btn btn-sm btn-inverse min-h-11 flex-1 whitespace-nowrap hover:bg-white md:flex-none md:px-6"
          >
            Usar este modelo grátis
          </Link>
        </div>
      </div>
    </aside>
  );
}
