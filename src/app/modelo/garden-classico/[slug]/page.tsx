import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GardenClassicTemplate } from "@/components/templates/garden-classico/GardenClassicTemplate";
import { getDemoWeddingBySlug } from "@/lib/demo-wedding";

type GardenClassicPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: GardenClassicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    return {
      title: "Modelo não encontrado"
    };
  }

  return {
    title: `Modelo Jardim Clássico | ${wedding.coupleNames}`,
    description: `Demonstração do modelo Jardim Clássico para ${wedding.coupleNames}.`
  };
}

export function generateStaticParams() {
  return [{ slug: "pedro-e-rafaela" }];
}

export default async function GardenClassicPage({ params }: GardenClassicPageProps) {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    notFound();
  }

  return <GardenClassicTemplate wedding={{ ...wedding, templateId: "garden-classico", templateName: "Jardim Clássico" }} />;
}
