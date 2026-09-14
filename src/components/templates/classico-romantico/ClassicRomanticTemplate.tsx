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
import { GuestForms } from "@/components/templates/shared/GuestForms";
import styles from "./classic-romantic.module.css";

type ClassicRomanticTemplateProps = {
  wedding: WeddingSite;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

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
    const storySection = root.querySelector<HTMLElement>("[data-story-section]");
    const storyCards = Array.from(root.querySelectorAll<HTMLElement>("[data-ceremony-card]"));
    const ceremonyDots = Array.from(root.querySelectorAll<HTMLElement>("[data-ceremony-dot]"));

    let ticking = false;

    const updateNav = () => {
      if (!siteNav) return;
      siteNav.classList.toggle(styles["is-compact"], window.scrollY > window.innerHeight * 0.6);
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
        updateNav();
        updateStory();
        ticking = false;
      });
    };

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
            <a href="#presentes">Presentes</a>
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
            <a href="#presentes" onClick={() => setMenuOpen(false)}>
              Presentes
            </a>
            <a href="#story" onClick={() => setMenuOpen(false)}>
              História
            </a>
          </div>
        </div>
      </nav>

      <main>
        <HeroSection
          wedding={wedding}
          onOpenRsvp={wedding.rsvp.enabled ? () => setRsvpOpen(true) : undefined}
        />
        <StorySection wedding={wedding} />
        <GallerySection wedding={wedding} onSelectImage={setLightboxImage} />
        <DateCountdownSection wedding={wedding} />
        <DetailsSection wedding={wedding} onSelectDetail={setActiveDetail} />
        <CashGiftPixSection wedding={wedding} />
        <GuestForms wedding={wedding} variant="classico" mode="messages" sectionId="recados" />
        <FinalSection wedding={wedding} />
        <FooterSection wedding={wedding} />
      </main>

      <RSVPDialog config={wedding.rsvp} slug={wedding.slug} open={rsvpOpen} onClose={() => setRsvpOpen(false)} />
      <GiftDialog wedding={wedding} detail={activeDetail} onClose={() => setActiveDetail(null)} />
      <LightboxDialog image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
