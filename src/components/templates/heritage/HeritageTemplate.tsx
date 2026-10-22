"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { Cardo, Commissioner } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { useMenu } from "@/components/templates/kit/hooks";
import {
  CornerFlourish,
  Diamond,
  DoubleRule,
  Flourish,
  FrameDouble,
  LaurelWreath
} from "@/components/templates/kit/ornaments";
import { PAPER } from "@/components/templates/kit/textures";
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
import styles from "./heritage.module.css";

const display = Cardo({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--hg-display",
  display: "swap"
});

const sans = Commissioner({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--hg-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

const NAV = [
  ["#convite", "Convite"],
  ["#historia", "História"],
  ["#programacao", "O dia"],
  ["#presentes", "Presentes"],
  ["#galeria", "Galeria"],
  ["#confirmar", "Confirmar"]
] as const;

/* Moldura dupla + florões de canto: a mesma peça serve à capa e ao encerramento. */
function Frame() {
  return (
    <div className={styles.frame} aria-hidden>
      <FrameDouble className={styles.frameLines} />
      <CornerFlourish className={styles.corner} data-pos="tl" />
      <CornerFlourish className={styles.corner} data-pos="tr" />
      <CornerFlourish className={styles.corner} data-pos="br" />
      <CornerFlourish className={styles.corner} data-pos="bl" />
    </div>
  );
}

/* Foto em medalhão oval com borda dupla sépia (capa e encerramento). */
function Medallion({ src, alt, priority, sizes }: { src: string; alt: string; priority?: boolean; sizes: string }) {
  return (
    <div className={styles.medallion}>
      <div className={styles.medallionInner}>
        <Image src={src} alt={alt} fill priority={priority} loading={priority ? undefined : "lazy"} sizes={sizes} className={styles.medallionImg} />
      </div>
    </div>
  );
}

function Names({ names }: { names: string }) {
  const [a, b] = splitCouple(names);
  return (
    <h1 className={styles.names} data-scale={nameScale(names)}>
      <span className={styles.name}>{a}</span>
      {b ? (
        <>
          <em className={styles.amp}>&amp;</em>
          <span className={styles.name}>{b}</span>
        </>
      ) : null}
    </h1>
  );
}

export function HeritageTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gifts = activeGifts(wedding);
  const photos = galleryRest(wedding);
  const place = location ? [location.venue, location.city].filter(Boolean).join(", ") : "";

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template}`} style={{ "--hg-paper": PAPER } as CSSProperties}>
      <Nav wedding={wedding} />
      <Hero wedding={wedding} place={place} />

      {/* Convite: coluna estreita, primeira linha em versaletes */}
      <section id="convite" className={styles.invite} aria-labelledby="hg-invite">
        <span className={styles.thread} aria-hidden />
        <Reveal className={styles.inviteCol}>
          <p className={styles.eyebrow}>Convite</p>
          <h2 id="hg-invite" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <p className={styles.inviteText}>{wedding.welcomeText}</p>
          <Diamond className={styles.diamondEnd} aria-hidden />
        </Reveal>
      </section>

      {/* História: capítulos numerados, foto em moldura dupla, texto com fio à esquerda */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="hg-story">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.storyHead}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="hg-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
            <div className={styles.chapters}>
              {moments.map((moment, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(moment.headline);
                return (
                  <Reveal as="article" key={moment.id} className={`${styles.chapter} ${img && i % 2 === 1 ? styles.chapterFlip : ""}`}>
                    <span className={styles.chapterNum} aria-hidden>
                      {moment.number}
                    </span>
                    {img ? (
                      <figure className={styles.chapterFig}>
                        <Image src={img.src} alt={img.alt} width={900} height={1125} loading="lazy" sizes="(min-width: 900px) 40vw, 90vw" className={styles.chapterImg} />
                      </figure>
                    ) : null}
                    <div className={styles.chapterBody}>
                      <p className={styles.chapterTitle}>
                        <span className={styles.chapterNumInline} aria-hidden>
                          {moment.number}
                        </span>
                        {moment.title}
                      </p>
                      {lines.length ? (
                        <h3 className={styles.chapterHeadline}>
                          {lines.map((line, k) => (
                            <span key={k}>{line}</span>
                          ))}
                        </h3>
                      ) : null}
                      {moment.description ? <p className={styles.body}>{moment.description}</p> : null}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação: título à esquerda, lista com horários em versaletes e fios pontilhados */}
      {schedule.length ? (
        <section id="programacao" className={styles.program} aria-labelledby="hg-program">
          <div className={`${styles.wrap} ${styles.programGrid}`}>
            <Reveal as="header" className={styles.programHead}>
              <p className={styles.eyebrow}>Programação</p>
              <h2 id="hg-program" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.body}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.programList}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.programRow} delay={i * 0.05}>
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

      {/* Local: mapa em sépia com moldura dupla; o endereço sobrepõe o mapa no desktop */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="hg-place">
          <div className={`${styles.wrap} ${styles.placeGrid}`}>
            <Reveal className={styles.mapFrame} y={24}>
              <iframe className={styles.map} src={mapEmbedUrl(location)} title={`Mapa: ${location.venue || location.city}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </Reveal>
            <Reveal className={styles.placeCard} delay={0.08}>
              <p className={styles.eyebrow}>Local</p>
              <h2 id="hg-place" className={styles.h2}>
                {location.venue || location.city}
              </h2>
              {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
              {location.address ? <p className={styles.placeAddress}>{location.address}</p> : null}
              {location.note ? <p className={styles.body}>{location.note}</p> : null}
              <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
                Abrir no mapa
              </a>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Cartões de informação */}
      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={styles.wrap}>
            <ul className={styles.cardList}>
              {cards.map((card, i) => (
                <Reveal as="li" key={card.id} className={styles.card} delay={i * 0.06}>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <span className={styles.ruleShort} aria-hidden />
                  {card.subtitle ? <p className={styles.cardSub}>{card.subtitle}</p> : null}
                  {card.body ? <p className={styles.cardBody}>{card.body}</p> : null}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Presentes */}
      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="hg-gifts">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.sectionHeadCenter}>
              <Flourish className={styles.flourishSm} aria-hidden />
              <p className={styles.eyebrow}>Lista de presentes</p>
              <h2 id="hg-gifts" className={styles.h2}>
                Um gesto para a casa nova
              </h2>
              <p className={styles.lead}>Cada presente vai por Pix, direto para o casal, sem taxas nem intermediários.</p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {/* Galeria */}
      {photos.length ? <Gallery photos={photos} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      <Closing wedding={wedding} />
      <Footer wedding={wedding} place={place} />
    </main>
  );
}

/* ------------------------------------------------------------------- nav */

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

/* ------------------------------------------------------------------ capa */

function Hero({ wedding, place }: Props & { place: string }) {
  const hasPhoto = Boolean(wedding.heroImage);
  const meta = [wedding.weddingDateLabel, wedding.weddingTime].filter(Boolean).join(", ");
  return (
    <section id="topo" className={styles.hero} data-photo={hasPhoto ? "" : undefined} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <Frame />
      <div className={styles.heroInner}>
        <div className={styles.heroText}>
          {!hasPhoto ? <LaurelWreath className={styles.wreath} aria-hidden /> : null}
          <Flourish className={`${styles.flourish} hero-rise`} aria-hidden />
          <div className="hero-rise" style={{ animationDelay: "120ms" }}>
            <Names names={wedding.coupleNames} />
          </div>
          <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "240ms" }}>
            <span>{meta || "Em breve"}</span>
            {place ? (
              <>
                <Diamond className={styles.diamond} aria-hidden />
                <span>{place}</span>
              </>
            ) : null}
          </p>
        </div>
        {hasPhoto ? (
          <div className={`${styles.heroPhoto} hero-rise`} style={{ animationDelay: "200ms" }}>
            <Medallion src={wedding.heroImage} alt="" priority sizes="(min-width: 900px) 34vw, 70vw" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- contagem */

function Countdown({ wedding }: Props) {
  const c = useCountdown(wedding.weddingDate);
  const hasDate = Number.isFinite(new Date(wedding.weddingDate).getTime());
  const units: Array<[number, string]> = [
    [c.days, "dias"],
    [c.hours, "horas"],
    [c.minutes, "minutos"],
    [c.seconds, "segundos"]
  ];
  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <DoubleRule className={styles.doubleRule} aria-hidden />
      <Reveal className={styles.countInner}>
        <p className={styles.eyebrow}>{hasDate && c.isPast ? "O grande dia" : "Contagem regressiva"}</p>
        {hasDate && !c.isPast ? (
          <div className={styles.countGrid}>
            {units.map(([value, label]) => (
              <div key={label} className={styles.countCell}>
                <span className={styles.countNum}>{c.ready ? pad(value) : "—"}</span>
                <span className={styles.countLabel}>{label}</span>
              </div>
            ))}
          </div>
        ) : null}
        <p className={styles.countDate}>{hasDate && c.isPast ? "Hoje é o dia." : wedding.weddingDateLabel}</p>
      </Reveal>
      <DoubleRule className={styles.doubleRule} aria-hidden />
    </section>
  );
}

/* --------------------------------------------------------------- galeria */

function Gallery({ photos }: { photos: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="hg-gallery">
      <div className={styles.wrap}>
        <Reveal as="header" className={styles.galleryHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="hg-gallery" className={styles.h2}>
            Retratos guardados
          </h2>
        </Reveal>
        <ul className={styles.galleryGrid}>
          {photos.map((photo, i) => (
            <Reveal as="li" key={photo.id} className={styles.galleryItem} delay={(i % 4) * 0.05}>
              <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Ampliar: ${photo.alt}`}>
                <span className={styles.galleryFrame}>
                  <Image src={photo.src} alt={photo.alt} width={800} height={1000} loading="lazy" sizes="(min-width: 900px) 24vw, 46vw" className={styles.galleryImg} />
                </span>
                <span className={styles.galleryCaption}>{photo.caption || photo.alt}</span>
              </button>
            </Reveal>
          ))}
        </ul>
      </div>
      <Lightbox
        images={photos}
        active={lb.active}
        onClose={lb.close}
        classNames={{ dialog: styles.lightbox, close: styles.lightboxClose, nav: styles.lightboxNav, figure: styles.lightboxFig, img: styles.lightboxImg, caption: styles.lightboxCaption }}
      />
    </section>
  );
}

/* ---------------------------------------------------------- encerramento */

function Closing({ wedding }: Props) {
  if (!wedding.finalText && !wedding.footerImage) return null;
  return (
    <section className={styles.closing} data-photo={wedding.footerImage ? "" : undefined} aria-label="Encerramento">
      <div className={`${styles.wrap} ${styles.closingGrid}`}>
        {wedding.footerImage ? (
          <Reveal className={styles.closingPhoto} y={24}>
            <Medallion src={wedding.footerImage} alt="" sizes="(min-width: 900px) 30vw, 64vw" />
          </Reveal>
        ) : null}
        <Reveal className={styles.closingText} delay={0.08}>
          <Flourish className={styles.flourishSm} aria-hidden />
          {wedding.finalText ? <p className={styles.closingWords}>{wedding.finalText}</p> : null}
          <a href="#confirmar" className={styles.btn}>
            Confirmar presença
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- rodapé */

function Footer({ wedding, place }: Props & { place: string }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerMono}>
        <Flourish className={styles.flourishFoot} aria-hidden />
        <span className={styles.mono}>{wedding.monogram}</span>
        <Flourish className={styles.flourishFoot} aria-hidden />
      </div>
      {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
      <p className={styles.footerMeta}>{[wedding.coupleNames, wedding.weddingDateLabel, place].filter(Boolean).join(" · ")}</p>
      <p className={styles.footerBrand}>Feito com Noivar</p>
    </footer>
  );
}
