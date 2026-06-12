import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OliveBurgundyTemplate } from "@/components/templates/olive-burgundy/OliveBurgundyTemplate";
import { getDemoWeddingBySlug } from "@/lib/demo-wedding";
import type { WeddingLocation, WeddingSite } from "@/types/wedding";

type OliveBurgundyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Conteúdo de demonstração fiel ao vídeo de referência (Olive Burgundy save the date).
const demoLocation: WeddingLocation = {
  id: "occitanie",
  title: "Meet us in",
  venue: "Occitanie",
  city: "Occitanie, France",
  note: "Formal invitation to follow",
  mapUrl: "https://maps.google.com/?q=Occitanie+France",
  image: ""
};

function toOliveDemo(wedding: WeddingSite): WeddingSite {
  return {
    ...wedding,
    templateId: "olive-burgundy",
    templateName: "Olive Burgundy — Save the Date",
    coupleNames: "Clara Ashford & Elliot Reed",
    monogram: "C&E",
    weddingDate: "2027-06-21T12:30:00",
    weddingDateLabel: "21.06.2027",
    weddingTime: "Twelve thirty in the afternoon",
    locations: [demoLocation, ...wedding.locations.slice(1)]
  };
}

export async function generateMetadata({ params }: OliveBurgundyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    return {
      title: "Modelo não encontrado"
    };
  }

  return {
    title: "Modelo Olive Burgundy | Clara & Elliot",
    description: "Demonstração do modelo Olive Burgundy — save the date digital com envelope, selo de cera e contagem regressiva."
  };
}

export function generateStaticParams() {
  return [{ slug: "pedro-e-rafaela" }];
}

export default async function OliveBurgundyPage({ params }: OliveBurgundyPageProps) {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    notFound();
  }

  return <OliveBurgundyTemplate wedding={toOliveDemo(wedding)} />;
}
