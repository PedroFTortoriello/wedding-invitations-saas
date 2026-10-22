"use client";

import { useRef } from "react";
import Image from "next/image";
import { Gelasio, Open_Sans } from "next/font/google";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, pad, useCountdown } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { DoubleRule, RollingHills, SunRays, WheatStalk } from "@/components/templates/kit/ornaments";
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
  placeLine,
  program,
  splitCouple,
  storyMoments
} from "@/components/templates/kit/utils";
import styles from "./countryside.module.css";

const display = Gelasio({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--cs-display",
  display: "swap"
});

const sans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--cs-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

export function CountrysideTemplate({ wedding }: Props) {
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

      {/* Convite: faixa de palha, texto centrado, um fio de musgo */}
      <section id="convite" className={styles.invite} aria-labelledby="cs-invite">
        <Reveal className={styles.inviteInner}>
          <p className={styles.eyebrow}>O convite</p>
          <h2 id="cs-invite" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <span className={styles.thread} aria-hidden />
          <p className={styles.inviteText}>{wedding.welcomeText}</p>
        </Reveal>
      </section>

      {/* História: capítulos separados por cercas (DoubleRule), foto redonda pequena ao lado do texto */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="cs-story">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.storyHead}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="cs-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
            <div className={styles.chapters}>
              {moments.map((moment, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(moment.headline);
                return (
                  <Reveal as="article" key={moment.id} className={`${styles.chapter} ${img && i % 2 ? styles.chapterFlip : ""} ${img ? "" : styles.chapterNoPhoto}`}>
                    {i > 0 ? <DoubleRule className={styles.fence} /> : null}
                    <div className={styles.chapterRow}>
                      {img ? (
                        <figure className={styles.chapterPhoto}>
                          <Image
                            src={img.src}
                            alt={img.alt}
                            width={640}
                            height={640}
                            loading="lazy"
                            sizes="(min-width: 900px) 240px, 40vw"
                            className={styles.chapterImg}
                          />
                        </figure>
                      ) : (
                        <span className={styles.chapterMark} aria-hidden>
                          {moment.number}
                        </span>
                      )}
                      <div className={styles.chapterText}>
                        {img ? (
                          <span className={styles.chapterNum} aria-hidden>
                            {moment.number}
                          </span>
                        ) : null}
                        <h3 className={styles.chapterTitle}>{moment.title}</h3>
                        {lines.length ? (
                          <p className={styles.chapterHeadline}>
                            {lines.map((line, k) => (
                              <span key={k}>{line}</span>
                            ))}
                          </p>
                        ) : null}
                      </div>
                      {moment.description ? <p className={`${styles.body} ${styles.chapterBody}`}>{moment.description}</p> : null}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação: coluna estreita deslocada à direita, horário em Gelasio terra, fios de palha */}
      {schedule.length ? (
        <section id="programacao" className={styles.schedule} aria-labelledby="cs-schedule">
          <div className={`${styles.wrap} ${styles.scheduleGrid}`}>
            <Reveal as="header" className={styles.scheduleHead}>
              <p className={styles.eyebrow}>O dia</p>
              <h2 id="cs-schedule" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.programList}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.programRow} delay={i * 0.05} y={12}>
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
      ) : null}

      {/* Local: endereço acima, mapa com moldura de palha; cartões de informação logo abaixo */}
      {location || cards.length ? (
        <section id="local" className={styles.place} aria-label="Local e informações">
          <div className={styles.wrap}>
            {location ? (
              <>
                <Reveal as="header" className={styles.placeHead}>
                  <p className={styles.eyebrow}>Onde</p>
                  <h2 className={styles.h2}>{location.venue || location.city}</h2>
                  <p className={styles.placeAddress}>
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
              </>
            ) : null}
            {cards.length ? (
              <ul className={styles.cardList}>
                {cards.map((card, i) => (
                  <Reveal as="li" key={card.id} className={styles.card} delay={i * 0.06}>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    {card.subtitle ? <p className={styles.cardSub}>{card.subtitle}</p> : null}
                    {card.body ? <p className={styles.cardBody}>{card.body}</p> : null}
                  </Reveal>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="cs-gifts">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.giftsHead}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="cs-gifts" className={styles.h2}>
                Um presente para a casa nova
              </h2>
              <p className={styles.lead}>Cada cota vai por Pix direto para o casal, sem taxa no caminho.</p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {photos.length ? <Gallery images={photos} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      {/* Encerramento: foto com colinas de creme sobrepostas na base, texto final em Gelasio */}
      <section className={styles.closing} aria-label="Até lá">
        {wedding.footerImage ? (
          <div className={styles.closingMedia}>
            <Image
              src={wedding.footerImage}
              alt=""
              width={1800}
              height={1000}
              loading="lazy"
              sizes="100vw"
              className={styles.closingImg}
            />
            <RollingHills className={`${styles.closingHills} ${styles.closingHillsBack}`} />
            <RollingHills className={styles.closingHills} />
          </div>
        ) : null}
        <Reveal className={styles.closingText}>
          {!wedding.footerImage ? <WheatStalk className={styles.closingWheat} /> : null}
          <p className={styles.closingQuote}>{wedding.finalText}</p>
          <p className={styles.closingNames}>{wedding.coupleNames}</p>
        </Reveal>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <p className={styles.footerMono}>{wedding.monogram}</p>
          <p className={styles.footerText}>{wedding.footerText}</p>
          <p className={styles.footerMeta}>
            {[wedding.weddingDateLabel, location?.city].filter(Boolean).join(" · ")}
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
  // Três camadas de colinas: a do fundo sobe mais devagar que a da frente (parallax leve).
  const yBack = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const yMid = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const yFront = useTransform(scrollYProgress, [0, 1], ["0%", "4%"]);
  const [first, second] = splitCouple(wedding.coupleNames);
  const place = mainLocation(wedding) ? placeLine(wedding) : "";
  const hasPhoto = Boolean(wedding.heroImage);

  return (
    <section
      id="topo"
      ref={ref}
      className={`${styles.hero} ${hasPhoto ? "" : styles.heroNoPhoto}`}
      aria-label={`Casamento de ${wedding.coupleNames}`}
    >
      <div className={styles.hills} aria-hidden>
        <motion.div className={`${styles.hill} ${styles.hillBack}`} style={reduce ? undefined : { y: yBack }}>
          <RollingHills className={styles.hillSvg} />
        </motion.div>
        <motion.div className={`${styles.hill} ${styles.hillMid}`} style={reduce ? undefined : { y: yMid }}>
          <RollingHills className={styles.hillSvg} />
        </motion.div>
        <motion.div className={`${styles.hill} ${styles.hillFront}`} style={reduce ? undefined : { y: yFront }}>
          <RollingHills className={styles.hillSvg} />
        </motion.div>
      </div>

      <div className={styles.heroInner}>
        <div className={styles.heroText}>
          {!hasPhoto ? <SunRays className={styles.sun} /> : null}
          <p className={`${styles.eyebrow} hero-rise`}>Vamos nos casar</p>
          <h1 className={`${styles.names} hero-rise`} data-scale={nameScale(wedding.coupleNames)} style={{ animationDelay: "120ms" }}>
            <span className={styles.name}>{first}</span>
            {second ? (
              <>
                <em className={styles.amp} aria-hidden>
                  &amp;
                </em>
                <span className={styles.srOnly}> e </span>
                <span className={styles.name}>{second}</span>
              </>
            ) : null}
          </h1>
          <p className={`${styles.heroDate} hero-rise`} style={{ animationDelay: "240ms" }}>
            <WheatStalk className={styles.wheat} />
            <span className={styles.heroDateText}>
              {wedding.weddingDateLabel}
              {wedding.weddingTime ? <span className={styles.heroTime}>{wedding.weddingTime}</span> : null}
            </span>
            <WheatStalk className={`${styles.wheat} ${styles.wheatMirror}`} />
          </p>
          {place ? (
            <p className={`${styles.heroPlace} hero-rise`} style={{ animationDelay: "300ms" }}>
              {place}
            </p>
          ) : null}
          {wedding.rsvp.enabled ? (
            <a href="#confirmar" className={`${styles.btn} ${styles.heroBtn} hero-rise`} style={{ animationDelay: "360ms" }}>
              Confirmar presença
            </a>
          ) : null}
        </div>

        {hasPhoto ? (
          <figure className={`${styles.heroPhoto} hero-rise`} style={{ animationDelay: "200ms" }}>
            <span className={styles.heroPhotoRing}>
              <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 900px) 34vw, 70vw" className={styles.heroImg} />
            </span>
          </figure>
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
    [c.minutes, "minutos"],
    [c.seconds, "segundos"]
  ];
  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <WheatStalk className={`${styles.countWheat} ${styles.countWheatL}`} />
      <WheatStalk className={`${styles.countWheat} ${styles.countWheatR}`} />
      <Reveal className={`${styles.wrap} ${styles.countInner}`}>
        <p className={`${styles.eyebrow} ${styles.eyebrowOnMoss}`}>{c.isPast ? "Hoje é o dia" : valid ? "Falta pouco" : "O grande dia"}</p>
        {valid && !c.isPast ? (
          <div className={styles.countGrid}>
            {units.map(([value, label]) => (
              <span key={label} className={styles.countCell}>
                <span className={styles.countNum}>{c.ready ? pad(value) : "–"}</span>
                <span className={styles.countLabel}>{label}</span>
              </span>
            ))}
          </div>
        ) : null}
        <p className={styles.countDate}>
          {wedding.weddingDateLabel}
          {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
        </p>
      </Reveal>
    </section>
  );
}

/* --------------------------------------------------------------- Galeria */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="cs-gallery">
      <div className={styles.wrap}>
        <Reveal as="header" className={styles.galleryHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="cs-gallery" className={styles.h2}>
            Dias de sol
          </h2>
        </Reveal>
        <div className={styles.galleryGrid}>
          {images.map((image, i) => (
            <Reveal key={image.id} className={`${styles.shot} ${i % 5 === 0 ? styles.shotWide : ""}`} delay={(i % 3) * 0.05} y={14}>
              <button type="button" className={styles.shotBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${image.alt}`}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={900}
                  height={900}
                  loading="lazy"
                  sizes="(min-width: 900px) 33vw, 50vw"
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
