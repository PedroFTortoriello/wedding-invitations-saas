import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { SocialProof } from "@/components/landing/SocialProof";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="overflow-hidden bg-bg text-ink">
      <LandingNav />
      <Hero />
      <Features />
      <SocialProof />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  );
}
