import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CivilMinimalistTemplate } from "@/components/templates/civil-minimalista/CivilMinimalistTemplate";
import { getDemoWeddingBySlug } from "@/lib/demo-wedding";

type CivilMinimalistPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: CivilMinimalistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    return {
      title: "Modelo não encontrado"
    };
  }

  return {
    title: `Modelo Civil Minimalista | ${wedding.coupleNames}`,
    description: `Demonstração do modelo Civil Minimalista para ${wedding.coupleNames}.`
  };
}

export function generateStaticParams() {
  return [{ slug: "helena-e-lucas" }];
}

export default async function CivilMinimalistPage({ params }: CivilMinimalistPageProps) {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    notFound();
  }

  return <CivilMinimalistTemplate wedding={{ ...wedding, templateId: "civil-minimalista", templateName: "Civil Minimalista" }} />;
}
