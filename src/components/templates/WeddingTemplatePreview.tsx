"use client";

import type { WeddingSite } from "@/types/wedding";
import { ClassicRomanticTemplate } from "@/components/templates/classico-romantico/ClassicRomanticTemplate";
import { CivilMinimalistTemplate } from "@/components/templates/civil-minimalista/CivilMinimalistTemplate";
import { GardenClassicTemplate } from "@/components/templates/garden-classico/GardenClassicTemplate";
import { OliveBurgundyTemplate } from "@/components/templates/olive-burgundy/OliveBurgundyTemplate";
import { EditorialLuxuryTemplate } from "@/components/templates/editorial-luxury/EditorialLuxuryTemplate";
import { JardimRomanticoTemplate } from "@/components/templates/jardim-romantico/JardimRomanticoTemplate";
import { PeNaAreiaTemplate } from "@/components/templates/pe-na-areia/PeNaAreiaTemplate";
import { CinemaNoirTemplate } from "@/components/templates/cinema-noir/CinemaNoirTemplate";

/**
 * Mesmo switch de modelos da rota pública, mas em Client Component — para o
 * editor ao vivo, que redesenha o modelo a cada mudança de estado. Os modelos
 * são apresentacionais (dados -> JSX), então rodam tanto no servidor (site
 * público) quanto no cliente (aqui).
 */
export function WeddingTemplatePreview({ wedding }: { wedding: WeddingSite }) {
  switch (wedding.templateId) {
    case "civil-minimalista":
      return <CivilMinimalistTemplate wedding={wedding} />;
    case "garden-classico":
      return <GardenClassicTemplate wedding={wedding} />;
    case "olive-burgundy":
      return <OliveBurgundyTemplate wedding={wedding} />;
    case "editorial-luxury":
      return <EditorialLuxuryTemplate wedding={wedding} />;
    case "jardim-romantico":
      return <JardimRomanticoTemplate wedding={wedding} />;
    case "pe-na-areia":
      return <PeNaAreiaTemplate wedding={wedding} />;
    case "cinema-noir":
      return <CinemaNoirTemplate wedding={wedding} />;
    case "classico-romantico":
    default:
      return <ClassicRomanticTemplate wedding={wedding} />;
  }
}
