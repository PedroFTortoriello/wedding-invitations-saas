"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Único JS próprio da landing: delegação no document, sem estado React.
 * - `?modelo=<id>` pré-seleciona; cada escolha sincroniza todos os seletores e o
 *   href de [data-cta-modelo].
 * - Eventos só-GA4: cta_click, select_template, view_pricing (uma vez).
 * - Teste A/B do CTA fixo e visibilidade de #sticky-cta.
 */

// Lido por cadastro/actions.ts (detail.sticky de signup_completed). Não identifica ninguém.
const AB_COOKIE = "noivar_ab_sticky";

export function LandingBehavior() {
  useEffect(() => {
    const root = document.documentElement;

    // Sorteio só no mobile, onde a barra existe: o desktop não dilui os braços.
    let arm = document.cookie.match(/(?:^|; )noivar_ab_sticky=(on|off)(?:;|$)/)?.[1];
    if (!arm && matchMedia("(max-width: 1023.98px)").matches) {
      arm = Math.random() < 0.5 ? "on" : "off";
      const secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${AB_COOKIE}=${arm}; Max-Age=${90 * 86400}; Path=/; SameSite=Lax${secure}`;
    }

    const radios = () => Array.from(document.querySelectorAll<HTMLInputElement>("[data-template-switch] input[type=radio]"));
    const select = (id: string) => {
      for (const radio of radios()) if (radio.value === id) radio.checked = true;
      for (const a of document.querySelectorAll<HTMLAnchorElement>("a[data-cta-modelo]")) {
        const url = new URL(a.href);
        url.searchParams.set("modelo", id);
        a.setAttribute("href", url.pathname + url.search + url.hash);
      }
    };

    const wanted = new URLSearchParams(location.search).get("modelo");
    const current = document.querySelector<HTMLInputElement>('[data-template-switch="hero"] input:checked')?.value;
    const start = radios().some((radio) => radio.value === wanted) ? wanted : current;
    if (start) select(start);

    const onChange = (event: Event) => {
      const input = event.target as HTMLInputElement;
      const scope = input.closest<HTMLElement>("[data-template-switch]")?.dataset.templateSwitch;
      if (!scope || input.type !== "radio") return;
      select(input.value);
      track("select_template", { template: input.value, location: scope, variant: arm });
    };

    // Captura: roda antes do onClick de um eventual <Link>, que navegaria pelo href da prop.
    const onClick = (event: MouseEvent) => {
      const cta = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[data-cta]");
      if (!cta) return;
      track("cta_click", { location: cta.dataset.cta, variant: arm });
      const plain = event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
      if (plain && cta.hasAttribute("data-cta-modelo")) {
        event.preventDefault();
        location.assign(cta.href);
      }
    };

    const sticky = document.getElementById("sticky-cta");
    const seen = { heroPassed: false, preco: false, fechamento: false };
    const update = () => {
      if (!sticky) return;
      const show =
        arm === "on" && seen.heroPassed && !seen.preco && !seen.fechamento && root.dataset.consentBanner !== "open";
      sticky.dataset.visible = String(show);
      sticky.inert = !show;
    };

    const io = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting, boundingClientRect } of entries) {
        if (target.id === "preco") {
          if (!isIntersecting) continue;
          track("view_pricing", { variant: arm });
          io.unobserve(target);
        } else if (target.id === "hero-cta") seen.heroPassed = !isIntersecting && boundingClientRect.top < 0;
        else if (target.id === "preco-cta") seen.preco = isIntersecting;
        else seen.fechamento = isIntersecting;
      }
      update();
    });
    for (const id of ["hero-cta", "preco", "preco-cta", "fechamento-cta"]) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }

    // Aviso de cookies (Analytics.tsx) marca html[data-consent-banner="open"]: nunca os dois juntos.
    const banner = new MutationObserver(update);
    banner.observe(root, { attributes: true, attributeFilter: ["data-consent-banner"] });

    // Tab num carrossel (.snap-row): o navegador não rola um slide que já aparece em parte.
    const onFocus = (event: FocusEvent) =>
      (event.target as Element).closest(".snap-row > *")?.scrollIntoView({ block: "nearest", inline: "start" });

    document.addEventListener("change", onChange);
    document.addEventListener("click", onClick, true);
    document.addEventListener("focusin", onFocus);
    return () => {
      io.disconnect();
      banner.disconnect();
      document.removeEventListener("change", onChange);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);

  return null;
}
