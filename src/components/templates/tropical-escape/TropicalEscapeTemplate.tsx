"use client";

import Image from "next/image";
import { Albert_Sans, DM_Serif_Display } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, pad, useCountdown } from "@/components/templates/shared/motion";
import { useMenu, useScrolled } from "@/components/templates/kit/hooks";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
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
import styles from "./tropical-escape.module.css";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--tr-display",
  display: "swap"
});

const sans = Albert_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--tr-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

const NAV = [
  ["#convite", "Convite"],
  ["#historia", "História"],
  ["#programacao", "O dia"],
  ["#local", "Local"],
  ["#presentes", "Presentes"],
  ["#galeria", "Galeria"],
  ["#confirmar", "Confirmar"]
] as const;

export function TropicalEscapeTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gifts = activeGifts(wedding);
  const photos = galleryRest(wedding);
  const anchors = new Set<string>(["#convite"]);
  if (moments.length) anchors.add("#historia");
  if (schedule.length) anchors.add("#programacao");
  if (location) anchors.add("#local");
  if (gifts.length) anchors.add("#presentes");
  if (photos.length) anchors.add("#galeria");
  if (wedding.rsvp.enabled) anchors.add("#confirmar");

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template}`}>
      <Nav wedding={wedding} links={NAV.filter(([href]) => anchors.has(href))} />
      <Hero wedding={wedding} location={location} />

      {/* Convite: faixa de areia, coluna estreita centrada, folha pequena como separador. */}
      <section id="convite" className={styles.invite} aria-labelledby="tr-invite">
        <Reveal className={styles.inviteInner}>
          <p className={styles.eyebrow}>Convite</p>
          <h2 id="tr-invite" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <PalmFrond className={styles.leafSmall} />
          <p className={styles.inviteText}>{wedding.welcomeText}</p>
        </Reveal>
      </section>

      {moments.length ? <Story wedding={wedding} moments={moments} /> : null}

      <Countdown wedding={wedding} />

      {schedule.length ? (
        <section id="programacao" className={styles.schedule} aria-labelledby="tr-schedule">
          <div className={`${styles.wrap} ${styles.scheduleGrid}`}>
            <Reveal className={styles.scheduleHead}>
              <p className={styles.eyebrow}>Programação</p>
              <h2 id="tr-schedule" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.timeline}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.slot} delay={i * 0.05} y={12}>
                  <span className={styles.slotTime}>{item.time}</span>
                  <span className={styles.slotBody}>
                    <span className={styles.slotTitle}>{item.title}</span>
                    {item.note ? <span className={styles.slotNote}>{item.note}</span> : null}
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {location ? (
        <section id="local" className={styles.place} aria-labelledby="tr-place">
          <div className={styles.wrap}>
            <Reveal className={styles.placeHead}>
              <p className={styles.eyebrow}>O local</p>
              <h2 id="tr-place" className={styles.h2}>
                {location.venue || location.city}
              </h2>
              {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
              <div className={styles.placeText}>
                {location.address ? <p className={styles.body}>{location.address}</p> : null}
                {location.note ? <p className={styles.body}>{location.note}</p> : null}
              </div>
              <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
                Abrir no Google Maps
              </a>
            </Reveal>
            <Reveal className={styles.mapFrame} y={20} delay={0.08}>
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
      ) : null}

      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={`${styles.wrap} ${styles.cardsGrid}`}>
            {cards.map((card, i) => (
              <Reveal as="article" key={card.id} className={styles.card} delay={i * 0.06} y={14}>
                <MonsteraLeaf className={styles.cardLeaf} />
                <h3 className={styles.cardTitle}>{card.title}</h3>
                {card.subtitle ? <p className={styles.cardSub}>{card.subtitle}</p> : null}
                {card.body ? <p className={styles.body}>{card.body}</p> : null}
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="tr-gifts">
          <div className={styles.wrap}>
            <Reveal className={styles.giftsHead}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="tr-gifts" className={styles.h2}>
                Um presente para a vida a dois
              </h2>
              <p className={styles.lead}>Cada cota é um Pix direto para o casal, sem taxas e sem intermediários.</p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {photos.length ? <Gallery images={photos} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      <Closing wedding={wedding} />
      <Footer wedding={wedding} location={location} />
    </main>
  );
}

/* --------------------------------------------------------------------- nav */

function Nav({ wedding, links }: Props & { links: ReadonlyArray<readonly [string, string]> }) {
  const scrolled = useScrolled(40);
  const [open, toggle, close] = useMenu();

  return (
    <header className={`${styles.nav} ${scrolled || open ? styles.navSolid : ""}`}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <a href="#top" className={styles.navMono} aria-label={wedding.coupleNames}>
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

/* -------------------------------------------------------------------- capa */

function Hero({ wedding, location }: Props & { location: ReturnType<typeof mainLocation> }) {
  const [a, b] = splitCouple(wedding.coupleNames);
  const photo = Boolean(wedding.heroImage);
  const place = location ? [location.venue, location.city].filter(Boolean).join(", ") : "";

  return (
    <section id="top" className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <div className={`${styles.wrap} ${styles.heroGrid}`}>
        <div className={styles.heroText}>
          <p className={`${styles.heroEyebrow} hero-rise`}>Vamos nos casar</p>
          <h1
            className={`${styles.heroNames} hero-rise`}
            data-scale={nameScale(wedding.coupleNames)}
            style={{ animationDelay: "120ms" }}
          >
            <span className={styles.heroName}>{a}</span>
            {b ? (
              <>
                <span className={styles.heroAmp} aria-hidden>
                  &amp;
                </span>
                <span className={styles.heroName}>{b}</span>
              </>
            ) : null}
          </h1>
          <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "240ms" }}>
            <span>{wedding.weddingDateLabel}</span>
            {wedding.weddingTime ? <span>{wedding.weddingTime}</span> : null}
            {place ? <span>{place}</span> : null}
          </p>
          <a href="#convite" className={`${styles.heroLink} hero-rise`} style={{ animationDelay: "320ms" }}>
            Ver o convite
          </a>
        </div>

        {/* Recorte orgânico com as folhas saindo de trás; sem foto, bloco verde-mar com o monograma. */}
        <div className={`${styles.heroArt} hero-rise`} style={{ animationDelay: "160ms" }}>
          <PalmFrond className={`${styles.heroPalm} ${styles.sway}`} />
          <MonsteraLeaf className={`${styles.heroMonstera} ${styles.swayAlt}`} />
          <div className={`${styles.blob} ${photo ? "" : styles.blobPlain}`}>
            {photo ? (
              <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 900px) 60vw, 100vw" className={styles.blobImg} />
            ) : (
              <span className={styles.blobMono} aria-hidden>
                {wedding.monogram}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- história */

function Story({ wedding, moments }: Props & { moments: WeddingSite["storyMoments"] }) {
  return (
    <section id="historia" className={styles.story} aria-labelledby="tr-story">
      <div className={styles.wrap}>
        <Reveal className={styles.storyHead}>
          <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
          <h2 id="tr-story" className={styles.h2}>
            {wedding.storyTitle}
          </h2>
        </Reveal>
        <div className={styles.chapters}>
          {moments.map((moment, i) => {
            const img = storyImage(wedding.gallery, i);
            const lines = headlineLines(moment.headline);
            return (
              <article
                key={moment.id}
                className={`${styles.chapter} ${i % 2 ? styles.chapterAlt : ""} ${img ? "" : styles.chapterText}`}
                data-shape={i % 3}
              >
                {img ? (
                  <Reveal className={styles.chapterMedia} y={20}>
                    <Image
                      src={img.src}
                      alt={img.alt}
                      width={1000}
                      height={1250}
                      loading="lazy"
                      sizes="(min-width: 900px) 42vw, 100vw"
                      className={styles.chapterImg}
                    />
                  </Reveal>
                ) : null}
                <Reveal className={styles.chapterBody} delay={0.08}>
                  <span className={styles.chapterNum} aria-hidden>
                    {moment.number}
                  </span>
                  <p className={styles.chapterKicker}>{moment.title}</p>
                  {lines.length ? (
                    <h3 className={styles.chapterTitle}>
                      {lines.map((line, k) => (
                        <span key={k} className={styles.line}>
                          {line}
                        </span>
                      ))}
                    </h3>
                  ) : null}
                  {moment.description ? <p className={styles.body}>{moment.description}</p> : null}
                </Reveal>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- contagem */

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
      <PalmFrond className={styles.countPalm} />
      <MonsteraLeaf className={styles.countMonstera} />
      <div className={`${styles.wrap} ${styles.countInner}`}>
        <Reveal className={styles.countHead}>
          <p className={styles.countEyebrow}>{valid && c.isPast ? "Chegou o dia" : "Contagem regressiva"}</p>
          <p className={styles.countDate}>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </p>
        </Reveal>
        {valid && !c.isPast ? (
          <Reveal className={styles.countGrid} delay={0.08}>
            {units.map(([value, label]) => (
              <div key={label} className={styles.countCell}>
                <span className={styles.countNum}>{c.ready ? pad(value) : "--"}</span>
                <span className={styles.countLabel}>{label}</span>
              </div>
            ))}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ galeria */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="tr-gallery">
      <div className={styles.wrap}>
        <Reveal className={styles.galleryHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="tr-gallery" className={styles.h2}>
            Luz, brisa e nós dois
          </h2>
        </Reveal>
        <div className={styles.galleryGrid}>
          {images.map((image, i) => (
            <Reveal key={image.id} className={styles.galleryItem} delay={(i % 3) * 0.05} y={14}>
              <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${image.alt}`}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={800}
                  height={1000}
                  loading="lazy"
                  sizes="(min-width: 900px) 33vw, 50vw"
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
          caption: styles.lightboxCaption
        }}
      />
    </section>
  );
}

