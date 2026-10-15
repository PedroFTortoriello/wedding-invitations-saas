import type { WeddingSite } from "@/types/wedding";

/**
 * Modelos oferecidos no onboarding e no editor, com uma linha de personalidade e
 * uma amostra de 3 cores (fundo, meio, destaque) para o seletor visual.
 */
export const TEMPLATE_CHOICES: {
  id: WeddingSite["templateId"];
  label: string;
  tagline: string;
  swatch: [string, string, string];
}[] = [
  {
    id: "classico-romantico",
    label: "Clássico Romântico",
    tagline: "Fotos amplas e serifas clássicas, atemporal.",
    swatch: ["#fcf7ed", "#e7d9b6", "#1f1712"]
  },
  {
    id: "cinema-noir",
    label: "Cinema Noir",
    tagline: "Cinematográfico, em espresso e champanhe.",
    swatch: ["#2a1f1a", "#c9a86a", "#f4ece0"]
  },
  {
    id: "editorial-luxury",
    label: "Editorial Luxury",
    tagline: "Capa de revista em preto, branco e dourado.",
    swatch: ["#f6f4ef", "#cda968", "#161616"]
  },
  {
    id: "jardim-romantico",
    label: "Jardim Romântico",
    tagline: "Verde jardim, creme e rosa-blush em arcos.",
    swatch: ["#f4eee1", "#e3c4bf", "#56663f"]
  },
  {
    id: "garden-classico",
    label: "Jardim Clássico",
    tagline: "Azul-empoeirado e greige, sóbrio e sereno.",
    swatch: ["#f7f2e8", "#c4c4ba", "#33495c"]
  },
  {
    id: "civil-minimalista",
    label: "Civil Minimalista",
    tagline: "Enxuto e moderno, ótimo para o civil.",
    swatch: ["#f7f5ee", "#d8d3c9", "#1d1d1b"]
  }
];
