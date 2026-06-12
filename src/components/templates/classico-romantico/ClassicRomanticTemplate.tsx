"use client";

import { useEffect, useRef, useState } from "react";
import type { WeddingDetailCard, WeddingGalleryImage, WeddingSite } from "@/types/wedding";
import { DateCountdownSection } from "./DateCountdownSection";
import { CashGiftPixSection } from "./CashGiftPixSection";
import { DetailsSection } from "./DetailsSection";
import { FinalSection } from "./FinalSection";
import { FooterSection } from "./FooterSection";
import { GallerySection } from "./GallerySection";
import { GiftDialog } from "./GiftDialog";
import { HeroSection } from "./HeroSection";
import { LightboxDialog } from "./LightboxDialog";
import { RSVPDialog } from "./RSVPDialog";
import { StorySection } from "./StorySection";
import styles from "./classic-romantic.module.css";

type ClassicRomanticTemplateProps = {
  wedding: WeddingSite;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

const floatMotion = [
  { x: -210, y: 112, scale: 0.9 },
  { x: -150, y: 92, scale: 0.92 },
  { x: 170, y: 86, scale: 0.91 },
  { x: 205, y: 160, scale: 0.93 }
];

export function ClassicRomanticTemplate({ wedding }: ClassicRomanticTemplateProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<WeddingDetailCard | null>(null);
  const [lightboxImage, setLightboxImage] = useState<WeddingGalleryImage | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const siteNav = root.querySelector<HTMLElement>("[data-site-nav]");
    const heroSection = root.querySelector<HTMLElement>("[data-hero-section]");
    const heroCard = root.querySelector<HTMLElement>("[data-hero-card]");
    const floatPhotos = Array.from(root.querySelectorAll<HTMLElement>("[data-float]"));
    const storySection = root.querySelector<HTMLElement>("[data-story-section]");
    const storyCards = Array.from(root.querySelectorAll<HTMLElement>("[data-ceremony-card]"));
    const ceremonyDots = Array.from(root.querySelectorAll<HTMLElement>("[data-ceremony-dot]"));

    let ticking = false;

    const updateHero = () => {
      if (!heroSection || !heroCard) return;
      const mobile = window.matchMedia("(max-width: 900px)").matches;

      if (mobile) {
        siteNav?.classList.add(styles["is-compact"]);
        [
          "--hero-w",
          "--hero-h",
          "--hero-top",
          "--hero-scale",
          "--hero-y",
          "--hero-img-scale",
          "--hero-title-opacity",
          "--hero-title-y",
          "--hero-line-opacity",
          "--hero-line-y",
          "--hero-shadow"
        ].forEach((property) => heroCard.style.removeProperty(property));
        floatPhotos.forEach((photo) => {
          photo.style.opacity = "0";
          photo.style.transform = "";
        });
        return;
      }

      const total = Math.max(1, heroSection.offsetHeight - window.innerHeight);
      const progress = clamp(-heroSection.getBoundingClientRect().top / total);
      const shrink = easeInOut(smoothstep(0.04, 0.92, progress));
      const reveal = easeInOut(smoothstep(0.16, 0.78, progress));
      const titleFade = 1 - smoothstep(0.08, 0.52, progress);
      const lineFade = 1 - smoothstep(0.02, 0.3, progress);

      const startW = window.innerWidth - 40;
      const startH = window.innerHeight - 40;
      const targetW = clamp(window.innerWidth * 0.258, 330, 495);
      const targetH = clamp(window.innerHeight * 0.68, 520, 735);
      const targetTop = Math.max(118, (window.innerHeight - targetH) / 2 + 20);

      heroCard.style.setProperty("--hero-w", `${lerp(startW, targetW, shrink).toFixed(1)}px`);
      heroCard.style.setProperty("--hero-h", `${lerp(startH, targetH, shrink).toFixed(1)}px`);
      heroCard.style.setProperty("--hero-top", `${lerp(20, targetTop, shrink).toFixed(1)}px`);
      heroCard.style.setProperty("--hero-scale", "1");
      heroCard.style.setProperty("--hero-y", "0px");
      heroCard.style.setProperty("--hero-img-scale", lerp(1, 1.02, shrink).toFixed(4));
      heroCard.style.setProperty("--hero-title-opacity", titleFade.toFixed(3));
      heroCard.style.setProperty("--hero-title-y", `${lerp(0, 18, 1 - titleFade).toFixed(1)}px`);
      heroCard.style.setProperty("--hero-line-opacity", lineFade.toFixed(3));
      heroCard.style.setProperty("--hero-line-y", `${lerp(0, 18, 1 - lineFade).toFixed(1)}px`);
      heroCard.style.setProperty("--hero-shadow", shrink > 0.05 ? "0 24px 62px rgba(0,0,0,0.12)" : "none");
      siteNav?.classList.toggle(styles["is-compact"], progress > 0.16);

      floatPhotos.forEach((photo, index) => {
        const motion = floatMotion[index] ?? floatMotion[0];
        const staggered = easeInOut(clamp((reveal - index * 0.045) / 0.82));
        const x = lerp(motion.x, 0, staggered);
        const y = lerp(motion.y, 0, staggered);
        const scale = lerp(motion.scale, 1, staggered);
        photo.style.opacity = String(clamp(staggered * 1.1));
        photo.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      });
    };

    const updateStory = () => {
      if (!storySection || !storyCards.length) return;
      const desktop = window.matchMedia("(min-width: 901px)").matches;
      const total = Math.max(1, storySection.offsetHeight - window.innerHeight);
      const progress = clamp(-storySection.getBoundingClientRect().top / total);
      const cardProgress = progress * (storyCards.length - 1);

      storyCards.forEach((card, index) => {
        const offset = index - cardProgress;
        const abs = Math.abs(offset);
        const y = offset * (desktop ? 82 : 56);
        const scale = clamp(1 - abs * (desktop ? 0.055 : 0.07), desktop ? 0.9 : 0.86, 1);
        const opacity = clamp(1.12 - abs * (desktop ? 0.58 : 0.68));
        card.style.zIndex = String(100 - Math.round(abs * 10) - index);
        card.style.opacity = opacity.toFixed(3);
        card.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        card.style.pointerEvents = abs < 0.62 ? "auto" : "none";
        card.classList.toggle(styles.active, abs < 0.52);
      });

      const activeIndex = Math.round(cardProgress);
      ceremonyDots.forEach((dot, index) => {
        dot.classList.toggle(styles.active, index === activeIndex);
      });
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateHero();
        updateStory();
        ticking = false;
      });
    };

    const invitationWords = Array.from(root.querySelectorAll<HTMLElement>("[data-invitation-word]"));
    const invitation = root.querySelector<HTMLElement>("[data-invitation]");
    const invitationObserver =
      invitation && invitationWords.length
        ? new IntersectionObserver(
            ([entry]) => {
              if (!entry.isIntersecting) return;
              invitationWords.forEach((word, index) => {
                window.setTimeout(() => word.classList.add(styles.active), index * 92);
              });
              invitationObserver?.disconnect();
            },
            { threshold: 0.42 }
          )
        : null;

    if (invitation && invitationObserver) {
      invitationObserver.observe(invitation);
    }

    const detailObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(styles.revealed);
          detailObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16 }
    );

    root.querySelectorAll<HTMLElement>("[data-detail-card]").forEach((card, index) => {
      card.style.transitionDelay = `${index * 70}ms`;
      detailObserver.observe(card);
    });

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    requestUpdate();

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      invitationObserver?.disconnect();
      detailObserver.disconnect();
    };
  }, [wedding.slug]);

  return (
    <div
      ref={rootRef}
      className={styles.template}
      style={
        {
          "--bg": wedding.theme.background,
          "--surface": wedding.theme.surface,
          "--text": wedding.theme.text,
          "--muted": wedding.theme.muted,
          "--olive": wedding.theme.primary,
          "--olive-dark": wedding.theme.primaryDark,
          "--olive-soft": wedding.theme.primarySoft
        } as React.CSSProperties
      }
    >
      <nav className={styles["site-nav"]} aria-label="Navegação principal" data-site-nav>
        <div className={styles["nav-shell"]}>
          <a className={styles.monogram} href="#hero" aria-label="Início do casamento">
            {wedding.monogram}
          </a>
          <div className={styles["nav-links"]} aria-label="Seções do casamento">
            <a href="#details">Local</a>
            <a href="#details">Presentes</a>
            <a href="#story">História</a>
          </div>
          <div className={styles["nav-actions"]}>
            {wedding.rsvp.enabled ? (
              <button className={styles["rsvp-link"]} type="button" onClick={() => setRsvpOpen(true)}>
                Confirmar presença
              </button>
            ) : null}
            <button
              className={styles["menu-button"]}
              type="button"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              aria-controls="primary-menu"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span />
              <span />
            </button>
          </div>
          <div className={`${styles["nav-menu"]} ${menuOpen ? styles.open : ""}`} id="primary-menu">
            <a href="#details" onClick={() => setMenuOpen(false)}>
              Local
            </a>
            <a href="#details" onClick={() => setMenuOpen(false)}>
              Presentes
            </a>
            <a href="#story" onClick={() => setMenuOpen(false)}>
              História
            </a>
          </div>
        </div>
      </nav>

      <main>
        <HeroSection wedding={wedding} />
        {/* <InvitationSection wedding={wedding} /> */}
        <StorySection wedding={wedding} />
        <GallerySection wedding={wedding} onSelectImage={setLightboxImage} />
        <DateCountdownSection wedding={wedding} />
        <DetailsSection wedding={wedding} onSelectDetail={setActiveDetail} />
        <CashGiftPixSection wedding={wedding} />
        <FinalSection wedding={wedding} />
        <FooterSection wedding={wedding} />
      </main>

      <RSVPDialog config={wedding.rsvp} open={rsvpOpen} onClose={() => setRsvpOpen(false)} />
      <GiftDialog wedding={wedding} detail={activeDetail} onClose={() => setActiveDetail(null)} />
      <LightboxDialog image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