/* ------------------------------------------------------------- encerramento */

function Closing({ wedding }: Props) {
  const photo = Boolean(wedding.footerImage);
  return (
    <section className={`${styles.closing} ${photo ? styles.closingPhoto : ""}`} aria-label="Mensagem final">
      <div className={`${styles.wrap} ${styles.closingGrid}`}>
        {photo ? (
          <Reveal className={styles.closingArt} y={20}>
            <MonsteraLeaf className={`${styles.closingMonstera} ${styles.swayAlt}`} />
            <div className={styles.closingBlob}>
              <Image src={wedding.footerImage} alt="" width={1000} height={1250} loading="lazy" sizes="(min-width: 900px) 44vw, 100vw" className={styles.closingImg} />
            </div>
            <PalmFrond className={`${styles.closingPalm} ${styles.sway}`} />
          </Reveal>
        ) : (
          <PalmFrond className={styles.closingPalmPlain} />
        )}
        <Reveal className={styles.closingBody} delay={0.08}>
          <p className={styles.eyebrow}>Até lá</p>
          <p className={styles.closingText}>{wedding.finalText}</p>
        </Reveal>
      </div>
    </section>
  );
}

function Footer({ wedding, location }: Props & { location: ReturnType<typeof mainLocation> }) {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.wrap} ${styles.footerInner}`}>
        <p className={styles.footerMono}>{wedding.monogram}</p>
        <p className={styles.footerNames}>{wedding.coupleNames}</p>
        {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
        <p className={styles.footerMeta}>
          {wedding.weddingDateLabel}
          {location?.city ? ` · ${location.city}` : ""}
        </p>
        <p className={styles.footerCredit}>Feito com Noivar</p>
      </div>
    </footer>
  );
}
