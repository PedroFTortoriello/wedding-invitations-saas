"use client";

import { useRef } from "react";
import Image from "next/image";
import { Be_Vietnam_Pro, Libre_Caslon_Display } from "next/font/google";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { useMenu, useScrolled } from "@/components/templates/kit/hooks";
import { MonsteraLeaf, PalmFrond } from "@/components/templates/kit/ornaments";
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
import styles from "./tropical-editorial.module.css";

/* Libre Caslon Display só existe em 400 (font-data.json); Be Vietnam Pro em 400/500/600. */
const display = Libre_Caslon_Display({ subsets: ["latin"], weight: "400", variable: "--te-display", display: "swap" });
const sans = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--te-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

export function TropicalEditorialTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gifts = activeGifts(wedding);
  const photos = galleryRest(wedding);

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
    <main className={`${display.variable} ${sans.variable} ${styles.template}`}>
      <Nav wedding={wedding} items={nav} />
      <Hero wedding={wedding} />
      <Invite wedding={wedding} />
      {moments.length ? <Story wedding={wedding} moments={moments} /> : null}
      <Countdown wedding={wedding} />
      {schedule.length ? <Program wedding={wedding} schedule={schedule} /> : null}
      {location ? <Place location={location} /> : null}
      {cards.length ? <Cards cards={cards} /> : null}
      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="gifts-title">
          <div className={styles.wrap}>
            <Reveal className={styles.giftsHead}>
              <p className={styles.eyebrow}>Lista de presentes</p>
              <h2 id="gifts-title" className={styles.h2}>
                Um gesto para a vida a dois
              </h2>
              <p className={styles.lead}>
                Cada presente é um Pix direto na chave do casal: cem por cento para eles, sem taxas e sem
                intermediários.
              </p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}
      {photos.length ? <Gallery images={photos} /> : null}
      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />
      <Final wedding={wedding} />
      <Footer wedding={wedding} location={location} />
    </main>
  );
}

/* ------------------------------------------------------------------ Nav */

