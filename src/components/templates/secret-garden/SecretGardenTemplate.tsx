"use client";

import { useRef } from "react";
import Image from "next/image";
import { Prata, Raleway } from "next/font/google";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { useMenu, useScrolled } from "@/components/templates/kit/hooks";
import { FernFrond, MonsteraLeaf, PalmFrond, StarSpark } from "@/components/templates/kit/ornaments";
import {
  activeCards,
  activeGifts,
  headlineLines,
  mainLocation,
  mapEmbedUrl,
  mapLink,
  nameScale,
  program,
  splitCouple,
  storyMoments
} from "@/components/templates/kit/utils";
import styles from "./secret-garden.module.css";

const display = Prata({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--sg-display",
  display: "swap"
});

const sans = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--sg-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

export function SecretGardenTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const moments = storyMoments(wedding);
  const photos = galleryRest(wedding);
  const hasGifts = activeGifts(wedding).length > 0;

  const nav = [
    ["#convite", "Convite"],
    moments.length ? ["#historia", "História"] : null,
    schedule.length ? ["#programacao", "Programação"] : null,
    location ? ["#local", "Local"] : null,
    hasGifts ? ["#presentes", "Presentes"] : null,
    photos.length ? ["#galeria", "Galeria"] : null
  ].filter((item): item is [string, string] => item !== null);

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template}`}>
      <Nav wedding={wedding} items={nav} />
      <Hero wedding={wedding} />

      {/* Convite — coluna estreita sobre floresta-2 */}
      <section id="convite" className={styles.invite} aria-labelledby="invite-title">
        <Reveal className={styles.inviteInner}>
          <StarSpark className={styles.spark} />
          <p className={styles.eyebrow}>O convite</p>
          <h2 id="invite-title" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          {wedding.welcomeText ? <p className={styles.inviteLead}>{wedding.welcomeText}</p> : null}
        </Reveal>
      </section>

      {moments.length ? <Story wedding={wedding} /> : null}
      <Countdown wedding={wedding} />
      {schedule.length ? <Program wedding={wedding} /> : null}
      {location ? <Location wedding={wedding} /> : null}

      {cards.length ? (
        <section id="informacoes" className={styles.info} aria-labelledby="info-title">
          <div className={styles.wrap}>
            <Reveal className={styles.infoHead}>
              <p className={styles.eyebrow}>Informações</p>
              <h2 id="info-title" className={styles.h2}>
                O que você precisa saber
              </h2>
            </Reveal>
            <div className={styles.infoGrid}>
              {cards.map((card, i) => (
                <Reveal as="article" key={card.id} className={styles.infoCard} delay={(i % 3) * 0.07} y={18}>
                  {card.image ? (
                    <div className={styles.infoMedia}>
                      <Image src={card.image} alt="" fill loading="lazy" sizes="(min-width: 900px) 30vw, 100vw" className={styles.infoImg} />
                    </div>
                  ) : null}
                  {card.subtitle ? <p className={styles.kicker}>{card.subtitle}</p> : null}
                  <h3 className={styles.h3}>{card.title}</h3>
                  {card.body ? <p className={styles.body}>{card.body}</p> : null}
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {hasGifts ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="gifts-title">
          <div className={styles.wrap}>
            <Reveal className={styles.giftsHead}>
              <p className={styles.eyebrow}>Lista de presentes</p>
              <h2 id="gifts-title" className={styles.h2}>
                Um gesto para a vida a dois
              </h2>
              <p className={styles.lead}>
                Cada presente é um Pix direto na chave do casal — sem taxas e sem intermediários.
              </p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {photos.length ? <Gallery wedding={wedding} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      <Final wedding={wedding} />
      <Footer wedding={wedding} />
    </main>
  );
}

/* ------------------------------------------------------------------ Nav */

function Nav({ wedding, items }: Props & { items: Array<[string, string]> }) {
  const solid = useScrolled(80);
  const [open, toggle, close] = useMenu();

  return (
    <header className={`${styles.nav} ${solid || open ? styles.navSolid : ""}`}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <a href="#top" className={styles.navMono} aria-label={wedding.coupleNames}>
          {wedding.monogram}
        </a>
        <nav className={styles.navLinks} aria-label="Seções">
          {items.map(([href, label]) => (
            <a key={href} href={href} className={styles.navLink}>
              {label}
            </a>
          ))}
        </nav>
        {wedding.rsvp.enabled ? (
          <a href="#confirmar" className={styles.navCta}>
            Confirmar
          </a>
        ) : null}
        <button type="button" className={styles.navToggle} aria-expanded={open} aria-label="Abrir menu" onClick={toggle}>
          {open ? "Fechar" : "Menu"}
        </button>
      </div>
      {open ? (
        <nav className={styles.navMobile} aria-label="Seções">
          {[...items, ...(wedding.rsvp.enabled ? [["#confirmar", "Confirmar presença"] as [string, string]] : [])].map(
            ([href, label]) => (
              <a key={href} href={href} className={styles.navMobileLink} onClick={close}>
                {label}
              </a>
            )
          )}
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
  // Camadas em sentidos opostos: a foto e as folhas do fundo sobem devagar, as da
  // frente descem — é o que dá a profundidade. 0 (não undefined) sob reduced-motion
  // para a hidratação bater com o SSR.
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const backY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const frontY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const [first, second] = splitCouple(wedding.coupleNames);
  const location = mainLocation(wedding);
  const place = location ? [location.venue, location.city].filter(Boolean).join(" · ") : "";

  return (
    <section
      id="top"
      ref={ref}
      className={`${styles.hero} ${wedding.heroImage ? "" : styles.heroBare}`}
      aria-label={`Casamento de ${wedding.coupleNames}`}
    >
      {wedding.heroImage ? (
        <motion.div className={styles.heroMedia} style={{ y: reduce ? 0 : photoY }}>
          <Image src={wedding.heroImage} alt="" fill priority sizes="100vw" className={styles.heroImg} />
        </motion.div>
      ) : (
        <div className={styles.heroGlow} aria-hidden />
      )}
      <div className={styles.heroScrim} aria-hidden />

      {/* Folhas em silhueta: camada de trás menor e mais apagada, camada da frente maior. */}
      <motion.div className={`${styles.leaves} ${styles.leavesBack}`} style={{ y: reduce ? 0 : backY }} aria-hidden>
        <PalmFrond className={`${styles.leaf} ${styles.leafBackTR}`} />
        <FernFrond className={`${styles.leaf} ${styles.leafBackL}`} />
        <MonsteraLeaf className={`${styles.leaf} ${styles.leafBackBR}`} />
      </motion.div>
      <motion.div className={`${styles.leaves} ${styles.leavesFront}`} style={{ y: reduce ? 0 : frontY }} aria-hidden>
        <MonsteraLeaf className={`${styles.leaf} ${styles.leafFrontBL}`} />
        <PalmFrond className={`${styles.leaf} ${styles.leafFrontBR}`} />
        <FernFrond className={`${styles.leaf} ${styles.leafFrontTL}`} />
      </motion.div>

      <div className={styles.heroContent}>
        <p className={`${styles.heroEyebrow} hero-rise`}>Vamos nos casar</p>
        <h1 className={`${styles.heroNames} hero-rise`} data-scale={nameScale(wedding.coupleNames)} style={{ animationDelay: "120ms" }}>
          <span className={styles.heroName}>{first}</span>
          {second ? (
            <>
              <span className={styles.heroAmp} aria-hidden>
                &amp;
              </span>
              <span className={styles.heroName}>{second}</span>
            </>
          ) : null}
        </h1>
        <div className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "240ms" }}>
          <span className={styles.heroRule} aria-hidden />
          <p className={styles.heroDate}>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </p>
          {place ? <p className={styles.heroPlace}>{place}</p> : null}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Story */

function Story({ wedding }: Props) {
  const moments = storyMoments(wedding);
  return (
    <section id="historia" className={styles.story} aria-labelledby="story-title">
      <div className={styles.wrap}>
        <Reveal className={styles.storyHead}>
          <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
          <h2 id="story-title" className={styles.h2}>
            {wedding.storyTitle}
          </h2>
        </Reveal>
        <div className={styles.chapters} data-count={Math.min(moments.length, 3)}>
          {moments.map((moment, i) => {
            const img = storyImage(wedding.gallery, i);
            const lines = headlineLines(moment.headline);
            return (
              <Reveal as="article" key={moment.id} className={styles.chapter} delay={(i % 3) * 0.1} y={24}>
                <div className={`${styles.gate} ${img ? "" : styles.gateBare}`}>
                  <span className={`${styles.gateLeaf} ${styles.gateLeafL}`} aria-hidden>
                    <MonsteraLeaf />
                  </span>
                  <span className={`${styles.gateLeaf} ${styles.gateLeafR}`} aria-hidden>
                    <FernFrond />
                  </span>
                  <div className={styles.gateFrame}>
                    {img ? (
                      <Image src={img.src} alt={img.alt} fill loading="lazy" sizes="(min-width: 900px) 30vw, 80vw" className={styles.gateImg} />
                    ) : (
                      <span className={styles.gateNum} aria-hidden>
                        {moment.number || String(i + 1).padStart(2, "0")}
                      </span>
                    )}
                  </div>
                </div>
                <p className={styles.kicker}>
                  {moment.number ? <span className={styles.kickerNum}>{moment.number}</span> : null}
                  {moment.title}
                </p>
                {lines.length ? (
                  <h3 className={styles.h3}>
                    {lines.map((line, k) => (
                      <span key={k} className={styles.line}>
                        {line}
                      </span>
                    ))}
                  </h3>
                ) : null}
                {moment.description ? <p className={styles.body}>{moment.description}</p> : null}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Countdown */

function Countdown({ wedding }: Props) {
  const c = useCountdown(wedding.weddingDate);
  const hasDate = Number.isFinite(new Date(wedding.weddingDate).getTime());
  const units: Array<[number, string]> = [
    [c.days, "dias"],
    [c.hours, "horas"],
    [c.minutes, "min"],
    [c.seconds, "seg"]
  ];

  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <div className={`${styles.wrap} ${styles.countGrid}`}>
        <Reveal className={styles.countIntro}>
          <p className={styles.eyebrow}>Contagem regressiva</p>
          <h2 className={styles.countTitle}>{c.isPast ? "Hoje é o grande dia" : "Falta pouco para o nosso jardim florescer"}</h2>
          <p className={styles.countDate}>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </p>
        </Reveal>
        {hasDate && !c.isPast ? (
          <Reveal className={styles.countCells} delay={0.1}>
            {units.map(([value, label]) => (
              <div key={label} className={styles.countCell}>
                <span className={styles.countNum}>{c.ready ? pad(value) : "—"}</span>
                <span className={styles.countLabel}>{label}</span>
              </div>
            ))}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Program */

function Program({ wedding }: Props) {
  const items = program(wedding);
  return (
    <section id="programacao" className={styles.program} aria-labelledby="program-title">
      <div className={`${styles.wrap} ${styles.programGrid}`}>
        <Reveal className={styles.programHead}>
          <p className={styles.eyebrow}>Programação</p>
          <h2 id="program-title" className={styles.h2}>
            {wedding.detailsTitle || "O roteiro do dia"}
          </h2>
          {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
        </Reveal>
        <ol className={styles.programList}>
          {items.map((item, i) => (
            <Reveal as="li" key={item.id} className={styles.programRow} delay={i * 0.05} y={14}>
              <span className={styles.programTime}>{item.time}</span>
              <span className={styles.programMain}>
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

/* ------------------------------------------------------------- Location */

function Location({ wedding }: Props) {
  const location = mainLocation(wedding);
  if (!location) return null;
  return (
    <section id="local" className={styles.location} aria-labelledby="location-title">
      <div className={`${styles.wrap} ${styles.locationGrid}`}>
        <Reveal className={styles.mapWrap} y={24}>
          <iframe
            className={styles.map}
            src={mapEmbedUrl(location)}
            title={`Mapa — ${location.venue || location.city}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Reveal>
        <Reveal className={styles.locationInfo} delay={0.08}>
          <p className={styles.eyebrow}>O local</p>
          <h2 id="location-title" className={styles.h2}>
            {location.venue || location.city}
          </h2>
          {location.venue && location.city ? <p className={styles.locationCity}>{location.city}</p> : null}
          {location.address ? <p className={styles.body}>{location.address}</p> : null}
          {location.note ? <p className={styles.body}>{location.note}</p> : null}
          <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
            Abrir no Google Maps
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Gallery */

