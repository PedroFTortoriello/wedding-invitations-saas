"use client";

import Image from "next/image";
import { Italiana, Montserrat } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
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
import styles from "./black-tie.module.css";

/* Italiana só existe em 400 (font-data.json); Montserrat em 300/400/500/600. */
const display = Italiana({ subsets: ["latin"], weight: "400", variable: "--bt-display", display: "swap" });
const sans = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--bt-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

export function BlackTieTemplate({ wedding }: Props) {
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
      {location ? <Location location={location} /> : null}
      {cards.length ? <Cards cards={cards} /> : null}
      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="gifts-title">
          <div className={styles.wrap}>
            <Reveal className={styles.head}>
              <p className={styles.eyebrow}>Lista de presentes</p>
              <h2 id="gifts-title" className={styles.h2}>
                Um gesto para a vida a dois
              </h2>
              <p className={styles.lead}>
                Cada presente é um Pix direto na chave do casal: cem por cento para eles, sem
                taxas e sem intermediários.
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
  const solid = useScrolled(80);
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
  const place = location ? [location.venue, location.city].filter(Boolean).join(", ") : "";
  const meta = [wedding.weddingDateLabel, wedding.weddingTime, place].filter(Boolean);

  return (
    <section id="top" className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <p className={`${styles.heroKicker} hero-rise`}>Casamento</p>
      <h1 className={styles.heroNames} data-scale={nameScale(wedding.coupleNames)}>
        <span className={`${styles.heroName} hero-rise`} style={{ animationDelay: "120ms" }}>
          {first}
        </span>
        {second ? (
          <>
            <span className={`${styles.heroAmp} hero-rise`} style={{ animationDelay: "260ms" }} aria-hidden>
              &amp;
            </span>
            <span className={`${styles.heroName} hero-rise`} style={{ animationDelay: "380ms" }}>
              {second}
            </span>
          </>
        ) : null}
      </h1>
      <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "520ms" }}>
        {meta.map((item, i) => (
          <span key={i} className={styles.heroMetaItem}>
            {i > 0 ? <span className={styles.dot} aria-hidden /> : null}
            {item}
          </span>
        ))}
      </p>
      <span className={`${styles.goldRule} hero-rise`} style={{ animationDelay: "640ms" }} aria-hidden />
    </section>
  );
}

/* -------------------------------------------------------------- Convite */

