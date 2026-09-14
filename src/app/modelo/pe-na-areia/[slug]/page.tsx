import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PeNaAreiaTemplate } from "@/components/templates/pe-na-areia/PeNaAreiaTemplate";
import { getDemoWeddingBySlug } from "@/lib/demo-wedding";

type PeNaAreiaPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PeNaAreiaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    return { title: "Modelo não encontrado" };
  }

  return {
    title: `Modelo Pé na Areia | ${wedding.coupleNames}`,
    description: `Demonstração do modelo Pé na Areia para ${wedding.coupleNames}.`
  };
}

export function generateStaticParams() {
  return [{ slug: "helena-e-lucas" }];
}

export default async function PeNaAreiaPage({ params }: PeNaAreiaPageProps) {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    notFound();
  }

  return (
    <PeNaAreiaTemplate
      wedding={{ ...wedding, templateId: "pe-na-areia", templateName: "Pé na Areia" }}
    />
  );
}