function Gallery({ wedding }: Props) {
  const images = galleryRest(wedding);
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="gallery-title">
      <div className={styles.wrap}>
        <Reveal className={styles.galleryHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="gallery-title" className={styles.h2}>
            Entre as folhas
          </h2>
        </Reveal>
        <div className={styles.mosaic}>
          {images.map((image, i) => (
            <Reveal key={image.id} className={`${styles.tile} ${i % 5 === 0 ? styles.tileWide : ""}`} delay={(i % 4) * 0.05} y={16}>
              <button type="button" className={styles.tileBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${image.alt}`}>
                <Image src={image.src} alt={image.alt} fill loading="lazy" sizes="(min-width: 900px) 25vw, 50vw" className={styles.tileImg} />
              </button>
            </Reveal>
          ))}
        </div>
      </div>
      <Lightbox
        images={images}
        active={lb.active}
        onClose={lb.close}
        classNames={{
          dialog: styles.lightbox,
          close: styles.lightboxClose,
          nav: styles.lightboxNav,
          figure: styles.lightboxFig,
          img: styles.lightboxImg,
          caption: styles.lightboxCap
        }}
      />
    </section>
  );
}

/* ---------------------------------------------------------------- Final */

function Final({ wedding }: Props) {
  if (!wedding.finalText && !wedding.footerImage) return null;
  return (
    <section className={`${styles.final} ${wedding.footerImage ? "" : styles.finalBare}`} aria-label="Mensagem final">
      {wedding.footerImage ? (
        <div className={styles.finalMedia}>
          <Image src={wedding.footerImage} alt="" fill loading="lazy" sizes="100vw" className={styles.finalImg} />
        </div>
      ) : null}
      <div className={styles.finalVeil} aria-hidden />
      <span className={`${styles.finalLeaf} ${styles.finalLeafTL}`} aria-hidden>
        <PalmFrond />
      </span>
      <span className={`${styles.finalLeaf} ${styles.finalLeafBR}`} aria-hidden>
        <MonsteraLeaf />
      </span>
      <Reveal className={styles.finalInner}>
        <StarSpark className={styles.spark} />
        {wedding.finalText ? <p className={styles.finalText}>{wedding.finalText}</p> : null}
        <p className={styles.finalNames}>{wedding.coupleNames}</p>
      </Reveal>
    </section>
  );
}

/* --------------------------------------------------------------- Footer */

function Footer({ wedding }: Props) {
  const location = mainLocation(wedding);
  return (
    <footer className={styles.footer}>
      <div className={`${styles.wrap} ${styles.footerInner}`}>
        <p className={styles.footerMono}>{wedding.monogram}</p>
        <div className={styles.footerMain}>
          <p className={styles.footerNames}>{wedding.coupleNames}</p>
          <p className={styles.footerMeta}>
            {wedding.weddingDateLabel}
            {location?.city ? ` · ${location.city}` : ""}
          </p>
        </div>
        <div className={styles.footerSide}>
          {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
          <p className={styles.footerCredit}>Feito com Noivar</p>
        </div>
      </div>
    </footer>
  );
}
