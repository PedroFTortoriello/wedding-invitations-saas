import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassicRomanticTemplate } from "@/components/templates/classico-romantico/ClassicRomanticTemplate";
import { getDemoWeddingBySlug } from "@/lib/demo-wedding";

type PublicWeddingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PublicWeddingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    return {
      title: "Casamento não encontrado"
    };
  }

  return {
    title: wedding.seo.title,
    description: wedding.seo.description,
    openGraph: {
      title: wedding.seo.title,
      description: wedding.seo.description,
      images: [wedding.heroImage]
    }
  };
}

export function generateStaticParams() {
  return [{ slug: "pedro-e-rafaela" }];
}

export default async function PublicWeddingPage({ params }: PublicWeddingPageProps) {
  const { slug } = await params;
  const wedding = getDemoWeddingBySlug(slug);

  if (!wedding) {
    notFound();
  }

  return <ClassicRomanticTemplate wedding={wedding} />;
}
