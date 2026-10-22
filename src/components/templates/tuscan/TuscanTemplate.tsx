"use client";

import { useRef } from "react";
import Image from "next/image";
import { Marcellus, Source_Sans_3 } from "next/font/google";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { useMenu, useScrolled } from "@/components/templates/kit/hooks";
import { Cypress, RollingHills, SunRays, VineTendril, WheatStalk } from "@/components/templates/kit/ornaments";
import {
  activeCards,
  activeGifts,
  headlineLines,
  mainLocation,
  mapEmbedUrl,
  mapLink,
  nameScale,
  placeLine,
  program,
  splitCouple,
  storyMoments
} from "@/components/templates/kit/utils";
import styles from "./tuscan.module.css";

const display = Marcellus({ subsets: ["latin"], weight: "400", variable: "--tu-display", display: "swap" });
const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--tu-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

export function TuscanTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gifts = activeGifts(wedding);
  const moments = storyMoments(wedding);
  const photos = galleryRest(wedding);
  const hasPhoto = Boolean(wedding.heroImage);

  const nav = [
    ["#convite", "Convite"],
    moments.length ? ["#historia", "História"] : null,
    schedule.length ? ["#programacao", "Programação"] : null,
    location ? ["#local", "Local"] : null,
    gifts.length ? ["#presentes", "Presentes"] : null,
    photos.length ? ["#galeria", "Galeria"] : null,
    wedding.rsvp.enabled ? ["#confirmar", "Confirmar"] : null
  ].filter((item): item is [string, string] => item !== null);

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template} ${hasPhoto ? "" : styles.noPhoto}`}>
      <Nav monogram={wedding.monogram} items={nav} light={hasPhoto} />
      <Hero wedding={wedding} location={location} />

      {/* Convite: coluna estreita, palavras em frase corrida, gavinha como separador */}
      <section id="convite" className={styles.invite} aria-labelledby="tu-invite">
        <Reveal className={styles.inviteInner}>
          <p className={styles.eyebrow}>O convite</p>
          <h2 id="tu-invite" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <VineTendril className={styles.inviteVine} />
          {wedding.welcomeText ? <p className={styles.inviteText}>{wedding.welcomeText}</p> : null}
        </Reveal>
      </section>

      {moments.length ? <Story wedding={wedding} /> : null}

      <Countdown wedding={wedding} />

      {schedule.length ? (
        <section id="programacao" className={styles.menuSection} aria-labelledby="tu-menu">
          <Reveal className={styles.menuHead}>
            <p className={styles.eyebrow}>Programação</p>
            <h2 id="tu-menu" className={styles.h2}>
              {wedding.detailsTitle}
            </h2>
            {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
          </Reveal>
          <Reveal as="ol" className={styles.menu} delay={0.08}>
            {schedule.map((item) => (
              <li key={item.id} className={styles.menuRow}>
                <div className={styles.menuLine}>
                  <span className={styles.menuTitle}>{item.title}</span>
                  <span className={styles.menuDots} aria-hidden />
                  <span className={styles.menuTime}>{item.time}</span>
                </div>
                {item.note ? <p className={styles.menuNote}>{item.note}</p> : null}
              </li>
            ))}
          </Reveal>
        </section>
      ) : null}

      {location ? (
        <section id="local" className={styles.place} aria-labelledby="tu-place">
          <Reveal className={styles.placeMap} y={24}>
            <iframe
              className={styles.mapFrame}
              src={mapEmbedUrl(location)}
              title={`Mapa: ${location.venue || location.city}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>
          <Reveal className={styles.placeInfo} delay={0.08}>
            <p className={styles.eyebrow}>O local</p>
            <h2 id="tu-place" className={styles.h2}>
              {location.venue || location.city}
            </h2>
            {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
            <div className={styles.placeAddress}>
              <Cypress className={styles.placeCypress} />
              <div>
                {location.address ? <p className={styles.body}>{location.address}</p> : null}
                {location.note ? <p className={styles.body}>{location.note}</p> : null}
              </div>
            </div>
            <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
              Abrir no mapa
            </a>
          </Reveal>
        </section>
      ) : null}

      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={styles.cardsGrid}>
            {cards.map((card, i) => (
              <Reveal as="article" key={card.id} className={styles.card} delay={(i % 3) * 0.07}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                {card.subtitle ? <p className={styles.cardSub}>{card.subtitle}</p> : null}
                <span className={styles.cardRule} aria-hidden />
                {card.body ? <p className={styles.cardBody}>{card.body}</p> : null}
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="tu-gifts">
          <Reveal className={styles.sectionHead}>
            <p className={styles.eyebrow}>Presentes</p>
            <h2 id="tu-gifts" className={styles.h2}>
              Um brinde à casa nova
            </h2>
            <p className={styles.lead}>Cada cota vai direto para o casal, por Pix, sem taxas nem intermediários.</p>
          </Reveal>
          <GiftRegistry wedding={wedding} variant="inherit" />
        </section>
      ) : null}

      {photos.length ? <Gallery images={photos} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      <Closing wedding={wedding} />
      <Footer wedding={wedding} location={location} />
    </main>
  );
}

