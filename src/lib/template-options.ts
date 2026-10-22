import { ACTIVE_TEMPLATES, type TemplateId } from "@/lib/templates/catalog";

/**
 * Modelos oferecidos no onboarding, no editor, na landing e para a IA, com uma linha
 * de personalidade e uma amostra de 3 cores (fundo, meio, destaque). Derivado do
 * catálogo: só os modelos ativos, na ordem das famílias.
 */
export const TEMPLATE_CHOICES: {
  id: TemplateId;
  label: string;
  tagline: string;
  swatch: readonly [string, string, string];
}[] = ACTIVE_TEMPLATES.map((template) => ({
  id: template.id,
  label: template.name,
  tagline: template.tagline,
  swatch: template.swatch
}));
