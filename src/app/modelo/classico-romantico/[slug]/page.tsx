import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassicRomanticTemplate } from "@/components/templates/classico-romantico/ClassicRomanticTemplate";
import { getDemoWeddingBySlug } from "@/lib/demo-wedding";

type ClassicRomanticoPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ClassicRomanticoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    return { title: "Modelo não encontrado" };
  }

  return {
    title: `Modelo Clássico Romântico | ${wedding.coupleNames}`,
    description: `Demonstração do modelo Clássico Romântico para ${wedding.coupleNames}.`
  };
}

export function generateStaticParams() {
  return [{ slug: "helena-e-lucas" }];
}

export default async function ClassicRomanticoPage({ params }: ClassicRomanticoPageProps) {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    notFound();
  }

  return (
    <ClassicRomanticTemplate
      wedding={{ ...wedding, templateId: "classico-romantico", templateName: "Clássico Romântico" }}
    />
  );
}
