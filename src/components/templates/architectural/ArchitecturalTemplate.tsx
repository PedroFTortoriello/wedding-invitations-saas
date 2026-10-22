"use client";

import { useId } from "react";
import Image from "next/image";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
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
  storyMoments,
  weddingYear
} from "@/components/templates/kit/utils";
import styles from "./architectural.module.css";

const display = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--ar-display",
  display: "swap"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--ar-mono",
  display: "swap"
});

type Props = { wedding: WeddingSite };

/** Prancha: as seções presentes recebem numeração contínua (01, 02…), nada de buracos. */
type SectionKey =
  | "convite"
  | "historia"
  | "contagem"
  | "programacao"
  | "local"
  | "notas"
  | "presentes"
  | "galeria"
  | "confirmar"
  | "encerramento";

const SECTION_LABEL: Record<SectionKey, string> = {
  convite: "Convite",
  historia: "História",
  contagem: "Contagem",
  programacao: "Programação",
  local: "Local",
  notas: "Notas de projeto",
  presentes: "Presentes",
  galeria: "Galeria",
  confirmar: "Confirmação",
  encerramento: "Encerramento"
};

export function ArchitecturalTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gifts = activeGifts(wedding);
  const photos = galleryRest(wedding);
  const hasDate = Number.isFinite(new Date(wedding.weddingDate).getTime());

  const present: SectionKey[] = [
    "convite",
    moments.length ? "historia" : null,
    "contagem",
    schedule.length ? "programacao" : null,
    location ? "local" : null,
    cards.length ? "notas" : null,
    gifts.length ? "presentes" : null,
    photos.length ? "galeria" : null,
    "confirmar",
    "encerramento"
  ].filter((key): key is SectionKey => key !== null);
  const num = (key: SectionKey) => pad(present.indexOf(key) + 1);

  return (
    <main className={`${display.variable} ${mono.variable} ${styles.template}`}>
      <Nav wedding={wedding} present={present} num={num} />
      <Hero wedding={wedding} hasDate={hasDate} />

      {/* 01 Convite: número de seção, frase do convite e texto em duas colunas estreitas */}
      <section id="convite" className={styles.invite} aria-labelledby="ar-invite">
        <div className={styles.wrap}>
          <SheetHead id="ar-invite" num={num("convite")} title={SECTION_LABEL.convite} meta="Folha de rosto" />
          <Reveal className={styles.inviteGrid}>
            <p className={styles.inviteWords}>{wedding.invitationWords.join(" ")}</p>
            <p className={styles.inviteText}>{wedding.welcomeText}</p>
          </Reveal>
        </div>
      </section>

      {/* 02 História: cada capítulo é uma planta — foto com cota ao lado, texto à direita */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="ar-story">
          <div className={styles.wrap}>
            <SheetHead id="ar-story" num={num("historia")} title={wedding.storyTitle || SECTION_LABEL.historia} meta={wedding.storyEyebrow} />
            <div className={`${styles.chapters} ${storyImage(wedding.gallery, 0) ? "" : styles.chaptersNoImg}`}>
              {moments.map((moment, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(moment.headline);
                return (
                  <Reveal
                    as="article"
                    key={moment.id}
                    className={`${styles.chapter} ${img ? "" : styles.chapterNoImg} ${i % 2 ? styles.chapterAlt : ""}`}
                    y={20}
                  >
                    {img ? (
                      <figure className={styles.chapterFig}>
                        <Image
                          src={img.src}
                          alt={img.alt}
                          width={1000}
                          height={1250}
                          loading="lazy"
                          sizes="(min-width: 900px) 40vw, 100vw"
                          className={styles.chapterImg}
                        />
                        <Dim axis="x" className={styles.chapterDimX} label={`REF. ${pad(i + 1)}`} />
                      </figure>
                    ) : null}
                    <Dim axis="y" className={styles.chapterDimY} />
                    <div className={styles.chapterBody}>
                      <p className={styles.chapterNum}>
                        {num("historia")}.{i + 1}
                        <span className={styles.chapterKicker}>{moment.title}</span>
                      </p>
                      {lines.length ? (
                        <h3 className={styles.chapterHeadline}>
                          {lines.map((line, k) => (
                            <span key={k} className={styles.block}>
                              {line}
                            </span>
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

      <Countdown wedding={wedding} num={num("contagem")} hasDate={hasDate} />

      {/* 04 Programação: tabela técnica HORA | EVENTO | NOTA */}
      {schedule.length ? (
        <section id="programacao" className={styles.program} aria-labelledby="ar-program">
          <div className={styles.wrap}>
            <SheetHead id="ar-program" num={num("programacao")} title={SECTION_LABEL.programacao} meta={`${schedule.length} ${schedule.length === 1 ? "item" : "itens"}`} />
            <Reveal className={styles.programIntro}>
              {wedding.detailsTitle ? <h3 className={styles.h3}>{wedding.detailsTitle}</h3> : null}
              {wedding.detailsSubtitle ? <p className={styles.body}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <Reveal className={styles.table} role="table" aria-label="Programação do dia" delay={0.08}>
              <div className={`${styles.tr} ${styles.th}`} role="row">
                <span role="columnheader">Hora</span>
                <span role="columnheader">Evento</span>
                <span role="columnheader" className={styles.thNote}>
                  Nota
                </span>
              </div>
              {schedule.map((item) => (
                <div key={item.id} className={styles.tr} role="row">
                  <span className={styles.tdTime} role="cell">
                    {item.time}
                  </span>
                  <span className={styles.tdTitle} role="cell">
                    {item.title}
                  </span>
                  <span className={styles.tdNote} role="cell">
                    {item.note}
                  </span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* 05 Local: mapa em moldura com cotas nos cantos, endereço em mono */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="ar-place">
          <div className={styles.wrap}>
            <SheetHead id="ar-place" num={num("local")} title={SECTION_LABEL.local} meta={location.venue ? location.city : ""} />
            <div className={styles.placeGrid}>
              <Reveal className={styles.placeInfo}>
                <h3 className={styles.placeVenue}>{location.venue || location.city}</h3>
                {location.venue && location.city ? <p className={styles.mono}>{location.city}</p> : null}
                {location.address ? <p className={`${styles.mono} ${styles.placeAddress}`}>{location.address}</p> : null}
                {location.note ? <p className={styles.body}>{location.note}</p> : null}
                <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
                  Abrir no mapa
                </a>
              </Reveal>
              <Reveal className={styles.placeMap} delay={0.08} y={24}>
                <Dim axis="x" className={styles.placeDimX} label="Planta de situação" />
                <div className={styles.mapFrame}>
                  <span className={`${styles.corner} ${styles.cornerTl}`} aria-hidden />
                  <span className={`${styles.corner} ${styles.cornerTr}`} aria-hidden />
                  <span className={`${styles.corner} ${styles.cornerBl}`} aria-hidden />
                  <span className={`${styles.corner} ${styles.cornerBr}`} aria-hidden />
                  <iframe className={styles.map} src={mapEmbedUrl(location)} title={`Mapa — ${location.venue || location.city}`} loading="lazy" />
                </div>
                <Dim axis="y" className={styles.placeDimY} />
              </Reveal>
            </div>
          </div>
        </section>
      ) : null}

      {/* 06 Notas de projeto: cartões numerados em tabela */}
      {cards.length ? (
        <section id="notas" className={styles.notes} aria-labelledby="ar-notes">
          <div className={styles.wrap}>
            <SheetHead id="ar-notes" num={num("notas")} title={SECTION_LABEL.notas} meta={`${cards.length} ${cards.length === 1 ? "nota" : "notas"}`} />
            <div className={styles.notesGrid}>
              {cards.map((card, i) => (
                <Reveal as="article" key={card.id} className={styles.note} delay={(i % 3) * 0.06} y={14}>
                  <p className={styles.noteNum}>N.{pad(i + 1)}</p>
                  <h3 className={styles.noteTitle}>{card.title}</h3>
                  {card.subtitle ? <p className={styles.mono}>{card.subtitle}</p> : null}
                  {card.body ? <p className={styles.noteBody}>{card.body}</p> : null}
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 07 Presentes */}
      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="ar-gifts">
          <div className={styles.wrap}>
            <SheetHead id="ar-gifts" num={num("presentes")} title={SECTION_LABEL.presentes} meta={`${gifts.length} ${gifts.length === 1 ? "cota" : "cotas"}`} />
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {/* 08 Galeria: grade modular com legendas em mono */}
      {photos.length ? <Gallery images={photos} num={num("galeria")} /> : null}

      {/* 09 Confirmação e recados */}
      <div className={styles.forms}>
        <div className={styles.wrap}>
          <SheetHead num={num("confirmar")} title="Confirmação e recados" meta={wedding.rsvp.enabled ? wedding.rsvp.subtitle : ""} />
        </div>
        <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />
      </div>

      {/* 10 Encerramento: texto final em Archivo 500, foto à esquerda com cota */}
      <section id="encerramento" className={styles.closing} aria-labelledby="ar-closing">
        <div className={styles.wrap}>
          <SheetHead id="ar-closing" num={num("encerramento")} title={SECTION_LABEL.encerramento} meta={wedding.weddingDateLabel} />
          <div className={`${styles.closingGrid} ${wedding.footerImage ? "" : styles.closingNoImg}`}>
            {wedding.footerImage ? (
              <Reveal as="figure" className={styles.closingFig} y={24}>
                <Image
                  src={wedding.footerImage}
                  alt=""
                  width={900}
                  height={1125}
                  loading="lazy"
                  sizes="(min-width: 900px) 34vw, 100vw"
                  className={styles.closingImg}
                />
                <Dim axis="x" className={styles.closingDim} label={`Ref. ${weddingYear(wedding) || "final"}`} />
              </Reveal>
            ) : null}
            <Reveal className={styles.closingBody} delay={0.08}>
              <p className={styles.closingText}>{wedding.finalText}</p>
              <p className={styles.closingNames}>{wedding.coupleNames}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer wedding={wedding} />
    </main>
  );
}

/* ---------------------------------------------------------------- cota */

/**
 * Linha de cota: fio terracota com setas nas pontas que "desenha" ao entrar
 * (stroke-dashoffset via pathLength=1; os marcadores ficam em unidades fixas,
 * por isso a linha pode usar 100% sem deformar as setas). Decorativa.
 */
function Dim({ axis, label, className = "" }: { axis: "x" | "y"; label?: string; className?: string }) {
  const id = useId();
  const line = axis === "x" ? { x1: "0", y1: "50%", x2: "100%", y2: "50%" } : { x1: "50%", y1: "0", x2: "50%", y2: "100%" };
  return (
    <span className={`${styles.dim} ${axis === "x" ? styles.dimX : styles.dimY} ${className}`} aria-hidden>
      <svg className={styles.dimSvg}>
        <defs>
          <marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
          </marker>
        </defs>
        <line {...line} pathLength={1} className={styles.dimLine} markerStart={`url(#${id})`} markerEnd={`url(#${id})`} />
      </svg>
      {label ? <span className={styles.dimLabel}>{label}</span> : null}
    </span>
  );
}

/* ------------------------------------------------------------ sheet head */

function SheetHead({ id, num, title, meta }: { id?: string; num: string; title: string; meta?: string }) {
  return (
    <Reveal as="header" className={styles.head} y={10}>
      <span className={styles.headNum}>{num}</span>
      <h2 id={id} className={styles.headTitle}>
        {title}
      </h2>
      {meta ? <span className={styles.headMeta}>{meta}</span> : null}
    </Reveal>
  );
}

/* ------------------------------------------------------------------ nav */

function Nav({ wedding, present, num }: Props & { present: SectionKey[]; num: (k: SectionKey) => string }) {
  const [open, toggle, close] = useMenu();
  const scrolled = useScrolled(40);
  const links = present.filter((k) => k !== "confirmar" && k !== "encerramento" && k !== "contagem");

  return (
    <header className={`${styles.nav} ${scrolled ? styles.navSolid : ""}`}>
      <div className={styles.navInner}>
        <a href="#top" className={styles.navMono} aria-label={wedding.coupleNames}>
          {wedding.monogram || wedding.coupleNames}
        </a>
        <nav className={styles.navLinks} aria-label="Seções">
          {links.map((key) => (
            <a key={key} href={`#${key}`} className={styles.navLink}>
              <span className={styles.navNum}>{num(key)}</span> {SECTION_LABEL[key]}
            </a>
          ))}
        </nav>
        <a href="#confirmar" className={`${styles.btn} ${styles.navCta}`}>
          Confirmar
        </a>
        <button type="button" className={styles.navToggle} aria-expanded={open} aria-controls="ar-menu" onClick={toggle}>
          {open ? "Fechar" : "Menu"}
        </button>
      </div>
      {open ? (
        <nav id="ar-menu" className={styles.navMobile} aria-label="Seções">
          {links.map((key) => (
            <a key={key} href={`#${key}`} className={styles.navMobileLink} onClick={close}>
              <span className={styles.navNum}>{num(key)}</span>
              {SECTION_LABEL[key]}
            </a>
          ))}
          <a href="#confirmar" className={styles.navMobileLink} onClick={close}>
            <span className={styles.navNum}>{num("confirmar")}</span>
            Confirmar presença
          </a>
        </nav>
      ) : null}
    </header>
  );
}

/* ----------------------------------------------------------------- hero */

const RULER = Array.from({ length: 11 }, (_, i) => i * 10);

function Hero({ wedding, hasDate }: Props & { hasDate: boolean }) {
  const [a, b] = splitCouple(wedding.coupleNames);
  const location = mainLocation(wedding);
  const year = weddingYear(wedding);
  const place = location ? [location.venue, location.city].filter(Boolean).join(", ") : "A definir";

  return (
    <section id="top" className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`} data-scale={nameScale(wedding.coupleNames)}>
      <div className={styles.heroTop}>
        <p className={`${styles.mono} hero-rise`}>Prancha 01 · Convite de casamento</p>
        <p className={`${styles.mono} hero-rise`}>{year ? `Rev. ${year}` : "Rev. —"}</p>
      </div>

      <div className={`${styles.heroGrid} ${wedding.heroImage ? "" : styles.heroNoImg}`}>
        {wedding.heroImage ? (
          <figure className={`${styles.heroFig} hero-rise`} style={{ animationDelay: "200ms" }}>
            <Dim axis="x" className={`${styles.heroDimX} ${styles.heroDim}`} label="Ref. 01" />
            <div className={styles.heroImgBox}>
              <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 900px) 38vw, 100vw" className={styles.heroImg} />
            </div>
            <Dim axis="y" className={`${styles.heroDimY} ${styles.heroDim}`} label="4 / 5" />
          </figure>
        ) : null}

        <h1 className={`${styles.heroNames} hero-rise`} style={{ animationDelay: "120ms" }}>
          <span className={styles.block}>{a}</span>
          {b ? (
            <>
              <span className={`${styles.block} ${styles.heroAmp}`}>&amp;</span>
              <span className={styles.block}>{b}</span>
            </>
          ) : null}
        </h1>

        <dl className={`${styles.stamp} hero-rise`} style={{ animationDelay: "300ms" }}>
          <div className={styles.stampRow}>
            <dt>Projeto</dt>
            <dd>{wedding.coupleNames}</dd>
          </div>
          <div className={styles.stampRow}>
            <dt>Data</dt>
            <dd>
              {wedding.weddingDateLabel || "A definir"}
              {hasDate && wedding.weddingTime ? <span className={styles.stampTime}>{wedding.weddingTime}</span> : null}
            </dd>
          </div>
          <div className={styles.stampRow}>
            <dt>Local</dt>
            <dd>{place}</dd>
          </div>
          <div className={styles.stampRow}>
            <dt>Escala</dt>
            <dd>1 : 1</dd>
          </div>
        </dl>
      </div>

      <div className={styles.ruler} aria-hidden>
        {RULER.map((n) => (
          <span key={n} className={styles.rulerMark}>
            {n}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ countdown */

function Countdown({ wedding, num, hasDate }: Props & { num: string; hasDate: boolean }) {
  const c = useCountdown(wedding.weddingDate);
  const cells: Array<[number, string]> = [
    [c.days, "dias"],
    [c.hours, "horas"],
    [c.minutes, "min"],
    [c.seconds, "seg"]
  ];

  return (
    <section id="contagem" className={styles.count} aria-labelledby="ar-count">
      <div className={styles.wrap}>
        <SheetHead id="ar-count" num={num} title={c.isPast ? "Hoje é o grande dia" : "Contagem regressiva"} meta={wedding.weddingDateLabel} />
        {hasDate && !c.isPast ? (
          <Reveal className={styles.countTable} delay={0.06}>
            {cells.map(([value, label]) => (
              <div key={label} className={styles.countCell}>
                <span className={styles.countNum} aria-hidden>
                  {c.ready ? pad(value) : "00"}
                </span>
                <span className={styles.mono}>{label}</span>
              </div>
            ))}
          </Reveal>
        ) : null}
        <Reveal className={styles.countFoot} delay={0.1}>
          <span className={styles.mono}>{hasDate ? `${wedding.weddingDateLabel}${wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}` : "Data a confirmar"}</span>
          <span className={styles.mono}>{c.isPast ? "Obrigado por estar aqui" : "Marque na agenda"}</span>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- gallery */

function Gallery({ images, num }: { images: WeddingSite["gallery"]; num: string }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="ar-gallery">
      <div className={styles.wrap}>
        <SheetHead id="ar-gallery" num={num} title={SECTION_LABEL.galeria} meta={`${images.length} ${images.length === 1 ? "foto" : "fotos"}`} />
        <div className={styles.galleryGrid}>
          {images.map((image, i) => (
            <Reveal as="figure" key={image.id} className={styles.galleryItem} delay={(i % 3) * 0.06} y={14}>
              <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${image.alt}`}>
                <Image src={image.src} alt={image.alt} width={800} height={1000} loading="lazy" sizes="(min-width: 640px) 33vw, 50vw" className={styles.galleryImg} />
              </button>
              <figcaption className={styles.galleryCap}>
                <span className={styles.galleryNum}>F.{pad(i + 1)}</span>
                {image.alt}
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
      <Lightbox
        images={images}
        active={lb.active}
        onClose={lb.close}
        classNames={{ dialog: styles.lightbox, close: styles.lightboxClose, nav: styles.lightboxNav, figure: styles.lightboxFig, img: styles.lightboxImg, caption: styles.lightboxCap }}
      />
    </section>
  );
}

/* --------------------------------------------------------------- footer */

function Footer({ wedding }: Props) {
  const location = mainLocation(wedding);
  const items = [wedding.monogram, wedding.coupleNames, wedding.weddingDateLabel, location?.city, wedding.footerText].filter(Boolean);
  return (
    <footer className={styles.footer}>
      <span className={styles.footerBar} aria-hidden />
      <div className={`${styles.wrap} ${styles.footerLine}`}>
        {items.map((item, i) => (
          <span key={i} className={styles.footerItem}>
            {item}
          </span>
        ))}
        <span className={`${styles.footerItem} ${styles.footerCredit}`}>Feito com Noivar</span>
      </div>
    </footer>
  );
}
