import { SHOWCASE_IDS, type ShowcaseId } from "./showcase";
import { PUBLISH_FEE_LABEL } from "@/lib/platform-data";

/**
 * CTA fixo abaixo de 1024px. Nasce escondido e inerte (sem JS nunca aparece). O
 * LandingBehavior liga data-visible depois que #hero-cta sai da tela e desliga
 * perto de #preco-cta/#fechamento-cta, com o aviso de cookies aberto e no braço
 * "off" do teste A/B.
 */
export function StickyCta({ modelo = SHOWCASE_IDS[0] }: { modelo?: ShowcaseId }) {
  return (
    <div
      id="sticky-cta"
      data-visible="false"
      inert
      className="fixed inset-x-0 bottom-0 z-40 translate-y-full border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] transition-transform duration-180 ease-out data-[visible=true]:translate-y-0 motion-reduce:transition-none lg:hidden"
    >
      <div className="wrap flex h-16 items-center justify-between gap-3">
        <p className="min-w-0 leading-tight">
          <span className="block text-sm text-ink">Grátis para montar</span>
          <span className="block text-[13px] text-ink-soft">{PUBLISH_FEE_LABEL} só ao publicar</span>
        </p>
        {/* <a>, não <Link>: o LandingBehavior reescreve o href com o modelo escolhido. */}
        <a
          href={`/cadastro?modelo=${modelo}`}
          data-cta="sticky"
          data-cta-modelo
          className="btn btn-primary min-h-12 shrink-0 px-5 text-[15px]"
        >
          Montar grátis
        </a>
      </div>
    </div>
  );
}
