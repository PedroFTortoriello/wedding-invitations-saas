"use client";

import { useRef } from "react";
import Image from "next/image";
import { Castoro, Mulish } from "next/font/google";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, pad, useCountdown } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { SunRays } from "@/components/templates/kit/ornaments";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { useMenu, useScrolled } from "@/components/templates/kit/hooks";
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
import styles from "./sunset-fields.module.css";

/* Castoro só existe em 400 (normal + itálico): o peso vem do tamanho, não do traço. */
const display = Castoro({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--sf-display",
  display: "swap"
});

const sans = Mulish({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--sf-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

export function SunsetFieldsTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gifts = activeGifts(wedding);
  const photos = galleryRest(wedding);
  const nav = [
    ["#convite", "Convite"],
    moments.length ? ["#historia", "História"] : null,
    schedule.length ? ["#programacao", "O dia"] : null,
    location ? ["#local", "Local"] : null,
    gifts.length ? ["#presentes", "Presentes"] : null,
    photos.length ? ["#galeria", "Galeria"] : null,
    wedding.rsvp.enabled ? ["#confirmar", "Confirmar"] : null
  ].filter((item): item is [string, string] => item !== null);

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template}`}>
      <Nav wedding={wedding} links={nav} />
      <Hero wedding={wedding} />

      {/* Convite: coluna estreita em areia, fio terracota acima e abaixo */}
      <section id="convite" className={styles.invite} aria-labelledby="sf-invite">
        <Reveal className={styles.inviteInner}>
          <span className={styles.rule} aria-hidden />
          <p className={styles.eyebrow}>O convite</p>
          <h2 id="sf-invite" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <p className={styles.inviteText}>{wedding.welcomeText}</p>
          <span className={styles.rule} aria-hidden />
        </Reveal>
      </section>

      {/* História: capítulos em split assimétrico, foto de cantos superiores redondos, faixa mel nos ímpares */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="sf-story">
          <Reveal as="header" className={`${styles.wrap} ${styles.storyHead}`}>
            <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
            <h2 id="sf-story" className={styles.h2}>
              {wedding.storyTitle}
            </h2>
          </Reveal>
          {moments.map((moment, i) => {
            const img = storyImage(wedding.gallery, i);
            const lines = headlineLines(moment.headline);
            const odd = i % 2 === 1;
            return (
              <article key={moment.id} className={`${styles.chapter} ${odd ? styles.chapterBand : ""}`}>
                <div className={`${styles.wrap} ${styles.chapterGrid} ${odd ? styles.chapterFlip : ""} ${img ? "" : styles.chapterSolo}`}>
                  {img ? (
                    <Reveal as="figure" className={styles.chapterPhoto} y={20}>
                      <Image
                        src={img.src}
                        alt={img.alt}
                        width={900}
                        height={1100}
                        loading="lazy"
                        sizes="(min-width: 900px) 38vw, 80vw"
                        className={styles.chapterImg}
                      />
                    </Reveal>
                  ) : null}
                  <Reveal className={styles.chapterText} delay={0.08}>
                    <span className={styles.chapterNum} aria-hidden>
                      {moment.number}
                    </span>
                    <h3 className={styles.chapterTitle}>{moment.title}</h3>
                    {lines.length ? (
                      <p className={styles.chapterHeadline}>
                        {lines.map((line, k) => (
                          <span key={k}>{line}</span>
                        ))}
                      </p>
                    ) : null}
                    <p className={styles.body}>{moment.description}</p>
                  </Reveal>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação: linha do sol, horizontal no desktop e vertical no celular */}
      {schedule.length ? (
        <section id="programacao" className={styles.schedule} aria-labelledby="sf-schedule">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.scheduleHead}>
              <p className={styles.eyebrow}>O dia</p>
              <h2 id="sf-schedule" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.trail}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.stop} delay={i * 0.06} y={12}>
                  <span className={styles.stopSun} aria-hidden />
                  <span className={styles.stopTime}>{item.time}</span>
                  <span className={styles.stopTitle}>{item.title}</span>
                  {item.note ? <span className={styles.stopNote}>{item.note}</span> : null}
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Local: texto acima, mapa em sépia com moldura mel */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="sf-place">
          <div className={styles.wrap}>
            <Reveal className={styles.placeHead}>
              <p className={styles.eyebrow}>Onde</p>
              <h2 id="sf-place" className={styles.h2}>
                {location.venue || location.city}
              </h2>
              <p className={styles.placeMeta}>
                {[location.venue ? location.city : "", location.address].filter(Boolean).join(" · ")}
              </p>
              {location.note ? <p className={styles.body}>{location.note}</p> : null}
              <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
                Abrir no Google Maps
              </a>
            </Reveal>
            <Reveal className={styles.map} y={20}>
              <iframe
                className={styles.mapFrame}
                src={mapEmbedUrl(location)}
                title={`Mapa: ${location.venue || location.city}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Cartões: blocos mel de cantos 12px */}
      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={styles.wrap}>
            <ul className={styles.cardList}>
              {cards.map((card, i) => (
                <Reveal as="li" key={card.id} className={styles.card} delay={i * 0.06}>
                  <span className={styles.cardIndex} aria-hidden>
                    {pad(i + 1)}
                  </span>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  {card.subtitle ? <p className={styles.cardSub}>{card.subtitle}</p> : null}
                  {card.body ? <p className={styles.cardBody}>{card.body}</p> : null}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="sf-gifts">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.giftsHead}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="sf-gifts" className={styles.h2}>
                Um gesto para a nossa casa
              </h2>
              <p className={styles.lead}>Cada cota vai por Pix direto para o casal, sem taxas no caminho.</p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {photos.length ? <Gallery images={photos} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      {/* Encerramento: foto com o sol se pondo em areia na base, frase em Castoro itálico */}
      <section className={`${styles.closing} ${wedding.footerImage ? styles.closingWithPhoto : ""}`} aria-label="Até lá">
        {wedding.footerImage ? (
          <div className={styles.closingMedia}>
            <Image
              src={wedding.footerImage}
              alt=""
              fill
              loading="lazy"
              sizes="100vw"
              className={styles.closingImg}
            />
            <div className={styles.closingScrim} aria-hidden />
          </div>
        ) : null}
        <Reveal className={styles.closingText}>
          <SunRays className={styles.closingSun} />
          <p className={styles.closingQuote}>{wedding.finalText}</p>
          <p className={styles.closingMeta}>{wedding.weddingDateLabel}</p>
        </Reveal>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <p className={styles.footerMono}>{wedding.monogram}</p>
          <p className={styles.footerText}>{wedding.footerText}</p>
          <p className={styles.footerMeta}>
            {[wedding.coupleNames, wedding.weddingDateLabel, location?.city].filter(Boolean).join(" · ")}
          </p>
          <p className={styles.footerCredit}>Feito com Noivar</p>
        </div>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ Nav */

function Nav({ wedding, links }: Props & { links: [string, string][] }) {
  const [open, toggle, close] = useMenu();
  const solid = useScrolled(40);
  return (
    <header className={`${styles.nav} ${solid || open ? styles.navSolid : ""}`}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <a href="#topo" className={styles.navMono} aria-label={wedding.coupleNames}>
          {wedding.monogram}
        </a>
        <nav className={styles.navLinks} aria-label="Seções">
          {links.map(([href, label]) => (
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
          {links.map(([href, label]) => (
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
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const sunY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const [first, second] = splitCouple(wedding.coupleNames);
  const location = mainLocation(wedding);
  const place = location ? [location.venue, location.city].filter(Boolean).join(" · ") : "";

  return (
    <section
      id="topo"
      ref={ref}
      className={`${styles.hero} ${wedding.heroImage ? styles.heroWithPhoto : styles.heroSky}`}
      aria-label={`Casamento de ${wedding.coupleNames}`}
    >
      {wedding.heroImage ? (
        <motion.div className={styles.heroMedia} style={{ y: reduce ? 0 : photoY }}>
          <Image src={wedding.heroImage} alt="" fill priority sizes="100vw" className={styles.heroImg} />
        </motion.div>
      ) : null}
      <div className={styles.heroScrim} aria-hidden />

      {/* parallax (framer, inline transform) e entrada (keyframe local) em camadas separadas: animação sobrescreveria o transform inline.
          style sempre presente (y: 0 sob reduced-motion): style condicional dá mismatch de hidratação, useReducedMotion é null no servidor. */}
      <motion.div className={styles.heroSunWrap} style={{ y: reduce ? 0 : sunY }} aria-hidden>
        <span className={styles.heroSunRise}>
          <SunRays className={styles.heroSun} />
        </span>
      </motion.div>

      <div className={styles.heroText}>
        <h1
          className={`${styles.names} hero-rise`}
          data-scale={nameScale(wedding.coupleNames)}
          style={{ animationDelay: "120ms" }}
        >
          <span className={styles.name}>{first}</span>
          {second ? (
            <>
              <span className={styles.amp} aria-hidden>
                &amp;
              </span>
              <span className={styles.srOnly}> e </span>
              <span className={styles.name}>{second}</span>
            </>
          ) : null}
        </h1>
        <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "240ms" }}>
          <span className={styles.heroDate}>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </span>
          {place ? <span className={styles.heroPlace}>{place}</span> : null}
        </p>
        {wedding.rsvp.enabled ? (
          <a href="#confirmar" className={`${styles.btn} hero-rise`} style={{ animationDelay: "360ms" }}>
            Confirmar presença
          </a>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Contagem */

function Countdown({ wedding }: Props) {
  const c = useCountdown(wedding.weddingDate);
  const valid = Number.isFinite(new Date(wedding.weddingDate).getTime());
  const units: Array<[number, string]> = [
    [c.days, "dias"],
    [c.hours, "horas"],
    [c.minutes, "min"],
    [c.seconds, "seg"]
  ];
  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <SunRays className={styles.countSun} />
      <div className={`${styles.wrap} ${styles.countInner}`}>
        <Reveal className={styles.countHead}>
          <p className={`${styles.eyebrow} ${styles.eyebrowOnDark}`}>
            {c.isPast ? "Hoje é o dia" : "Até o pôr do sol"}
          </p>
          <p className={styles.countDate}>{wedding.weddingDateLabel}</p>
        </Reveal>
        {valid && !c.isPast ? (
          <Reveal className={styles.countGrid} delay={0.08}>
            {units.map(([value, label]) => (
              <span key={label} className={styles.countCell}>
                <span className={styles.countNum}>{c.ready ? pad(value) : "–"}</span>
                <span className={styles.countLabel}>{label}</span>
              </span>
            ))}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Galeria */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="sf-gallery">
      <div className={styles.wrap}>
        <Reveal as="header" className={styles.galleryHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="sf-gallery" className={styles.h2}>
            Luz de fim de tarde
          </h2>
        </Reveal>
        <div className={styles.galleryGrid}>
          {images.map((image, i) => (
            <Reveal key={image.id} className={styles.shot} delay={(i % 3) * 0.05} y={14}>
              <button
                type="button"
                className={styles.shotBtn}
                onClick={() => lb.open(i)}
                aria-label={`Abrir foto: ${image.alt}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={900}
                  height={1100}
                  loading="lazy"
                  sizes="(min-width: 900px) 30vw, 50vw"
                  className={styles.shotImg}
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
          close: styles.lbClose,
          nav: styles.lbNav,
          figure: styles.lbFig,
          img: styles.lbImg,
          caption: styles.lbCap
        }}
      />
    </section>
  );
}
