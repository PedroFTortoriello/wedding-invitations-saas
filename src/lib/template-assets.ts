import type { TemplateId } from "@/lib/templates/catalog";

/**
 * Prévias de cada modelo, geradas por `python scripts/capture-templates.py assets <url> all`
 * (recapturar quando um modelo mudar):
 *   phone    primeira tela a 390px, 520px de largura (seletor do editor/onboarding)
 *   full     página inteira a 390px, 360px de largura (rola dentro do iPhone na vitrine)
 *   desktop  primeira tela a 1440px, 1200px de largura (admin e compartilhamento)
 */
export const templateAsset = (id: TemplateId, kind: "phone" | "full" | "desktop") => `/assets/templates/${id}-${kind}.webp`;
