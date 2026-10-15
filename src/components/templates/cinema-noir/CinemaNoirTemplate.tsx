"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import localFont from "next/font/local";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { WeddingGalleryImage, WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import styles from "./cinema-noir.module.css";

/** Gold-dust canvas loads after paint (never blocks the LCP hero). */
const GoldDust = dynamic(() => import("./GoldDust").then((m) => m.GoldDust), { ssr: false });

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--cn-display",
  display: "swap"
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--cn-body-font",
  display: "swap"
});

/**
 * A Cormorant v4 do Google desenha o circunflexo minúsculo (â ê î ô û) como um "Λ"
 * alto e fino que parece solto/duplicado em pt-BR. Estes woff2 trazem só esses
 * glifos, com o acento do Ê da própria fonte no lugar (fonts/patch-circumflex.py);
 * o unicode-range faz só eles virem daqui, o resto continua na Cormorant.
 */
const circumflex = localFont({
  src: [
    { path: "./fonts/cn-circumflex.woff2", weight: "400", style: "normal" },
    { path: "./fonts/cn-circumflex-italic.woff2", weight: "400", style: "italic" }
  ],
  variable: "--cn-circ",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+E2, U+EA, U+EE, U+F4, U+FB" }]
});

type Props = { wedding: WeddingSite };

const NAV = [
  ["#convite", "Convite"],
  ["#historia", "História"],
  ["#programa", "Programa"],
  ["#presentes", "Presentes"],
  ["#galeria", "Galeria"]
] as const;

export function CinemaNoirTemplate({ wedding }: Props) {
  const location = wedding.locations[0];
  const details = wedding.detailCards.filter((card) => card.active);

  return (
    <main className={`${display.variable} ${sans.variable} ${circumflex.variable} ${styles.template}`}>
      <Nav wedding={wedding} />
      <Hero wedding={wedding} />
      <Invite wedding={wedding} />
      <Countdown wedding={wedding} />
      <Story wedding={wedding} />
      <Program wedding={wedding} />
      {location ? <Location wedding={wedding} /> : null}
      {details.length ? <Info details={details} /> : null}

      <section id="presentes" className={`${styles.gifts} ${styles.section}`} aria-labelledby="gifts-title">
        <div className={styles.wrap}>
          <Reveal className={`${styles.sectionHead} ${styles.head}`}>
            <p className={styles.eyebrow}>Lista de presentes</p>
            <h2 id="gifts-title" className={styles.h1}>
              Um gesto para a vida a dois
            </h2>
            <p className={styles.lead}>
              Cada presente é um Pix direto na chave do casal — 100% para eles, sem taxas
              e sem intermediários.
            </p>
          </Reveal>
          <GiftRegistry wedding={wedding} variant="cinema" />
        </div>
      </section>

      <Gallery images={galleryRest(wedding)} />

      <GuestForms wedding={wedding} variant="cinema" mode="both" sectionId="confirmar" />

      <Final wedding={wedding} />
      <Footer wedding={wedding} />
    </main>
  );
}

/* ------------------------------------------------------------------ Nav */

