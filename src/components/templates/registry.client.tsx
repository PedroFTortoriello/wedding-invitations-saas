"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { getTemplate, type TemplateId } from "@/lib/templates/catalog";
import type { WeddingSite } from "@/types/wedding";

type TemplateComponent = ComponentType<{ wedding: WeddingSite }>;

/**
 * Registry do editor (prévia ao vivo): cada modelo é um chunk próprio via next/dynamic,
 * carregado só quando o casal escolhe o modelo, sem SSR (a prévia é interativa e
 * re-renderiza a cada tecla). O site público e as demos não passam por aqui: cada modelo
 * tem o próprio segmento de rota, gerado por scripts/gen-template-routes.mjs a partir
 * desta lista. O placeholder ocupa uma tela para o editor não "pular" ao trocar de modelo.
 * Chave nova aqui = modelo novo no catálogo + `node scripts/gen-template-routes.mjs`.
 */
const load = (loader: () => Promise<TemplateComponent>) =>
  dynamic(loader, { ssr: false, loading: () => <div style={{ minHeight: "100svh" }} aria-hidden /> });

export const TEMPLATE_COMPONENTS: Record<TemplateId, TemplateComponent> = {
  /* Editorial */
  "editorial-ivory": load(() => import("./editorial-ivory/EditorialIvoryTemplate").then((m) => m.EditorialIvoryTemplate)),
  "modern-heirloom": load(() => import("./modern-heirloom/ModernHeirloomTemplate").then((m) => m.ModernHeirloomTemplate)),
  "black-tie": load(() => import("./black-tie/BlackTieTemplate").then((m) => m.BlackTieTemplate)),
  "editorial-luxury": load(() => import("./editorial-luxury/EditorialLuxuryTemplate").then((m) => m.EditorialLuxuryTemplate)),
  "cinema-noir": load(() => import("./cinema-noir/CinemaNoirTemplate").then((m) => m.CinemaNoirTemplate)),
  /* Botânico */
  "botanical-garden": load(() => import("./botanical-garden/BotanicalGardenTemplate").then((m) => m.BotanicalGardenTemplate)),
  wildflower: load(() => import("./wildflower/WildflowerTemplate").then((m) => m.WildflowerTemplate)),
  "secret-garden": load(() => import("./secret-garden/SecretGardenTemplate").then((m) => m.SecretGardenTemplate)),
  "jardim-romantico": load(() => import("./jardim-romantico/JardimRomanticoTemplate").then((m) => m.JardimRomanticoTemplate)),
  /* Minimal */
  "pure-form": load(() => import("./pure-form/PureFormTemplate").then((m) => m.PureFormTemplate)),
  architectural: load(() => import("./architectural/ArchitecturalTemplate").then((m) => m.ArchitecturalTemplate)),
  "soft-minimal": load(() => import("./soft-minimal/SoftMinimalTemplate").then((m) => m.SoftMinimalTemplate)),
  "civil-minimalista": load(() => import("./civil-minimalista/CivilMinimalistTemplate").then((m) => m.CivilMinimalistTemplate)),
  /* Clássico */
  "royal-monogram": load(() => import("./royal-monogram/RoyalMonogramTemplate").then((m) => m.RoyalMonogramTemplate)),
  "classic-invitation": load(() => import("./classic-invitation/ClassicInvitationTemplate").then((m) => m.ClassicInvitationTemplate)),
  heritage: load(() => import("./heritage/HeritageTemplate").then((m) => m.HeritageTemplate)),
  "garden-classico": load(() => import("./garden-classico/GardenClassicTemplate").then((m) => m.GardenClassicTemplate)),
  "classico-romantico": load(() => import("./classico-romantico/ClassicRomanticTemplate").then((m) => m.ClassicRomanticTemplate)),
  /* Destination */
  amalfi: load(() => import("./amalfi/AmalfiTemplate").then((m) => m.AmalfiTemplate)),
  tuscan: load(() => import("./tuscan/TuscanTemplate").then((m) => m.TuscanTemplate)),
  "tropical-escape": load(() => import("./tropical-escape/TropicalEscapeTemplate").then((m) => m.TropicalEscapeTemplate)),
  "pe-na-areia": load(() => import("./pe-na-areia/PeNaAreiaTemplate").then((m) => m.PeNaAreiaTemplate)),
  /* Romântico */
  blush: load(() => import("./blush/BlushTemplate").then((m) => m.BlushTemplate)),
  poetry: load(() => import("./poetry/PoetryTemplate").then((m) => m.PoetryTemplate)),
  "silk-champagne": load(() => import("./silk-champagne/SilkChampagneTemplate").then((m) => m.SilkChampagneTemplate)),
  /* Arte */
  watercolor: load(() => import("./watercolor/WatercolorTemplate").then((m) => m.WatercolorTemplate)),
  "fine-line": load(() => import("./fine-line/FineLineTemplate").then((m) => m.FineLineTemplate)),
  "painted-memories": load(() => import("./painted-memories/PaintedMemoriesTemplate").then((m) => m.PaintedMemoriesTemplate)),
  /* Moderno */
  "bold-type": load(() => import("./bold-type/BoldTypeTemplate").then((m) => m.BoldTypeTemplate)),
  "contemporary-contrast": load(() =>
    import("./contemporary-contrast/ContemporaryContrastTemplate").then((m) => m.ContemporaryContrastTemplate)
  ),
  "avant-garde": load(() => import("./avant-garde/AvantGardeTemplate").then((m) => m.AvantGardeTemplate)),
  /* Campestre */
  countryside: load(() => import("./countryside/CountrysideTemplate").then((m) => m.CountrysideTemplate)),
  "olive-branch": load(() => import("./olive-branch/OliveBranchTemplate").then((m) => m.OliveBranchTemplate)),
  "sunset-fields": load(() => import("./sunset-fields/SunsetFieldsTemplate").then((m) => m.SunsetFieldsTemplate)),
  "olive-burgundy": load(() => import("./olive-burgundy/OliveBurgundyTemplate").then((m) => m.OliveBurgundyTemplate)),
  /* Brasil */
  "tropical-editorial": load(() => import("./tropical-editorial/TropicalEditorialTemplate").then((m) => m.TropicalEditorialTemplate)),
  "jardim-brasileiro": load(() => import("./jardim-brasileiro/JardimBrasileiroTemplate").then((m) => m.JardimBrasileiroTemplate)),
  "modern-celebration": load(() => import("./modern-celebration/ModernCelebrationTemplate").then((m) => m.ModernCelebrationTemplate))
};

/** Prévia do modelo no editor; id desconhecido (conteúdo antigo) cai no padrão do catálogo. */
export function WeddingTemplatePreview({ wedding }: { wedding: WeddingSite }) {
  const Template = TEMPLATE_COMPONENTS[wedding.templateId] ?? TEMPLATE_COMPONENTS[getTemplate(wedding.templateId).id as TemplateId];
  return <Template wedding={wedding} />;
}