function Invite({ wedding }: Props) {
  const photo = wedding.heroImage;
  return (
    <section id="convite" className={`${styles.invite} ${photo ? "" : styles.inviteNoPhoto}`} aria-labelledby="invite-title">
      {photo ? (
        <Reveal as="figure" className={styles.inviteMedia} y={0}>
          <Image src={photo} alt="" fill priority sizes="(min-width: 900px) 50vw, 100vw" className={styles.bw} />
        </Reveal>
      ) : null}
      <Reveal className={styles.inviteBody}>
        <p className={styles.eyebrow}>O convite</p>
        <h2 id="invite-title" className={styles.inviteWords}>
          {wedding.invitationWords.join(" ")}
        </h2>
        <p className={styles.inviteText}>{wedding.welcomeText}</p>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------- História */

function Story({ wedding, moments }: Props & { moments: WeddingSite["storyMoments"] }) {
  return (
    <section id="historia" className={styles.story} aria-labelledby="story-title">
      <div className={styles.wrap}>
        <Reveal className={styles.storyHead}>
          <p className={`${styles.eyebrow} ${styles.onDark}`}>{wedding.storyEyebrow}</p>
          <h2 id="story-title" className={styles.h2}>
            {wedding.storyTitle}
          </h2>
        </Reveal>
        <div className={styles.chapters}>
          {moments.map((moment, i) => {
            const img = storyImage(wedding.gallery, i);
            const lines = headlineLines(moment.headline);
            return (
              <Reveal as="article" key={moment.id} className={`${styles.chapter} ${i % 2 ? styles.chapterAlt : ""}`} y={20}>
                <span className={styles.numeral} aria-hidden>
                  {moment.number}
                </span>
                <div className={styles.chapterBody}>
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
                {img ? (
                  <figure className={styles.chapterMedia}>
                    <Image src={img.src} alt={img.alt} fill loading="lazy" sizes="(min-width: 900px) 220px, 40vw" className={styles.bw} />
                  </figure>
                ) : null}
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
  const units: [string, string][] = [
    [c.ready ? String(c.days).padStart(3, "0") : "000", c.days === 1 ? "dia" : "dias"],
    [c.ready ? pad(c.hours) : "00", "horas"],
    [c.ready ? pad(c.minutes) : "00", "min"]
  ];

  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <Reveal className={styles.wrap}>
        <p className={styles.eyebrow}>{c.isPast ? "Chegou o dia" : valid ? "Faltam" : "A data"}</p>
        {valid && !c.isPast ? (
          <p className={styles.countLine}>
            {units.map(([value, label], i) => (
              <span key={label} className={styles.countUnit}>
                {i > 0 ? (
                  <span className={styles.countSep} aria-hidden>
                    ·
                  </span>
                ) : null}
                <span className={styles.countNum}>{value}</span> {label}
              </span>
            ))}
          </p>
        ) : (
          <p className={styles.countLine}>{c.isPast ? "Hoje é o grande dia" : wedding.weddingDateLabel || "Em breve"}</p>
        )}
        {valid ? (
          <p className={styles.countFoot}>
            {[wedding.weddingDateLabel, wedding.weddingTime].filter(Boolean).join(" · ")}
          </p>
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
        <Reveal as="ol" className={styles.table} delay={0.08}>
          {schedule.map((item) => (
            <li key={item.id} className={styles.row}>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{item.title}</span>
                {item.note ? <span className={styles.rowNote}>{item.note}</span> : null}
              </span>
              <span className={styles.rowTime}>{item.time}</span>
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
      <div className={`${styles.wrap} ${styles.placeGrid}`}>
        <Reveal className={styles.placeBody}>
          <p className={`${styles.eyebrow} ${styles.onDark}`}>O local</p>
          <h2 id="place-title" className={styles.h2}>
            {location.venue || location.city}
          </h2>
          {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
          {location.address ? <p className={styles.placeText}>{location.address}</p> : null}
          {location.note ? <p className={styles.placeText}>{location.note}</p> : null}
          <a className={styles.btnGhost} href={mapLink(location)} target="_blank" rel="noreferrer">
            Abrir no Google Maps
          </a>
        </Reveal>
        <Reveal className={styles.mapFrame} delay={0.08} y={24}>
          <iframe
            className={styles.map}
            src={mapEmbedUrl(location)}
            title={`Mapa — ${location.venue || location.city}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
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
            {card.image ? (
              <figure className={styles.cardMedia}>
                <Image src={card.image} alt="" fill loading="lazy" sizes="(min-width: 900px) 30vw, 100vw" className={styles.bw} />
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
          <p className={`${styles.eyebrow} ${styles.onDark}`}>Galeria</p>
          <h2 id="gallery-title" className={styles.h2}>
            Retratos
          </h2>
        </Reveal>
      </div>
      <div className={styles.galleryGrid}>
        {images.map((image, i) => (
          <Reveal key={image.id} delay={(i % 4) * 0.05} y={14}>
            <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${image.alt}`}>
              <Image
                src={image.src}
                alt={image.alt}
                width={900}
                height={1200}
                loading="lazy"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className={styles.galleryImg}
              />
            </button>
          </Reveal>
        ))}
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
          <span className={styles.goldRule} aria-hidden />
          <p className={styles.finalText}>{wedding.finalText}</p>
        </Reveal>
        {photo ? (
          <Reveal as="figure" className={styles.finalMedia} delay={0.1} y={24}>
            <Image src={photo} alt="" fill loading="lazy" sizes="(min-width: 900px) 30vw, 60vw" className={styles.bw} />
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
      <div className={`${styles.wrap} ${styles.footerInner}`}>
        <p className={styles.footerMono}>{wedding.monogram}</p>
        <p className={styles.footerNames}>{wedding.coupleNames}</p>
        {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
        <p className={styles.footerMeta}>
          {[wedding.weddingDateLabel, location?.city].filter(Boolean).join(" · ")}
        </p>
        <p className={styles.footerCredit}>Feito com Noivar</p>
      </div>
    </footer>
  );
}
