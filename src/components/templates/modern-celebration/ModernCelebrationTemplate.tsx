"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { Bricolage_Grotesque, Rubik } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { useMenu, useScrolled } from "@/components/templates/kit/hooks";
import { TileAzulejo } from "@/components/templates/kit/ornaments";
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
  storyMoments,
  weddingYear
} from "@/components/templates/kit/utils";
import { tilePattern } from "./tile";
import styles from "./modern-celebration.module.css";

/* Bricolage variável com o eixo óptico (opsz só existe com weight "variable"); 500/700 via font-weight. */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  variable: "--mc-display",
  display: "swap"
});
const sans = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--mc-sans",
  display: "swap"
});

/* O padrão entra por variável inline (CSS module não importa TS); a cor é o cobalto do modelo. */
const PATTERN_VARS = { "--mc-tile": tilePattern("#2457a6") } as CSSProperties;

type Props = { wedding: WeddingSite };

export function ModernCelebrationTemplate({ wedding }: Props) {
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
    <main className={`${display.variable} ${sans.variable} ${styles.template}`} style={PATTERN_VARS}>
      <Nav wedding={wedding} items={nav} />
      <Hero wedding={wedding} />
      <Invite wedding={wedding} />
      {moments.length ? <Story wedding={wedding} moments={moments} /> : null}
      <Countdown wedding={wedding} />
      {schedule.length ? <Program wedding={wedding} schedule={schedule} /> : null}
      {location ? <Location location={location} /> : null}
      {cards.length ? <Cards cards={cards} /> : null}
      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="gifts-title">
          <div className={styles.wrap}>
            <Reveal className={styles.giftsHead}>
              <p className={styles.eyebrow}>Lista de presentes</p>
              <h2 id="gifts-title" className={styles.h2}>
                Um presente para a casa nova
              </h2>
              <p className={styles.lead}>
                Cada cota vira um Pix direto na chave do casal: cem por cento para eles, sem taxas e
                sem intermediários.
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
    <header className={`${styles.nav} ${solid ? styles.navSolid : ""}`}>
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
  const [first, second] = splitCouple(wedding.coupleNames);
  const location = mainLocation(wedding);
  const year = weddingYear(wedding);
  const photo = wedding.heroImage;
  const when = [wedding.weddingDateLabel, wedding.weddingTime].filter(Boolean).join(" · ");
  const where = location ? [location.venue, location.city].filter(Boolean).join(" · ") : "";

  return (
    <section
      id="top"
      className={`${styles.hero} ${photo ? "" : styles.heroNoPhoto}`}
      aria-label={`Casamento de ${wedding.coupleNames}`}
    >
      <div className={styles.heroPattern} aria-hidden />
      <div className={`${styles.wrap} ${styles.heroGrid}`}>
        <div className={styles.heroText}>
          {year ? (
            <span className={`${styles.yearBlock} hero-rise`} aria-label={`Ano ${year}`}>
              {year}
            </span>
          ) : null}
          <h1 className={styles.heroNames} data-scale={nameScale(wedding.coupleNames)}>
            <span className={`${styles.heroName} hero-rise`} style={{ animationDelay: "120ms" }}>
              {first}
            </span>
            {second ? (
              <span className={`${styles.heroName} hero-rise`} style={{ animationDelay: "240ms" }}>
                <span className={styles.heroAmp} aria-hidden>
                  &amp;
                </span>{" "}
                {second}
              </span>
            ) : null}
          </h1>
          <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "380ms" }}>
            {when ? <span className={styles.heroMetaLine}>{when}</span> : null}
            {where ? <span className={styles.heroMetaLine}>{where}</span> : null}
            {!when && !where ? <span className={styles.heroMetaLine}>Em breve</span> : null}
          </p>
        </div>
        {photo ? (
          <figure className={`${styles.heroMedia} hero-rise`} style={{ animationDelay: "200ms" }}>
            <Image src={photo} alt="" fill priority sizes="(min-width: 900px) 44vw, 100vw" className={styles.cover} />
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
        <Reveal className={styles.inviteSide}>
          <p className={`${styles.eyebrow} ${styles.onBlue}`}>O convite</p>
          <span className={styles.mustardRule} aria-hidden />
        </Reveal>
        <Reveal className={styles.inviteBody} delay={0.08}>
          <h2 id="invite-title" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          {wedding.welcomeText ? <p className={styles.inviteText}>{wedding.welcomeText}</p> : null}
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
      </div>
      {moments.map((moment, i) => {
        const img = storyImage(wedding.gallery, i);
        const lines = headlineLines(moment.headline);
        const alt = i % 2 === 1;
        return (
          <article key={moment.id} className={`${styles.chapter} ${alt ? styles.chapterAlt : ""} ${img ? "" : styles.chapterNoPhoto}`}>
            <div className={`${styles.wrap} ${styles.chapterGrid}`}>
              <Reveal className={styles.chapterBody} y={20}>
                <span className={styles.tileNum} aria-hidden>
                  <TileAzulejo className={styles.tileNumSvg} />
                  <span className={styles.tileNumText}>{moment.number}</span>
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
              </Reveal>
              {img ? (
                <Reveal as="figure" className={styles.chapterMedia} delay={0.08} y={24}>
                  <Image src={img.src} alt={img.alt} fill loading="lazy" sizes="(min-width: 900px) 46vw, 100vw" className={styles.cover} />
                </Reveal>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}

/* ------------------------------------------------------------- Contagem */

function Countdown({ wedding }: Props) {
  const c = useCountdown(wedding.weddingDate);
  const valid = Number.isFinite(new Date(wedding.weddingDate).getTime());
  const units: [string, string][] = [
    [c.ready ? String(c.days) : "0", c.days === 1 ? "dia" : "dias"],
    [c.ready ? pad(c.hours) : "00", "horas"],
    [c.ready ? pad(c.minutes) : "00", "min"],
    [c.ready ? pad(c.seconds) : "00", "seg"]
  ];

  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <div className={`${styles.wrap} ${styles.countGrid}`}>
        <Reveal className={styles.countHead}>
          <p className={styles.eyebrow}>Contagem regressiva</p>
          <h2 className={styles.h2}>{c.isPast ? "Chegou o dia" : valid ? "Faltam" : wedding.weddingDateLabel || "Em breve"}</h2>
          {valid ? (
            <p className={styles.countFoot}>{[wedding.weddingDateLabel, wedding.weddingTime].filter(Boolean).join(" · ")}</p>
          ) : null}
        </Reveal>
        {valid && !c.isPast ? (
          <Reveal className={styles.countCells} delay={0.08}>
            {units.map(([value, label]) => (
              <span key={label} className={styles.countCell}>
                <TileAzulejo className={styles.countTile} />
                <span className={styles.countNum}>{value}</span>
                <span className={styles.countLabel}>{label}</span>
              </span>
            ))}
          </Reveal>
        ) : null}
      </div>
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
        <Reveal as="ol" className={styles.rows} delay={0.08}>
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

function Location({ location }: { location: NonNullable<ReturnType<typeof mainLocation>> }) {
  return (
    <section id="local" className={styles.place} aria-labelledby="place-title">
      <div className={styles.wrap}>
        <Reveal className={styles.placeHead}>
          <div className={styles.placeText}>
            <p className={styles.eyebrow}>O local</p>
            <h2 id="place-title" className={styles.h2}>
              {location.venue || location.city}
            </h2>
            {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
          </div>
          <div className={styles.placeInfo}>
            {location.address ? <p className={styles.body}>{location.address}</p> : null}
            {location.note ? <p className={styles.body}>{location.note}</p> : null}
            <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
              Abrir no Google Maps
            </a>
          </div>
        </Reveal>
        <Reveal className={styles.mapFrame} delay={0.08} y={24}>
          <iframe
            className={styles.map}
            src={mapEmbedUrl(location)}
            title={`Mapa: ${location.venue || location.city}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Cartões */

const CARD_TILES = [styles.tileBlue, styles.tileCoral, styles.tileMustard];

function Cards({ cards }: { cards: WeddingSite["detailCards"] }) {
  return (
    <section id="informacoes" className={styles.cards} aria-label="Informações">
      <div className={`${styles.wrap} ${styles.cardsGrid}`}>
        {cards.map((card, i) => (
          <Reveal as="article" key={card.id} className={styles.card} delay={i * 0.07} y={18}>
            <span className={`${styles.cardTile} ${CARD_TILES[i % 3]}`} style={{ transform: `rotate(${(i % 3) * 45}deg)` }} aria-hidden>
              <TileAzulejo />
            </span>
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
      <div className={styles.strip} aria-hidden />
      <div className={styles.wrap}>
        <Reveal className={styles.galleryHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="gallery-title" className={styles.h2}>
            Nós dois em fotos
          </h2>
        </Reveal>
        <div className={styles.galleryGrid}>
          {images.map((image, i) => (
            <Reveal key={image.id} delay={(i % 3) * 0.05} y={14}>
              <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${image.alt}`}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={900}
                  height={1100}
                  loading="lazy"
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 50vw"
                  className={styles.galleryImg}
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
      <div className={`${styles.wrap} ${styles.finalGrid}`}>
        <Reveal className={styles.finalBody}>
          <span className={styles.mustardRule} aria-hidden />
          <p className={styles.finalText}>{wedding.finalText}</p>
          <p className={styles.finalNames}>{wedding.coupleNames}</p>
        </Reveal>
        {photo ? (
          <Reveal as="figure" className={styles.finalMedia} delay={0.1} y={24}>
            <Image src={photo} alt="" fill loading="lazy" sizes="(min-width: 900px) 40vw, 100vw" className={styles.cover} />
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Rodapé */

function Footer({ wedding, location }: Props & { location: ReturnType<typeof mainLocation> }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.strip} aria-hidden />
      <div className={`${styles.wrap} ${styles.footerInner}`}>
        <p className={styles.footerMono}>{wedding.monogram}</p>
        <div>
          <p className={styles.footerNames}>{wedding.coupleNames}</p>
          <p className={styles.footerMeta}>{[wedding.weddingDateLabel, location?.city].filter(Boolean).join(" · ")}</p>
        </div>
        {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
        <p className={styles.footerCredit}>Feito com Noivar</p>
      </div>
    </footer>
  );
}