/* ------------------------------------------------------------------ nav */

function Nav({ monogram, items, light }: { monogram: string; items: [string, string][]; light: boolean }) {
  const scrolled = useScrolled(60);
  const [open, toggle, close] = useMenu();
  return (
    <header className={`${styles.nav} ${scrolled || open ? styles.navSolid : ""} ${light ? styles.navLight : ""}`}>
      <div className={styles.navInner}>
        <a href="#top" className={styles.navMono}>
          {monogram}
        </a>
        <nav className={styles.navLinks} aria-label="Seções">
          {items.map(([href, label]) => (
            <a key={href} href={href} className={styles.navLink}>
              {label}
            </a>
          ))}
        </nav>
        <button type="button" className={styles.navToggle} aria-expanded={open} onClick={toggle}>
          {open ? "Fechar" : "Menu"}
        </button>
      </div>
      {open ? (
        <nav className={styles.navMobile} aria-label="Seções">
          {items.map(([href, label]) => (
            <a key={href} href={href} className={styles.navMobileLink} onClick={close}>
              {label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

/* ----------------------------------------------------------------- hero */

function Hero({ wedding, location }: Props & { location: ReturnType<typeof mainLocation> }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const sunY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const hillsY = useTransform(scrollYProgress, [0, 1], [0, 36]);
  const [first, second] = splitCouple(wedding.coupleNames);
  const when = [wedding.weddingDateLabel, wedding.weddingTime].filter(Boolean).join(" · ");
  const where = location ? placeLine(wedding) : "";

  return (
    <section id="top" ref={ref} className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      {wedding.heroImage ? (
        <motion.div className={styles.heroMedia} style={reduce ? undefined : { y: photoY }}>
          <Image src={wedding.heroImage} alt="" fill priority sizes="100vw" className={styles.heroImg} />
          <div className={styles.heroScrim} />
        </motion.div>
      ) : null}

      <div className={styles.heroContent} data-scale={nameScale(wedding.coupleNames)}>
        {!wedding.heroImage ? (
          <motion.div className={styles.heroSun} style={reduce ? undefined : { y: sunY }} aria-hidden>
            <SunRays className={styles.heroSunSvg} />
          </motion.div>
        ) : null}
        <p className={`${styles.heroKicker} hero-rise`}>Vamos nos casar</p>
        <h1 className={`${styles.heroNames} hero-rise`} style={{ animationDelay: "120ms" }}>
          <span className={styles.heroName}>{first}</span>
          {second ? (
            <>
              <span className={styles.heroAnd}>e</span>
              <span className={styles.heroName}>{second}</span>
            </>
          ) : null}
        </h1>
        <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "240ms" }}>
          {when ? <span>{when}</span> : null}
          {where ? <span>{where}</span> : null}
        </p>
      </div>

      <motion.div className={styles.heroHills} style={reduce ? undefined : { y: hillsY }} aria-hidden>
        <RollingHills className={styles.heroHillsSvg} />
        <Cypress className={styles.heroCypress} />
      </motion.div>
    </section>
  );
}

/* ---------------------------------------------------------------- story */

function Story({ wedding }: Props) {
  const moments = storyMoments(wedding);
  const n = moments.length;
  // Estrada: uma curva por capítulo, alternando entre 30% e 70% da largura (viewBox 100 x 100n).
  const x = (i: number) => (i % 2 === 0 ? 30 : 70);
  const y = (i: number) => 100 * i + 50;
  const road =
    `M ${x(0)} -5 L ${x(0)} ${y(0)} ` +
    moments
      .slice(1)
      .map((_, k) => `C ${x(k)} ${y(k) + 55}, ${x(k + 1)} ${y(k + 1) - 55}, ${x(k + 1)} ${y(k + 1)}`)
      .join(" ") +
    ` L ${x(n - 1)} ${100 * n + 5}`;

  return (
    <section id="historia" className={styles.story} aria-labelledby="tu-story">
      <Reveal className={styles.storyHead}>
        <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
        <h2 id="tu-story" className={styles.h2}>
          {wedding.storyTitle}
        </h2>
      </Reveal>

      <div className={styles.road}>
        <svg className={styles.roadSvg} viewBox={`0 0 100 ${100 * n}`} preserveAspectRatio="none" aria-hidden focusable="false">
          <path d={road} vectorEffect="non-scaling-stroke" />
        </svg>
        {moments.map((moment, i) => {
          const img = storyImage(wedding.gallery, i);
          const lines = headlineLines(moment.headline);
          return (
            <article key={moment.id} className={`${styles.chapter} ${i % 2 ? styles.chapterAlt : ""} ${img ? "" : styles.chapterText}`}>
              {img ? (
                <Reveal as="figure" className={styles.chapterFig} y={24}>
                  <Image src={img.src} alt={img.alt} width={900} height={1125} loading="lazy" sizes="(min-width: 900px) 40vw, 100vw" className={styles.chapterImg} />
                  <span className={styles.chapterNum} aria-hidden>
                    {moment.number}
                  </span>
                </Reveal>
              ) : null}
              <Reveal className={styles.chapterBody} delay={0.08}>
                {!img ? <span className={styles.chapterNumInline}>{moment.number}</span> : null}
                <p className={styles.chapterTitle}>{moment.title}</p>
                {lines.length ? (
                  <h3 className={styles.chapterHeadline}>
                    {lines.map((line, k) => (
                      <span key={k}>{line}</span>
                    ))}
                  </h3>
                ) : null}
                {moment.description ? <p className={styles.body}>{moment.description}</p> : null}
              </Reveal>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ countdown */

function Countdown({ wedding }: Props) {
  const c = useCountdown(wedding.weddingDate);
  const valid = Number.isFinite(new Date(wedding.weddingDate).getTime());
  const units: [number, string][] = [
    [c.days, "dias"],
    [c.hours, "horas"],
    [c.minutes, "minutos"],
    [c.seconds, "segundos"]
  ];
  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <WheatStalk className={`${styles.wheat} ${styles.wheatLeft}`} />
      <WheatStalk className={`${styles.wheat} ${styles.wheatRight}`} />
      <Reveal className={styles.countInner}>
        <p className={styles.countKicker}>{valid && c.isPast ? "Hoje é o grande dia" : "Faltam"}</p>
        {valid && !c.isPast ? (
          <div className={styles.countGrid}>
            {units.map(([value, label]) => (
              <div key={label} className={styles.countCell}>
                <span className={styles.countNum}>{c.ready ? pad(value) : "—"}</span>
                <span className={styles.countLabel}>{label}</span>
              </div>
            ))}
          </div>
        ) : null}
        <p className={styles.countDate}>{[wedding.weddingDateLabel, wedding.weddingTime].filter(Boolean).join(" · ")}</p>
      </Reveal>
    </section>
  );
}

/* -------------------------------------------------------------- gallery */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="tu-gallery">
      <Reveal className={styles.sectionHead}>
        <p className={styles.eyebrow}>Galeria</p>
        <h2 id="tu-gallery" className={styles.h2}>
          Luz de fim de tarde
        </h2>
      </Reveal>
      <div className={styles.galleryGrid}>
        {images.map((image, i) => (
          <Reveal key={image.id} delay={(i % 4) * 0.05}>
            <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${image.alt}`}>
              <Image src={image.src} alt={image.alt} fill loading="lazy" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className={styles.galleryImg} />
            </button>
          </Reveal>
        ))}
      </div>
      <Lightbox
        images={images}
        active={lb.active}
        onClose={lb.close}
        classNames={{ dialog: styles.lightbox, close: styles.lightboxClose, nav: styles.lightboxNav, figure: styles.lightboxFig, img: styles.lightboxImg, caption: styles.lightboxCaption }}
      />
    </section>
  );
}

/* -------------------------------------------------------------- closing */

function Closing({ wedding }: Props) {
  if (!wedding.finalText && !wedding.footerImage) return null;
  return (
    <section className={styles.closing} aria-label="Encerramento">
      {wedding.footerImage ? (
        <div className={styles.closingMedia}>
          <Image src={wedding.footerImage} alt="" fill loading="lazy" sizes="100vw" className={styles.closingImg} />
          <RollingHills className={styles.closingHills} />
        </div>
      ) : null}
      {wedding.finalText ? (
        <Reveal className={styles.closingText}>
          {!wedding.footerImage ? <VineTendril className={styles.closingVine} /> : null}
          <p className={styles.closingQuote}>{wedding.finalText}</p>
        </Reveal>
      ) : null}
    </section>
  );
}

function Footer({ wedding, location }: Props & { location: ReturnType<typeof mainLocation> }) {
  return (
    <footer className={styles.footer}>
      <p className={styles.footerMono}>{wedding.monogram}</p>
      <p className={styles.footerNames}>{wedding.coupleNames}</p>
      {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
      <p className={styles.footerMeta}>{[wedding.weddingDateLabel, location?.city].filter(Boolean).join(" · ")}</p>
      <p className={styles.footerCredit}>Feito com Noivar</p>
    </footer>
  );
}
