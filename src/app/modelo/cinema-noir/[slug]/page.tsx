import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CinemaNoirTemplate } from "@/components/templates/cinema-noir/CinemaNoirTemplate";
import { getDemoWeddingBySlug } from "@/lib/demo-wedding";

type CinemaNoirPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CinemaNoirPageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    return { title: "Modelo não encontrado" };
  }

  return {
    title: `Modelo Cinema Noir | ${wedding.coupleNames}`,
    description: `Demonstração do modelo Cinema Noir para ${wedding.coupleNames}.`
  };
}

export function generateStaticParams() {
  return [{ slug: "helena-e-lucas" }];
}

export default async function CinemaNoirPage({ params }: CinemaNoirPageProps) {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    notFound();
  }

  return (
    <CinemaNoirTemplate
      wedding={{ ...wedding, templateId: "cinema-noir", templateName: "Cinema Noir" }}
    />
  );
}
