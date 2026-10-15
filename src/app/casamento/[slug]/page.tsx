import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassicRomanticTemplate } from "@/components/templates/classico-romantico/ClassicRomanticTemplate";
import { CivilMinimalistTemplate } from "@/components/templates/civil-minimalista/CivilMinimalistTemplate";
import { GardenClassicTemplate } from "@/components/templates/garden-classico/GardenClassicTemplate";
import { OliveBurgundyTemplate } from "@/components/templates/olive-burgundy/OliveBurgundyTemplate";
import { EditorialLuxuryTemplate } from "@/components/templates/editorial-luxury/EditorialLuxuryTemplate";
import { JardimRomanticoTemplate } from "@/components/templates/jardim-romantico/JardimRomanticoTemplate";
import { PeNaAreiaTemplate } from "@/components/templates/pe-na-areia/PeNaAreiaTemplate";
import { CinemaNoirTemplate } from "@/components/templates/cinema-noir/CinemaNoirTemplate";
import { CardGiftProvider } from "@/components/gift/CardGiftContext";
import { getCardGiftConfig } from "@/lib/mercadopago-server";
import { rowToWeddingSite } from "@/lib/wedding";
import { getWeddingBySlug, getWeddingStatusBySlug } from "@/lib/wedding-server";
import type { WeddingSite } from "@/types/wedding";
import { DraftPreviewBar } from "./DraftPreviewBar";
import { SiteNotPublished } from "./SiteNotPublished";

export const dynamic = "force-dynamic";

type PublicWeddingPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PublicWeddingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const row = await getWeddingBySlug(slug);

  if (!row) {
    const info = await getWeddingStatusBySlug(slug).catch(() => null);
    if (info && info.status !== "published") {
      return { title: "Site em breve", robots: { index: false, follow: false } };
    }
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
    case "editorial-luxury":
      return <EditorialLuxuryTemplate wedding={site} />;
    case "jardim-romantico":
      return <JardimRomanticoTemplate wedding={site} />;
    case "pe-na-areia":
      return <PeNaAreiaTemplate wedding={site} />;
    case "cinema-noir":
      return <CinemaNoirTemplate wedding={site} />;
    case "classico-romantico":
    default:
      return <ClassicRomanticTemplate wedding={site} />;
  }
}

export default async function PublicWeddingPage({ params }: PublicWeddingPageProps) {
  const { slug } = await params;
  const row = await getWeddingBySlug(slug);

  if (!row) {
    // RLS esconde rascunhos do visitante: distingue "não publicado" de inexistente.
    const info = await getWeddingStatusBySlug(slug).catch(() => null);
    if (info && info.status !== "published") {
      return <SiteNotPublished coupleNames={info.coupleNames} />;
    }
    notFound();
  }

  const site = rowToWeddingSite(row);
  // Cartão só no site publicado, com cota ativa e com a conta do casal conectada.
  const hasGifts = site.gifts.some((gift) => gift.active);
  const cardConfig = row.status === "published" && hasGifts ? await getCardGiftConfig(row.id) : null;

  return (
    <CardGiftProvider value={cardConfig}>
      <WeddingTemplate site={site} />
      {/* Rascunho só chega aqui para o dono/admin (RLS): barra de prévia com Publicar e Editar. */}
      {row.status === "draft" ? <DraftPreviewBar /> : null}
    </CardGiftProvider>
  );
}
