import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JardimRomanticoTemplate } from "@/components/templates/jardim-romantico/JardimRomanticoTemplate";
import { demoWeddingFor } from "@/lib/demo-wedding";

type JardimRomanticoPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: JardimRomanticoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = demoWeddingFor("jardim-romantico", slug);

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
  const wedding = demoWeddingFor("jardim-romantico", slug);

  if (!wedding) {
    notFound();
  }

  return (
    <JardimRomanticoTemplate
      wedding={{ ...wedding, templateName: "Jardim Romântico" }}
    />
  );
}
