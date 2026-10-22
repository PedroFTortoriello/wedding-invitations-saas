"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Tenor_Sans, Cormorant_Garamond } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { useMenu } from "@/components/templates/kit/hooks";
import {
  Arch,
  Diamond,
  EucalyptusSprig,
  Flourish,
  OrangeBlossom,
  StarSpark,
  WildflowerCluster
} from "@/components/templates/kit/ornaments";
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
import styles from "./fine-line.module.css";

const sans = Tenor_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--fl-sans",
  display: "swap"
});

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--fl-serif",
  display: "swap"
});

type Props = { wedding: WeddingSite };

const NAV = [
  ["#convite", "Convite"],
  ["#historia", "História"],
  ["#programa", "Programa"],
  ["#local", "Local"],
  ["#presentes", "Presentes"],
  ["#galeria", "Galeria"],
  ["#confirmar", "Confirmar"]
] as const;

/** Céu de estrelas da capa: posições fixas (%), tamanho em px. */
const HERO_STARS: ReadonlyArray<[number, number, number]> = [
  [8, 14, 18],
  [22, 7, 10],
  [84, 10, 14],
  [93, 26, 9],
  [4, 44, 11],
  [95, 52, 16],
  [14, 70, 9],
  [87, 76, 11]
];

/** Estrelas em volta do arco do encerramento. */
const CLOSING_STARS: ReadonlyArray<[number, number, number]> = [
  [-10, 6, 16],
  [104, 14, 11],
  [-14, 48, 9],
  [108, 58, 14],
  [-6, 86, 10]
];

const CARD_ORNAMENTS = [OrangeBlossom, EucalyptusSprig, Diamond] as const;

