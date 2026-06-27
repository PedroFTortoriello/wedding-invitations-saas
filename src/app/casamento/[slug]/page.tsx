import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassicRomanticTemplate } from "@/components/templates/classico-romantico/ClassicRomanticTemplate";
import { CivilMinimalistTemplate } from "@/components/templates/civil-minimalista/CivilMinimalistTemplate";
import { GardenClassicTemplate } from "@/components/templates/garden-classico/GardenClassicTemplate";
import { OliveBurgundyTemplate } from "@/components/templates/olive-burgundy/OliveBurgundyTemplate";
import { rowToWeddingSite } from "@/lib/wedding";
import { getWeddingBySlug } from "@/lib/wedding-server";
import type { WeddingSite } from "@/types/wedding";

export const dynamic = "force-dynamic";

type PublicWeddingPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PublicWeddingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const row = await getWeddingBySlug(slug);

  if (!row) {
    return { title: "Casamento não encontrado" };
  }

  const site = rowToWeddingSite(row);
  return {
    title: site.seo.title,
    description: site.seo.description,
    openGraph: {
      title: site.seo.title,
      description: site.seo.description,
      images: site.heroImage ? [site.heroImage] : []
    }
  };
}

function WeddingTemplate({ site }: { site: WeddingSite }) {
  switch (site.templateId) {
    case "civil-minimalista":
      return <CivilMinimalistTemplate wedding={site} />;
    case "garden-classico":
      return <GardenClassicTemplate wedding={site} />;
    case "olive-burgundy":
      return <OliveBurgundyTemplate wedding={site} />;
    case "classico-romantico":
    default:
      return <ClassicRomanticTemplate wedding={site} />;
  }
}

export default async function PublicWeddingPage({ params }: PublicWeddingPageProps) {
  const { slug } = await params;
  const row = await getWeddingBySlug(slug);

  if (!row) {
    notFound();
  }

  return <WeddingTemplate site={rowToWeddingSite(row)} />;
}