function Nav({ wedding }: Props) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.nav} ${solid ? styles.navSolid : ""}`}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <a href="#top" className={styles.navMono} aria-label={wedding.coupleNames}>
          {wedding.monogram}
        </a>
        <nav className={styles.navLinks} aria-label="Seções">
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className={styles.navLink}>
              {label}
            </a>
          ))}
        </nav>
        <a href="#confirmar" className={styles.navCta}>
          Confirmar
        </a>
        <button
          type="button"
          className={styles.navToggle}
          aria-expanded={open}
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Fechar" : "Menu"}
        </button>
      </div>
      {open ? (
        <nav className={styles.navMobile} aria-label="Seções">
          {[...NAV, ["#confirmar", "Confirmar presença"] as const].map(([href, label]) => (
            <a key={href} href={href} className={styles.navMobileLink} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

/* ----------------------------------------------------------------- Hero */

function Hero({ wedding }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const mediaY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const [first, second] = splitCouple(wedding.coupleNames);
  const location = wedding.locations[0];

  return (
    <section id="top" ref={ref} className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      {/* y: 0 (e não style undefined) sob reduced-motion: o SSR não sabe a
          preferência e renderiza transform:none; assim a hidratação bate. */}
      <motion.div className={styles.heroMedia} style={{ y: reduce ? 0 : mediaY }}>
        <Image src={wedding.heroImage} alt="" fill priority sizes="100vw" className={styles.heroImg} />
      </motion.div>
      <div className={styles.heroScrim} />
      <div className={styles.heroBar + " " + styles.heroBarTop} aria-hidden />
      <div className={styles.heroBar + " " + styles.heroBarBottom} aria-hidden />

      <GoldDust className={styles.dust} />

      <div className={styles.heroFrame} aria-hidden>
        {/* Sem viewBox: 1 unidade = 1px, então nada estica e o pathLength=1 vale de
            verdade (com non-scaling-stroke o Chrome media o dash em px e a moldura
            saía em pedaços). Traço de 2px recortado pela borda do svg = linha de 1px. */}
        <svg className={styles.heroFrameSvg}>
          <rect className={styles.heroFrameRect} width="100%" height="100%" pathLength={1} />
        </svg>
      </div>

      <div className={`${styles.wrap} ${styles.heroContent}`}>
        <p className={styles.heroEyebrow}>
          <span>{wedding.weddingDateLabel}</span>
          <span className={styles.heroEyebrowDot} aria-hidden />
          <span>{location?.city ?? "Celebração"}</span>
        </p>
        <h1 className={styles.heroNames}>
          <span className={styles.heroNameLine}>{first}</span>
          {second ? (
            <span className={styles.heroNameLine}>
              <span className={styles.heroAmp}>&amp;</span>
              {second}
            </span>
          ) : null}
        </h1>
        <div className={styles.heroPlate}>
          <span className={styles.heroPlateItem}>
            <span className={styles.heroPlateK}>Data</span>
            {wedding.weddingDateLabel}
          </span>
          <span className={styles.heroPlateDivider} aria-hidden />
          <span className={styles.heroPlateItem}>
            <span className={styles.heroPlateK}>Local</span>
            {location?.venue ?? location?.city ?? "Em breve"}
          </span>
          {wedding.weddingTime ? (
            <>
              <span className={styles.heroPlateDivider} aria-hidden />
              <span className={styles.heroPlateItem}>
                <span className={styles.heroPlateK}>Horário</span>
                {wedding.weddingTime}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <a href="#convite" className={styles.heroScroll} aria-label="Rolar para o convite">
        <span>Role para explorar</span>
        <span className={styles.heroScrollLine} aria-hidden />
      </a>
    </section>
  );
}

/* --------------------------------------------------------------- Convite */

function Invite({ wedding }: Props) {
  return (
    <section id="convite" className={`${styles.invite} ${styles.section}`} aria-labelledby="invite-title">
      <div className={styles.wrap}>
        <div className={styles.inviteInner}>
          <Reveal>
            <p className={styles.eyebrow}>O convite</p>
          </Reveal>
          {/* Palavra a palavra pelo scroll-reveal global: o SSR já sai legível. */}
          <h2 id="invite-title" className={styles.inviteWords}>
            {wedding.invitationWords.map((word, i) => (
              <Reveal as="span" key={`${word}-${i}`} className={styles.inviteWord} y={14} delay={i * 0.08}>
                {word}
              </Reveal>
            ))}
          </h2>
          <Reveal delay={0.1}>
            <p className={styles.inviteLead}>{wedding.welcomeText}</p>
            <span className={styles.ruleGold} aria-hidden />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Countdown */

function Countdown({ wedding }: Props) {
  const c = useCountdown(wedding.weddingDate);
  const units: Array<[number, string]> = [
    [c.days, "Dias"],
    [c.hours, "Horas"],
    [c.minutes, "Min"],
    [c.seconds, "Seg"]
  ];

  return (
    <section className={`${styles.count} ${styles.section}`} aria-label="Contagem regressiva">
      <div className={styles.wrap}>
        <Reveal className={styles.head}>
          <p className={styles.eyebrow}>Contagem regressiva</p>
          <h2 className={styles.countTitle}>{c.isPast ? "Hoje é o grande dia" : "Faltam"}</h2>
        </Reveal>
        {!c.isPast ? (
          <Reveal className={styles.countGrid} delay={0.08}>
            {units.map(([value, label]) => (
              <div key={label} className={styles.countCell}>
                <span className={styles.countNum} aria-hidden>
                  {c.ready ? pad(value) : "—"}
                </span>
                <span className={styles.countLabel}>{label}</span>
              </div>
            ))}
          </Reveal>
        ) : null}
        <Reveal delay={0.12}>
          <p className={styles.countFoot}>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- Story */

function Story({ wedding }: Props) {
  const gallery = wedding.gallery;
  return (
    <section id="historia" className={`${styles.story} ${styles.section}`} aria-labelledby="story-title">
      <div className={styles.wrap}>
        <header className={styles.storyHead}>
          <Reveal className={styles.head}>
            <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
            <h2 id="story-title" className={styles.h1}>
              {wedding.storyTitle}
            </h2>
          </Reveal>
        </header>

        <div className={styles.spreads}>
          {wedding.storyMoments.map((moment, i) => {
            const img = storyImage(gallery, i);
            return (
              <article key={moment.id} className={`${styles.spread} ${i % 2 === 1 ? styles.spreadAlt : ""}`}>
                <Reveal className={styles.spreadMedia} y={24}>
                  <div className={styles.spreadImgWrap}>
                    {img ? (
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        loading="lazy"
                        sizes="(min-width: 860px) 44vw, 100vw"
                        className={styles.spreadImg}
                      />
                    ) : null}
                  </div>
                  <span className={styles.folio} aria-hidden>
                    {moment.number}
                  </span>
                </Reveal>
                <Reveal className={styles.spreadBody} delay={0.08}>
                  <p className={styles.kicker}>{moment.title}</p>
                  <h3 className={styles.spreadTitle}>
                    {moment.headline.split("\n").map((line, k) => (
                      <span key={k} className={styles.spreadLine}>
                        {line}
                      </span>
                    ))}
                  </h3>
                  <p className={styles.body}>{moment.description}</p>
                </Reveal>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Program */

function Program({ wedding }: Props) {
  if (!wedding.schedule.length) return null;
  return (
    <section id="programa" className={`${styles.program} ${styles.section}`} aria-labelledby="program-title">
      <div className={styles.wrap}>
        <header className={styles.programHead}>
          <Reveal className={styles.head}>
            <p className={styles.eyebrow}>{wedding.detailsTitle}</p>
            <h2 id="program-title" className={styles.h1}>
              O roteiro da noite
            </h2>
            {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
          </Reveal>
        </header>
        <ol className={styles.programList}>
          {wedding.schedule.map((item, i) => (
            <Reveal as="li" key={item.id} className={styles.programRow} delay={i * 0.05} y={14}>
              <span className={styles.programTime}>{item.time}</span>
              <span>
                <span className={styles.programTitle}>{item.title}</span>
                {item.note ? <span className={styles.programNote}>{item.note}</span> : null}
              </span>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Location */

function Location({ wedding }: Props) {
  const location = wedding.locations[0];
  const query = encodeURIComponent(
    [location.venue, location.address, location.city].filter(Boolean).join(", ")
  );
  const embed = `https://www.google.com/maps?q=${query}&z=14&hl=pt-BR&output=embed`;

  return (
    <section id="local" className={`${styles.location} ${styles.section}`} aria-labelledby="location-title">
      <div className={`${styles.wrap} ${styles.locationGrid}`}>
        <Reveal className={styles.locationInfo}>
          <p className={styles.eyebrow}>O local</p>
          <h2 id="location-title" className={styles.h1}>
            {location.venue}
          </h2>
          <p className={styles.locationCity}>{location.city}</p>
          {location.address ? <p className={styles.body}>{location.address}</p> : null}
          {location.note ? <p className={styles.body}>{location.note}</p> : null}
          <a className={styles.btnGhost} href={location.mapUrl} target="_blank" rel="noreferrer">
            Abrir no Google Maps →
          </a>
        </Reveal>
        <Reveal className={styles.mapWrap} delay={0.08} y={24}>
          <iframe
            className={styles.mapFrame}
            src={embed}
            title={`Mapa — ${location.venue}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Info */

function Info({ details }: { details: WeddingSite["detailCards"] }) {
  return (
    <section id="detalhes" className={`${styles.info} ${styles.section}`} aria-labelledby="info-title">
      <div className={styles.wrap}>
        <header className={styles.infoHead}>
          <Reveal className={styles.head}>
            <p className={styles.eyebrow}>Informações</p>
            <h2 id="info-title" className={styles.h1}>
              O que você precisa saber
            </h2>
          </Reveal>
        </header>
        <div className={styles.infoGrid}>
          {details.map((card, i) => (
            // Reveal no wrapper: no mesmo elemento ele anularia a elevação do hover.
            <Reveal key={card.id} delay={(i % 3) * 0.06} y={20}>
              <div className={styles.infoCard}>
                {card.image ? (
                  <div className={styles.infoMedia}>
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      loading="lazy"
                      sizes="(min-width: 900px) 30vw, 100vw"
                      className={styles.infoImg}
                    />
                  </div>
                ) : null}
                <div className={styles.infoBody}>
                  <p className={styles.infoSub}>{card.subtitle}</p>
                  <h3 className={styles.infoTitle}>{card.title}</h3>
                  <p className={styles.infoText}>{card.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Gallery */

function Gallery({ images }: { images: WeddingGalleryImage[] }) {
  const [active, setActive] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active !== null && !dialog.open) dialog.showModal();
    if (active === null && dialog.open) dialog.close();
  }, [active]);

  if (!images.length) return null;
  const current = active !== null ? images[active] : null;

  return (
    <section id="galeria" className={`${styles.gallery} ${styles.section}`} aria-labelledby="gallery-title">
      <div className={styles.wrap}>
        <header className={styles.sectionHead}>
          <Reveal className={styles.head}>
            <p className={styles.eyebrow}>Galeria</p>
            <h2 id="gallery-title" className={styles.h1}>
              Retratos do casal
            </h2>
          </Reveal>
        </header>
      </div>

      <div className={`${styles.wrap} ${styles.galleryGrid}`}>
        {images.map((image, i) => (
          <div key={image.id} className={styles.galleryItem}>
            <button
              type="button"
              className={styles.galleryBtn}
              onClick={() => setActive(i)}
              aria-label={`Abrir foto: ${image.alt}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={900}
                height={1200}
                loading="lazy"
                sizes="(min-width: 1080px) 24vw, (min-width: 720px) 33vw, 50vw"
                className={styles.galleryImg}
              />
            </button>
          </div>
        ))}
      </div>

      <dialog ref={dialogRef} className={styles.lightbox} onClose={() => setActive(null)}>
        <button
          type="button"
          className={styles.lightboxClose}
          onClick={() => setActive(null)}
          aria-label="Fechar"
        >
          ×
        </button>
        {current ? (
          <figure className={styles.lightboxFig}>
            <Image
              src={current.src}
              alt={current.alt}
              width={1600}
              height={2000}
              className={styles.lightboxImg}
            />
            {current.caption ? <figcaption className={styles.lightboxCap}>{current.caption}</figcaption> : null}
          </figure>
        ) : null}
      </dialog>
    </section>
  );
}

