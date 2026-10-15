import { TEMPLATE_CHOICES } from "@/lib/template-options";
import type { WeddingSite } from "@/types/wedding";

/**
 * Contrato compartilhado da landing: quais modelos aparecem, onde ficam as
 * capturas e como o seletor troca as imagens sem JS.
 */

/** Modelos da vitrine, nesta ordem (o primeiro, claro, é o inicial do hero e o padrão dos CTAs). Clássico e Civil só depois dos bugs (WU8); Pé na Areia fora. */
export const SHOWCASE_IDS = [
  "jardim-romantico",
  "editorial-luxury",
  "garden-classico",
  "cinema-noir"
] as const satisfies readonly WeddingSite["templateId"][];

export type ShowcaseId = (typeof SHOWCASE_IDS)[number];

export const SHOWCASE = SHOWCASE_IDS.flatMap((id) => TEMPLATE_CHOICES.filter((choice) => choice.id === id));

/** Demo completa do modelo (o mesmo casamento de exemplo em todos). */
export const demoPath = (id: ShowcaseId) => `/modelo/${id}/helena-e-lucas`;

/**
 * Página inteira do modelo, para rolar dentro dos aparelhos da seção Modelos:
 * desktop-full 1000px de largura (1440 reduzido), mobile-full 390px. Gera com
 * `python scripts/capture-landing.py <url> tour`.
 */
export const modeloAsset = (id: ShowcaseId, device: "desktop-full" | "mobile-full") =>
  `/assets/landing/modelos/${id}-${device}.webp`;

/**
 * Regras :has() do seletor de modelo sem JS. Marcação esperada:
 *   <div data-tpl-scope={scope}>                      ancestral comum
 *     <fieldset data-template-switch={scope}> rádios com value={id}
 *     ... [data-tpl={id}]                            imagens/legendas trocáveis
 * Só o [data-tpl] do rádio marcado fica visível (display natural). Sem :has(),
 * fica o ids[0], então passe o modelo inicial primeiro.
 * Os ids são constantes do código, nunca entrada de usuário (vai num <style>).
 */
export function switchCss(scope: string, ids: readonly string[]) {
  const root = `[data-tpl-scope="${scope}"]`;
  const rules = ids.map(
    (id) =>
      `${root}:has([data-template-switch="${scope}"] input[value="${id}"]:checked) [data-tpl]:not([data-tpl="${id}"]){display:none}`
  );
  if (ids[0]) rules.push(`@supports not selector(:has(*)){${root} [data-tpl]:not([data-tpl="${ids[0]}"]){display:none}}`);
  return rules.join("\n");
}

/**
 * As 3 woff2 da marca (título roman e itálico, UI) para preload. Cada página da
 * landing renderiza:
 *   {LANDING_FONTS.map((href) => <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="" />)}
 * (o React sobe o <link> para o <head>; ReactDOM.preload() num server component não
 * chegou ao HTML inicial). Não vai no layout raiz para não baixar em sites de casal
 * cujos templates usam outras fontes.
 */
export const LANDING_FONTS = [
  "/assets/fonts/instrument-serif.woff2",
  "/assets/fonts/instrument-serif-italic.woff2",
  "/assets/fonts/instrument-sans.woff2"
] as const;