function Nav({ wedding, items }: Props & { items: [string, string][] }) {
  const solid = useScrolled(60);
  const [open, toggle, close] = useMenu();
  return (
    <header className={`${styles.nav} ${solid || open ? styles.navSolid : ""}`}>
      <div className={styles.navInner}>
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

/* ----------------------------------------------------------------- Capa */

function Hero({ wedding }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  /* O deslocamento vira zero em reduced-motion: o style sai igual no servidor e no cliente (sem aviso de hidratação). */
  const leafY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const frondY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-12%"]);

  const [first, second] = splitCouple(wedding.coupleNames);
  const location = mainLocation(wedding);
  const place = location ? [location.venue, location.city].filter(Boolean).join(", ") : "";
  const photo = wedding.heroImage;

  return (
    <section
      id="top"
      ref={ref}
      className={`${styles.hero} ${photo ? "" : styles.heroNoPhoto}`}
      aria-label={`Casamento de ${wedding.coupleNames}`}
    >
      {/* Folhas em silhueta por trás de tudo, com parallax leve (framer-motion; desligado em reduced-motion). */}
      <motion.div className={styles.heroLeaves} style={{ y: leafY }} aria-hidden>
        <MonsteraLeaf className={styles.leafMonstera} />
      </motion.div>
      <motion.div className={styles.heroFronds} style={{ y: frondY }} aria-hidden>
        <PalmFrond className={styles.leafFrond} />
        <PalmFrond className={styles.leafFrondB} />
      </motion.div>

      <div className={styles.heroGrid}>
        <div className={styles.heroText}>
          <p className={`${styles.heroKicker} hero-rise`}>Casamento</p>
          <h1 className={styles.heroNames} data-scale={nameScale(wedding.coupleNames)}>
            <span className={`${styles.heroName} hero-rise`} style={{ animationDelay: "120ms" }}>
              {first}
            </span>
            {second ? (
              <span className={`${styles.heroName} hero-rise`} style={{ animationDelay: "260ms" }}>
                <span className={styles.heroAmp}>&amp;</span>
                {second}
              </span>
            ) : null}
          </h1>
          <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "420ms" }}>
            {[wedding.weddingDateLabel, wedding.weddingTime].filter(Boolean).length ? (
              <span className={styles.heroMetaLine}>
                {[wedding.weddingDateLabel, wedding.weddingTime].filter(Boolean).join(" · ")}
              </span>
            ) : null}
            {place ? <span className={styles.heroMetaLine}>{place}</span> : null}
          </p>
        </div>

        {photo ? (
          <figure className={`${styles.heroPhoto} hero-rise`} style={{ animationDelay: "200ms" }}>
            <Image src={photo} alt="" fill priority sizes="(min-width: 900px) 40vw, 100vw" className={styles.cover} />
          </figure>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Convite */

function Invite({ wedding }: Props) {
  return (
    <section id="convite" className={styles.invite} aria-labelledby="invite-title">
      <div className={`${styles.wrap} ${styles.inviteGrid}`}>
        <Reveal className={styles.inviteLead}>
          <p className={`${styles.eyebrow} ${styles.onDark}`}>O convite</p>
          <h2 id="invite-title" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
        </Reveal>
        <Reveal className={styles.inviteBody} delay={0.08}>
          <span className={styles.papayaRule} aria-hidden />
          <p className={styles.inviteText}>{wedding.welcomeText}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- História */

function Story({ wedding, moments }: Props & { moments: WeddingSite["storyMoments"] }) {
  return (
    <section id="historia" className={styles.story} aria-labelledby="story-title">
      <div className={styles.wrap}>
        <Reveal className={styles.storyHead}>
          <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
          <h2 id="story-title" className={styles.h2}>
            {wedding.storyTitle}
          </h2>
        </Reveal>
        <div className={`${styles.chapters} ${wedding.gallery.length ? "" : styles.chaptersCols}`}>
          {moments.map((moment, i) => {
            const img = storyImage(wedding.gallery, i);
            const lines = headlineLines(moment.headline);
            return (
              <Reveal
                as="article"
                key={moment.id}
                className={`${styles.chapter} ${i % 2 ? styles.chapterAlt : ""} ${img ? "" : styles.chapterNoPhoto}`}
                y={20}
              >
                {img ? (
                  <figure className={styles.chapterMedia}>
                    <Image src={img.src} alt={img.alt} fill loading="lazy" sizes="(min-width: 900px) 34vw, 100vw" className={styles.cover} />
                  </figure>
                ) : null}
                <div className={styles.chapterBody}>
                  <span className={styles.numeral} aria-hidden>
                    {moment.number}
                  </span>
                  <p className={styles.kicker}>{moment.title}</p>
                  {lines.length ? (
                    <h3 className={styles.chapterTitle}>
                      {lines.map((line, k) => (
                        <span key={k} className={styles.line}>
                          {line}
                        </span>
                      ))}
                    </h3>
                  ) : null}
                  {moment.description ? <p className={styles.chapterText}>{moment.description}</p> : null}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Contagem */

function Countdown({ wedding }: Props) {
  const c = useCountdown(wedding.weddingDate);
  const valid = Number.isFinite(new Date(wedding.weddingDate).getTime());
  const small: [string, string][] = [
    [c.ready ? pad(c.hours) : "00", "horas"],
    [c.ready ? pad(c.minutes) : "00", "minutos"],
    [c.ready ? pad(c.seconds) : "00", "segundos"]
  ];

  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <MonsteraLeaf className={styles.countLeaf} />
      <Reveal className={`${styles.wrap} ${styles.countInner}`}>
        <p className={styles.eyebrow}>{c.isPast ? "Chegou o dia" : valid ? "Contagem regressiva" : "A data"}</p>
        {valid && !c.isPast ? (
          <div className={styles.countRow}>
            <p className={styles.countDays}>
              <span className={styles.countBig}>{c.ready ? c.days : "—"}</span>
              <span className={styles.countLabel}>{c.days === 1 ? "dia" : "dias"}</span>
            </p>
            <div className={styles.countSmall}>
              {small.map(([value, label]) => (
                <p key={label} className={styles.countUnit}>
                  <span className={styles.countNum}>{value}</span>
                  <span className={styles.countLabel}>{label}</span>
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p className={styles.countBig}>{c.isPast ? "Hoje é o grande dia" : wedding.weddingDateLabel || "Em breve"}</p>
        )}
        {valid ? (
          <p className={styles.countFoot}>{[wedding.weddingDateLabel, wedding.weddingTime].filter(Boolean).join(" · ")}</p>
        ) : null}
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------- Programação */

function Program({ wedding, schedule }: Props & { schedule: WeddingSite["schedule"] }) {
  return (
    <section id="programacao" className={styles.program} aria-labelledby="program-title">
      <div className={`${styles.wrap} ${styles.programGrid}`}>
        <Reveal className={styles.programHead}>
          <p className={styles.eyebrow}>Programação</p>
          <h2 id="program-title" className={styles.h2}>
            {wedding.detailsTitle}
          </h2>
          {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
        </Reveal>
        <Reveal as="ol" className={styles.timeline} delay={0.08}>
          {schedule.map((item) => (
            <li key={item.id} className={styles.row}>
              <span className={styles.rowTime}>{item.time}</span>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{item.title}</span>
                {item.note ? <span className={styles.rowNote}>{item.note}</span> : null}
              </span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Local */

function Place({ location }: { location: NonNullable<ReturnType<typeof mainLocation>> }) {
  return (
    <section id="local" className={styles.place} aria-labelledby="place-title">
      <div className={`${styles.wrap} ${styles.placeGrid}`}>
        <Reveal className={styles.mapFrame} y={24}>
          <iframe
            className={styles.map}
            src={mapEmbedUrl(location)}
            title={`Mapa — ${location.venue || location.city}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Reveal>
        <Reveal className={styles.placeBody} delay={0.08}>
          <p className={styles.eyebrow}>O local</p>
          <h2 id="place-title" className={styles.h2}>
            {location.venue || location.city}
          </h2>
          {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
          {location.address ? <p className={styles.placeText}>{location.address}</p> : null}
          {location.note ? <p className={styles.placeText}>{location.note}</p> : null}
          <a className={styles.btnPapaya} href={mapLink(location)} target="_blank" rel="noreferrer">
            Abrir no Google Maps
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Cartões */

function Cards({ cards }: { cards: WeddingSite["detailCards"] }) {
  return (
    <section id="informacoes" className={styles.cards} aria-label="Informações">
      <div className={`${styles.wrap} ${styles.cardsGrid}`}>
        {cards.map((card, i) => (
          <Reveal as="article" key={card.id} className={styles.card} delay={i * 0.07} y={18}>
            <span className={styles.papayaRule} aria-hidden />
            {card.image ? (
              <figure className={styles.cardMedia}>
                <Image src={card.image} alt="" fill loading="lazy" sizes="(min-width: 900px) 30vw, 100vw" className={styles.cover} />
              </figure>
            ) : null}
            {card.subtitle ? <p className={styles.kicker}>{card.subtitle}</p> : null}
            <h3 className={styles.cardTitle}>{card.title}</h3>
            {card.body ? <p className={styles.cardText}>{card.body}</p> : null}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Galeria */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="gallery-title">
      <div className={styles.wrap}>
        <Reveal className={styles.galleryHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="gallery-title" className={styles.h2}>
            Retratos
          </h2>
        </Reveal>
        <div className={styles.galleryGrid}>
          {images.map((image, i) => (
            <Reveal key={image.id} className={i === 0 ? styles.galleryTall : undefined} delay={(i % 3) * 0.06} y={14}>
              <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${image.alt}`}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  loading="lazy"
                  sizes="(min-width: 900px) 33vw, 50vw"
                  className={styles.cover}
                />
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

/* --------------------------------------------------------- Encerramento */

function Final({ wedding }: Props) {
  const photo = wedding.footerImage;
  return (
    <section className={`${styles.final} ${photo ? "" : styles.finalNoPhoto}`} aria-label="Mensagem final">
      <PalmFrond className={styles.finalFrond} />
      <div className={`${styles.wrap} ${styles.finalGrid}`}>
        {photo ? (
          <Reveal as="figure" className={styles.finalMedia} y={24}>
            <Image src={photo} alt="" fill loading="lazy" sizes="(min-width: 900px) 34vw, 70vw" className={styles.cover} />
          </Reveal>
        ) : null}
        <Reveal className={styles.finalBody} delay={0.1}>
          <span className={styles.papayaRule} aria-hidden />
          <p className={styles.finalText}>{wedding.finalText}</p>
          <p className={styles.finalNames}>{wedding.coupleNames}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Rodapé */

function Footer({ wedding, location }: Props & { location: ReturnType<typeof mainLocation> }) {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.wrap} ${styles.footerInner}`}>
        <p className={styles.footerMono}>{wedding.monogram}</p>
        <div className={styles.footerCol}>
          <p className={styles.footerNames}>{wedding.coupleNames}</p>
          <p className={styles.footerMeta}>{[wedding.weddingDateLabel, location?.city].filter(Boolean).join(" · ")}</p>
        </div>
        <div className={styles.footerCol}>
          {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
          <p className={styles.footerCredit}>Feito com Noivar</p>
        </div>
      </div>
    </footer>
  );
}
