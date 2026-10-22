import type { Metadata } from "next";
import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { DraftPreviewBar } from "@/app/casamento/[slug]/DraftPreviewBar";
import { SiteNotPublished } from "@/app/casamento/[slug]/SiteNotPublished";
import { CardGiftProvider } from "@/components/gift/CardGiftContext";
import { DemoBar } from "@/components/templates/DemoBar";
import { DEMO_SLUGS, demoBySlug } from "@/lib/demo-wedding";
import { getCardGiftConfig } from "@/lib/mercadopago-server";
import { getTemplate, type TemplateId } from "@/lib/templates/catalog";
import { rowToWeddingSite } from "@/lib/wedding";
import { getWeddingBySlug, getWeddingStatusBySlug } from "@/lib/wedding-server";
import type { WeddingSite } from "@/types/wedding";

/**
 * Páginas do site público e da demo, compartilhadas por todos os modelos.
 *
 * O Next só põe no HTML o CSS dos Client Components importados ESTATICAMENTE pelo
 * segmento de rota; com import dinâmico o CSS do modelo chega depois (flash sem
 * estilo) e com todos importados em um só segmento cada site carregaria o CSS dos 38.
 * Por isso cada modelo tem um segmento interno próprio, gerado por
 * scripts/gen-template-routes.mjs:
 *   src/app/tpl/<id>/site/[slug]/page.tsx   <- /casamento/<slug>   (reescrito no middleware pelo modelo do casal)
 *   src/app/tpl/<id>/demo/[slug]/page.tsx   <- /modelo/<id>/<slug> (rewrite em next.config)
 * Cada arquivo só importa o componente do modelo e chama estas fábricas. As demos são
 * reescritas em next.config (rewrites) e o site do casal no middleware (modelo lido do
 * banco). Sem Supabase configurado não há site de casal para servir.
 */

type Template = ComponentType<{ wedding: WeddingSite }>;
type SlugParams = { params: Promise<{ slug: string }> };

export function makeSitePage(Template: Template) {
  async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
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
      alternates: { canonical: `/casamento/${slug}` },
      openGraph: {
        title: site.seo.title,
        description: site.seo.description,
        images: site.heroImage ? [site.heroImage] : []
      }
    };
  }

  async function Page({ params }: SlugParams) {
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
        <Template wedding={site} />
        {/* Rascunho só chega aqui para o dono/admin (RLS): barra de prévia com Publicar e Editar. */}
        {row.status === "draft" ? <DraftPreviewBar /> : null}
      </CardGiftProvider>
    );
  }

  return { generateMetadata, Page };
}

/**
 * Demo: barra fixa de demonstração + respiro no fim da página para ela não cobrir o
 * rodapé do modelo. O respiro é um pouco MENOR que a barra de propósito: ela sobrepõe
 * só o padding do rodapé e nunca sobra uma faixa sem o fundo do modelo.
 * --demo-bar-h: os heróis dos modelos descontam a barra para a data/local não ficarem por baixo dela.
 */
export function DemoFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-(--demo-bar-h) [--demo-bar-h:calc(6rem+env(safe-area-inset-bottom))] md:[--demo-bar-h:calc(3.75rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <DemoBar />
    </>
  );
}

export function makeDemoPage(templateId: TemplateId, Template: Template) {
  const name = getTemplate(templateId).name;

  function generateStaticParams() {
    return DEMO_SLUGS.map((slug) => ({ slug }));
  }

  async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
    const { slug } = await params;
    const wedding = demoBySlug(templateId, slug);
    if (!wedding) return { title: "Modelo não encontrado" };
    return {
      title: `Modelo ${name} | ${wedding.coupleNames}`,
      description: `Demonstração do modelo ${name} para ${wedding.coupleNames}.`,
      alternates: { canonical: `/modelo/${templateId}/${slug}` }
    };
  }

  async function Page({ params }: SlugParams) {
    const { slug } = await params;
    const wedding = demoBySlug(templateId, slug);
    if (!wedding) notFound();
    return (
      <DemoFrame>
        <Template wedding={wedding} />
      </DemoFrame>
    );
  }

  return { generateStaticParams, generateMetadata, Page };
}
