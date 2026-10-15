import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialLuxuryTemplate } from "@/components/templates/editorial-luxury/EditorialLuxuryTemplate";
import { demoWeddingFor } from "@/lib/demo-wedding";

type EditorialLuxuryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: EditorialLuxuryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = demoWeddingFor("editorial-luxury", slug);

  if (!wedding) {
    return { title: "Modelo não encontrado" };
  }

  return {
    title: `Modelo Editorial Luxury | ${wedding.coupleNames}`,
    description: `Demonstração do modelo Editorial Luxury para ${wedding.coupleNames}.`
  };
}

export function generateStaticParams() {
  return [{ slug: "helena-e-lucas" }];
}

export default async function EditorialLuxuryPage({ params }: EditorialLuxuryPageProps) {
  const { slug } = await params;
  const wedding = demoWeddingFor("editorial-luxury", slug);

  if (!wedding) {
    notFound();
  }

  return (
    <EditorialLuxuryTemplate
      wedding={{ ...wedding, templateName: "Editorial Luxury" }}
    />
  );
}