export function FineLineTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gallery = galleryRest(wedding);
  const hasGifts = activeGifts(wedding).length > 0;

  return (
    <main className={`${sans.variable} ${serif.variable} ${styles.template}`}>
      <Nav wedding={wedding} />
      <Hero wedding={wedding} />

      {/* Convite: coluna estreita, centrada, com um florão de traço */}
      <section id="convite" className={styles.invite} aria-labelledby="fl-invite">
        <Reveal className={styles.inviteInner} y={12}>
          <Flourish className={`${styles.ink} ${styles.flourish}`} />
          <p className={styles.eyebrow}>Convite</p>
          <h2 id="fl-invite" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <p className={styles.body}>{wedding.welcomeText}</p>
        </Reveal>
      </section>

      {/* História: capítulos com a foto num arco menor e o numeral em itálico ao lado */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="fl-story">
          <div className={styles.wrap}>
            <Reveal className={styles.storyHead} y={12}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="fl-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
            <div className={styles.chapters}>
              {moments.map((m, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(m.headline);
                return (
                  <Reveal as="article" key={m.id} className={`${styles.chapter} ${i % 2 ? styles.chapterAlt : ""}`} y={16}>
                    <div className={styles.chapterArch}>
                      <ArchFrame className={styles.chapterFrame}>
                        {img ? (
                          <Image
                            src={img.src}
                            alt={img.alt}
                            fill
                            loading="lazy"
                            sizes="(min-width: 860px) 32vw, 64vw"
                            className={styles.archImg}
                          />
                        ) : (
                          <span className={styles.archNum} aria-hidden>
                            {m.number}
                          </span>
                        )}
                      </ArchFrame>
                      {img ? (
                        <span className={styles.chapterNum} aria-hidden>
                          {m.number}
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.chapterText}>
                      <p className={styles.eyebrow}>
                        <span className={styles.srOnly}>Capítulo {m.number}: </span>
                        {m.title}
                      </p>
                      {lines.length ? (
                        <h3 className={styles.chapterHeadline}>
                          {lines.map((line, k) => (
                            <span key={k} className={styles.line}>
                              {line}
                            </span>
                          ))}
                        </h3>
                      ) : null}
                      <p className={styles.body}>{m.description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação: título à esquerda, lista com estrela como marcador à direita */}
      {schedule.length ? (
        <section id="programa" className={styles.program} aria-labelledby="fl-program">
          <div className={`${styles.wrap} ${styles.programGrid}`}>
            <Reveal className={styles.programHead} y={12}>
              <p className={styles.eyebrow}>Programa</p>
              <h2 id="fl-program" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.body}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.programList}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.programItem} y={10} delay={i * 0.05}>
                  <StarSpark className={`${styles.ink} ${styles.programStar}`} />
                  <span className={styles.programTime}>{item.time}</span>
                  <span className={styles.programBody}>
                    <span className={styles.programTitle}>{item.title}</span>
                    {item.note ? <span className={styles.programNote}>{item.note}</span> : null}
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Local: mapa em preto e branco numa moldura de traço, endereço abaixo */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="fl-place">
          <div className={styles.wrap}>
            <Reveal className={styles.mapFrame} y={12}>
              <iframe
                className={styles.map}
                src={mapEmbedUrl(location)}
                title={`Mapa: ${location.venue || location.city}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Reveal>
            <Reveal className={styles.placeInfo} y={12} delay={0.06}>
              <div className={styles.placeMain}>
                <p className={styles.eyebrow}>Local</p>
                <h2 id="fl-place" className={styles.h2}>
                  {location.venue || location.city}
                </h2>
                {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
              </div>
              <div className={styles.placeAside}>
                {location.address ? <p className={styles.body}>{location.address}</p> : null}
                {location.note ? <p className={styles.body}>{location.note}</p> : null}
                <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
                  Abrir no mapa
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Cartões: três blocos, cada um com um ornamento linear diferente */}
      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={`${styles.wrap} ${styles.cardsGrid}`}>
            {cards.map((card, i) => {
              const Ornament = CARD_ORNAMENTS[i % CARD_ORNAMENTS.length];
              return (
                <Reveal as="article" key={card.id} className={styles.card} y={12} delay={i * 0.06}>
                  <Ornament className={`${styles.ink} ${styles.cardOrnament}`} />
                  {card.subtitle ? <p className={styles.eyebrow}>{card.subtitle}</p> : null}
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  {card.body ? <p className={styles.body}>{card.body}</p> : null}
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Presentes */}
      {hasGifts ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="fl-gifts">
          <div className={styles.wrap}>
            <Reveal className={styles.sectionHead} y={12}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="fl-gifts" className={styles.h2}>
                Um gesto para a casa nova
              </h2>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {gallery.length ? <Gallery images={gallery} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      {/* Encerramento: foto em arco cercada de estrelas e o texto final em itálico */}
      <section className={styles.closing} aria-label="Encerramento">
        <div className={`${styles.wrap} ${styles.closingInner}`}>
          {wedding.footerImage ? (
            <Reveal className={styles.closingArch} y={16}>
              {CLOSING_STARS.map(([x, y, s], i) => (
                <StarSpark
                  key={i}
                  className={`${styles.ink} ${styles.star}`}
                  style={{ left: `${x}%`, top: `${y}%`, width: s }}
                />
              ))}
              <ArchFrame className={styles.closingFrame}>
                <Image
                  src={wedding.footerImage}
                  alt=""
                  fill
                  loading="lazy"
                  sizes="(min-width: 860px) 24vw, 56vw"
                  className={styles.archImg}
                />
              </ArchFrame>
            </Reveal>
          ) : null}
          <Reveal className={styles.closingText} y={12} delay={0.06}>
            <p className={styles.closingQuote}>{wedding.finalText}</p>
          </Reveal>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <p className={styles.footerMono}>{wedding.monogram}</p>
          <p className={styles.footerNames}>{wedding.coupleNames}</p>
          <p className={styles.footerMeta}>
            {wedding.weddingDateLabel}
            {location?.city ? ` · ${location.city}` : ""}
          </p>
          {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
          <p className={styles.footerCredit}>Feito com Noivar</p>
        </div>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ arco */

/**
 * Arco do kit desenhado por cima como traço; o conteúdo (foto ou monograma) fica
 * recortado dentro do arco interno (viewBox 200x304: x 32–168, y 42–292).
 */
function ArchFrame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`${styles.arch} ${className ?? ""}`}>
      <div className={styles.archWindow}>{children}</div>
      <Arch className={`${styles.ink} ${styles.archLines}`} />
    </div>
  );
}

/* ------------------------------------------------------------------ nav */

function Nav({ wedding }: Props) {
  const [open, toggle, close] = useMenu();
  return (
    <header className={styles.nav}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <a href="#topo" className={styles.navMono} aria-label={wedding.coupleNames}>
          {wedding.monogram}
        </a>
        <nav className={styles.navLinks} aria-label="Seções">
          {NAV.map(([href, label]) => (
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
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className={styles.navMobileLink} onClick={close}>
              {label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

/* ----------------------------------------------------------------- capa */

function Hero({ wedding }: Props) {
  const [a, b] = splitCouple(wedding.coupleNames);
  const location = mainLocation(wedding);
  const place = location ? [location.venue, location.city].filter(Boolean).join(" · ") : "";

  return (
    <section id="topo" className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      {HERO_STARS.map(([x, y, s], i) => (
        <StarSpark
          key={i}
          className={`${styles.ink} ${styles.star} ${styles.heroStar}`}
          style={{ left: `${x}%`, top: `${y}%`, width: s, animationDelay: `${300 + i * 90}ms` }}
        />
      ))}
      <WildflowerCluster className={`${styles.ink} ${styles.heroFlower} ${styles.heroFlowerL}`} />
      <WildflowerCluster className={`${styles.ink} ${styles.heroFlower} ${styles.heroFlowerR}`} />

      <div className={styles.heroInner}>
        <h1 className={`${styles.names} hero-rise`} data-scale={nameScale(wedding.coupleNames)}>
          <span className={styles.name}>{a}</span>
          {b ? (
            <>
              <em className={styles.amp} aria-hidden>
                &
              </em>
              <span className={styles.srOnly}>e</span>
              <span className={styles.name}>{b}</span>
            </>
          ) : null}
        </h1>

        <div className={`${styles.heroArch} hero-rise`} style={{ animationDelay: "120ms" }}>
          <ArchFrame className={styles.heroFrame}>
            {wedding.heroImage ? (
              <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 860px) 300px, 62vw" className={styles.archImg} />
            ) : (
              <span className={styles.archMono} aria-hidden>
                {wedding.monogram}
              </span>
            )}
          </ArchFrame>
        </div>

        <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "240ms" }}>
          <span>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </span>
          {place ? <span>{place}</span> : null}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- contagem */

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
      <div className={styles.wrap}>
        <Reveal className={styles.countHead} y={10}>
          <p className={styles.eyebrow}>{c.isPast ? "Hoje é o grande dia" : "Faltam"}</p>
        </Reveal>
        {valid && !c.isPast ? (
          <Reveal className={styles.countGrid} y={12} delay={0.05}>
            {units.map(([value, label]) => (
              <div key={label} className={styles.countCell}>
                <ArchFrame className={styles.countFrame}>
                  <span className={styles.countNum}>{c.ready ? pad(value) : "00"}</span>
                </ArchFrame>
                <span className={styles.countLabel}>{label}</span>
              </div>
            ))}
          </Reveal>
        ) : null}
        <Reveal className={styles.countFoot} y={10} delay={0.1}>
          <p className={styles.countDate}>{valid ? wedding.weddingDateLabel : "A data vem em breve"}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- galeria */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="fl-gallery">
      <div className={styles.wrap}>
        <Reveal className={styles.sectionHead} y={12}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="fl-gallery" className={styles.h2}>
            Retratos
          </h2>
        </Reveal>
        <div className={styles.galleryGrid}>
          {images.map((img, i) => (
            <Reveal key={img.id} y={12} delay={(i % 3) * 0.05}>
              <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${img.alt}`}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={800}
                  height={1000}
                  loading="lazy"
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 32vw, 48vw"
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
          figure: styles.lightboxFig,
          img: styles.lightboxImg,
          caption: styles.lightboxCaption,
          nav: styles.lightboxNav
        }}
      />
    </section>
  );
}