/* ----------------------------------------------------------------- Final */

function Final({ wedding }: Props) {
  return (
    <section className={styles.final} aria-label="Mensagem final">
      <div className={styles.finalMedia}>
        <Image src={wedding.footerImage} alt="" fill loading="lazy" sizes="100vw" className={styles.finalImg} />
      </div>
      <div className={styles.finalScrim} />
      <div className={styles.finalInner}>
        <Reveal className={styles.head}>
          <p className={styles.eyebrow}>Com carinho</p>
          <p className={styles.finalText}>{wedding.finalText}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Footer */

function Footer({ wedding }: Props) {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.wrap} ${styles.footerInner}`}>
        <p className={styles.footerMono}>{wedding.monogram}</p>
        <p className={styles.footerNames}>{wedding.coupleNames}</p>
        {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
        <p className={styles.footerMeta}>
          {wedding.weddingDateLabel}
          {wedding.locations[0]?.city ? ` · ${wedding.locations[0].city}` : ""}
        </p>
        <p className={styles.footerCredit}>Feito com Noivar</p>
      </div>
    </footer>
  );
}

/* ----------------------------------------------------------------- utils */

function splitCouple(names: string): [string, string] {
  const parts = names.split(/\s*&\s*| e /i);
  if (parts.length >= 2) {
    return [parts[0].trim(), parts.slice(1).join(" & ").trim()];
  }
  return [names.trim(), ""];
}
