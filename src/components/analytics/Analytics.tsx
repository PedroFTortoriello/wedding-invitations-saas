"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { Analytics as VercelAnalytics, type BeforeSend } from "@vercel/analytics/next";
import { captureAttribution, CONSENT_EVENT, getConsent, resetConsent, setConsent, type Consent } from "@/lib/analytics";

// Validados porque entram num <script> inline: um valor mal configurado não vira código.
const META_PIXEL_ID = /^\d{5,20}$/.test(process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "") ? process.env.NEXT_PUBLIC_META_PIXEL_ID : undefined;
const GA_ID = /^G-[A-Z0-9]{4,15}$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "") ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID : undefined;

function subscribeConsent(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

/**
 * Sites dos casais e o acesso da cerimonialista são dos convidados, não do funil
 * da Noivar: nada de pixel, GA ou aviso de cookies ali. Admin é interno.
 */
const UNTRACKED = [/^\/casamento\//, /^\/coordenacao\//, /^\/admin(\/|$)/];

/** Telas com dados de convidados (nomes, recados, presentes): aviso sim, mas sem carregar Pixel/GA nem PageView. */
const GUEST_DATA = /^\/(convidados|mensagens|presentes|checkout)(\/|$)/;

/**
 * Vercel Web Analytics: contagem de visitas sem cookies (não pede aceite), só nas páginas da Noivar.
 * O componente nem monta fora delas; o filtro é a segunda trava para eventos de navegação.
 */
const onlyNoivarPages: BeforeSend = (event) => {
  const path = new URL(event.url).pathname;
  return UNTRACKED.some((re) => re.test(path)) || GUEST_DATA.test(path) ? null : event;
};

/**
 * Montado uma vez no layout raiz. Captura a atribuição de campanha, pede o
 * consentimento (LGPD) e só então carrega Meta Pixel + GA4. Em navegação client-side
 * (App Router) o PageView do Pixel sai daqui; o do GA4, da própria tag
 * (page_view no config + mudanças de histórico da medição otimizada).
 */
export function Analytics() {
  const pathname = usePathname() ?? "/";
  const untracked = UNTRACKED.some((re) => re.test(pathname));
  const tagged = !untracked && !GUEST_DATA.test(pathname);
  // undefined no servidor: o aviso só aparece depois da hidratação (sem mismatch).
  const consent = useSyncExternalStore<Consent | null | undefined>(subscribeConsent, getConsent, () => undefined);
  const lastPath = useRef<string | null>(null);
  const enabled = Boolean(META_PIXEL_ID || GA_ID);

  useEffect(() => {
    if (!untracked) captureAttribution();
  }, [pathname, untracked, consent]);

  // Um PageView por rota. Roda depois do efeito do <Script> filho (que injeta o snippet
  // na mesma renderização), então fbq já existe no carregamento e no "Aceitar".
  useEffect(() => {
    if (consent !== "granted" || lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (tagged) window.fbq?.("track", "PageView");
  }, [pathname, tagged, consent]);

  const visits = tagged ? <VercelAnalytics beforeSend={onlyNoivarPages} /> : null;

  if (!enabled || untracked) return visits;

  return (
    <>
      {visits}
      {/* autoConfig false: sem eventos automáticos nem leitura de campos/botões (chave Pix, convidados).
          disablePushState: o PageView de rota sai só do efeito acima. */}
      {consent === "granted" && tagged && META_PIXEL_ID ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq.disablePushState=true;fbq('set','autoConfig',false,'${META_PIXEL_ID}');fbq('init','${META_PIXEL_ID}');`}
        </Script>
      ) : null}
      {consent === "granted" && tagged && GA_ID ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      ) : null}
      {consent === null ? <ConsentBanner /> : null}
    </>
  );
}

/**
 * Mobile: barra inteira no rodapé, 70px a 390px e 87px a 360px (o padding de baixo vira a
 * safe area quando ela existe, em vez de somar). Desktop: card compacto. Recusar e Aceitar
 * com o mesmo peso visual (LGPD: recusar tão fácil quanto aceitar).
 */
function ConsentBanner() {
  // Contrato com o CTA fixo da landing: html[data-consent-banner="open"] enquanto o aviso
  // está na tela, para os dois nunca aparecerem juntos.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.consentBanner = "open";
    return () => {
      delete root.dataset.consentBanner;
    };
  }, []);

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-2.5 border-t border-line bg-surface px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-ink shadow-[0_-6px_24px_rgb(26_30_21/0.08)] transition-[opacity,translate] duration-200 starting:translate-y-3 starting:opacity-0 motion-reduce:transition-none sm:inset-x-4 sm:bottom-4 sm:mx-auto sm:max-w-xl sm:gap-4 sm:rounded-lg sm:border sm:p-3 sm:pl-4 sm:shadow-[0_12px_40px_rgb(26_30_21/0.16)]"
    >
      <p className="min-w-0 flex-1 text-[13px] leading-[1.35]">
        Cookies de medição de anúncios, só com o seu aceite.{" "}
        <Link href="/privacidade" className="rounded-sm font-semibold whitespace-nowrap underline decoration-ink/40 underline-offset-2 hover:decoration-ink">
          Política de privacidade
        </Link>
      </p>
      <div className="flex shrink-0 gap-1.5 sm:gap-2">
        <button type="button" onClick={() => setConsent("denied")} className="btn btn-sm btn-secondary px-3">
          Recusar
        </button>
        <button type="button" onClick={() => setConsent("granted")} className="btn btn-sm btn-secondary px-3">
          Aceitar
        </button>
      </div>
    </div>
  );
}

/** Reabre o aviso de cookies para mudar ou revogar a escolha. Some quando não há Pixel/GA configurado. */
export function CookiePreferencesButton({ className }: { className?: string }) {
  if (!META_PIXEL_ID && !GA_ID) return null;
  return (
    <button type="button" onClick={resetConsent} className={className}>
      Preferências de cookies
    </button>
  );
}
