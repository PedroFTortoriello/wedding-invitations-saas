import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { Passos } from "@/components/landing/Passos";
import { Modelos } from "@/components/landing/Modelos";
import { Presentes } from "@/components/landing/Presentes";
import { SiteIa } from "@/components/landing/SiteIa";
import { Convidados } from "@/components/landing/Convidados";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { Fechamento, Footer } from "@/components/landing/Footer";
import { StickyCta } from "@/components/landing/StickyCta";
import { LandingBehavior } from "@/components/landing/LandingBehavior";
import { LANDING_FONTS } from "@/components/landing/showcase";
import { PUBLISH_FEE_LABEL } from "@/lib/platform-data";

export const metadata: Metadata = {
  title: { absolute: "Site de casamento com confirmação de presença e presentes via Pix | Noivar" },
  description: `Montem o site de casamento de graça e paguem ${PUBLISH_FEE_LABEL} uma vez para publicar. Confirmação pela lista de convidados, recados e presentes via Pix sem taxa.`,
  alternates: { canonical: "/" }
};

export default function LandingPage() {
  return (
    <>
      {LANDING_FONTS.map((href) => (
        <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="" />
      ))}
      <a
        href="#conteudo"
        className="btn btn-sm btn-primary fixed left-3 top-3 z-50 -translate-y-24 focus-visible:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      <LandingNav />
      {/* overflow-x-clip (não hidden): hidden quebraria position: sticky dos painéis. */}
      <main id="conteudo" className="overflow-x-clip bg-bg text-ink">
        <Hero />
        <Passos />
        <Modelos />
        <SiteIa />
        <Presentes />
        <Convidados />
        <Pricing />
        <Faq />
        <Fechamento />
      </main>
      <Footer />
      <StickyCta />
      <LandingBehavior />
    </>
  );
}
