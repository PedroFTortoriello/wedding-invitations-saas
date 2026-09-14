import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JardimRomanticoTemplate } from "@/components/templates/jardim-romantico/JardimRomanticoTemplate";
import { getDemoWeddingBySlug } from "@/lib/demo-wedding";

type JardimRomanticoPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: JardimRomanticoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    return { title: "Modelo não encontrado" };
  }

  return {
    title: `Modelo Jardim Romântico | ${wedding.coupleNames}`,
    description: `Demonstração do modelo Jardim Romântico para ${wedding.coupleNames}.`
  };
}

export function generateStaticParams() {
  return [{ slug: "helena-e-lucas" }];
}

export default async function JardimRomanticoPage({ params }: JardimRomanticoPageProps) {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    notFound();
  }

  return (
    <JardimRomanticoTemplate
      wedding={{ ...wedding, templateId: "jardim-romantico", templateName: "Jardim Romântico" }}
    />
  );
}
