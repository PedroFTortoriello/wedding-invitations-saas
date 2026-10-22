"use client";

import { useRef } from "react";
import Image from "next/image";
import { Figtree, Fraunces } from "next/font/google";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, pad, useCountdown } from "@/components/templates/shared/motion";
import { useMenu } from "@/components/templates/kit/hooks";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import {
  activeCards,
  activeGifts,
  dateParts,
  headlineLines,
  mainLocation,
  mapEmbedUrl,
  mapLink,
  nameScale,
  placeLine,
  program,
  splitCouple,
  storyMoments,
  weddingYear
} from "@/components/templates/kit/utils";
import styles from "./editorial-ivory.module.css";

/* Fraunces variável com o eixo óptico: títulos grandes pegam o corte "display" sozinhos. */
const display = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--ei-display",
  display: "swap"
});

const sans = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--ei-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

export function EditorialIvoryTemplate({ wedding }: Props) {
  const year = weddingYear(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const location = mainLocation(wedding);
  const cards = activeCards(wedding);
  const hasGifts = activeGifts(wedding).length > 0;
  const photos = galleryRest(wedding);

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
      <Masthead wedding={wedding} nav={nav} />
      <Cover wedding={wedding} year={year} />

      {/* Convite: coluna de legenda + coluna de leitura com capitular */}
      <section id="convite" className={styles.invite} aria-labelledby="ei-invite">
        <div className={styles.wrap}>
          <div className={styles.inviteGrid}>
            <Reveal className={styles.inviteAside}>
              <p className={styles.eyebrow}>
                <span className={styles.folioNum} aria-hidden /> O convite
              </p>
              {wedding.invitationWords.length ? (
                <h2 id="ei-invite" className={styles.inviteWords}>
                  {wedding.invitationWords.join(" ")}
                </h2>
              ) : (
                <h2 id="ei-invite" className={styles.inviteWords}>
                  Vamos celebrar
                </h2>
              )}
              <dl className={styles.service}>
                <div>
                  <dt>Data</dt>
                  <dd>{wedding.weddingDateLabel}</dd>
                </div>
                {wedding.weddingTime ? (
                  <div>
                    <dt>Hora</dt>
                    <dd>{wedding.weddingTime}</dd>
                  </div>
                ) : null}
                {location ? (
                  <div>
                    <dt>Local</dt>
                    <dd>{placeLine(wedding)}</dd>
                  </div>
                ) : null}
              </dl>
            </Reveal>
            <Reveal className={styles.inviteBody} delay={0.08}>
              {wedding.welcomeText ? <p className={styles.dropcap}>{wedding.welcomeText}</p> : null}
              {wedding.rsvp.enabled ? (
                <a href="#confirmar" className={styles.btn}>
                  Confirmar presença
                </a>
              ) : null}
            </Reveal>
          </div>
        </div>
      </section>

      {/* História: spreads com a foto sangrando na margem e o destaque sobreposto */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="ei-story">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.storyHead}>
              <p className={styles.eyebrow}>
                <span className={styles.folioNum} aria-hidden /> {wedding.storyEyebrow || "Nossa história"}
              </p>
              <h2 id="ei-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
          </div>
          {moments.map((moment, i) => {
            const img = storyImage(wedding.gallery, i);
            const lines = headlineLines(moment.headline);
            const alt = i % 2 === 1;
            return (
              <article
                key={moment.id}
                className={`${styles.spread} ${alt ? styles.spreadAlt : ""} ${img ? "" : styles.spreadNoImg}`}
              >
                <div className={`${styles.wrap} ${styles.spreadGrid}`}>
                  {img ? (
                    <>
                      <Reveal className={styles.spreadMedia} y={20}>
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          loading="lazy"
                          sizes="(min-width: 1024px) 56vw, 100vw"
                          className={styles.spreadImg}
                        />
                      </Reveal>
                      {lines.length ? (
                        <Reveal as="div" className={styles.spreadHeadline} delay={0.1}>
                          <h3 className={styles.h3}>
                            {lines.map((line) => (
                              <span key={line} className={styles.line}>
                                {line}
                              </span>
                            ))}
                          </h3>
                        </Reveal>
                      ) : null}
                      <Reveal className={styles.spreadBody} delay={0.14}>
                        <p className={styles.chapter}>
                          <span className={styles.chapterNum}>{moment.number}</span>
                          <span className={styles.chapterTitle}>{moment.title}</span>
                        </p>
                        {moment.description ? <p className={styles.body}>{moment.description}</p> : null}
                      </Reveal>
                    </>
                  ) : (
                    /* sem foto: verbete em duas colunas */
                    <Reveal className={styles.entry}>
                      <p className={styles.chapter}>
                        <span className={styles.chapterNum}>{moment.number}</span>
                        <span className={styles.chapterTitle}>{moment.title}</span>
                      </p>
                      <div>
                        {lines.length ? (
                          <h3 className={styles.h3}>
                            {lines.map((line) => (
                              <span key={line} className={styles.line}>
                                {line}
                              </span>
                            ))}
                          </h3>
                        ) : null}
                        {moment.description ? <p className={styles.body}>{moment.description}</p> : null}
                      </div>
                    </Reveal>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação: sumário com leader pontilhado */}
      {schedule.length ? (
        <section id="programacao" className={styles.schedule} aria-labelledby="ei-schedule">
          <div className={`${styles.wrap} ${styles.scheduleGrid}`}>
            <Reveal as="header" className={styles.scheduleHead}>
              <p className={styles.eyebrow}>
                <span className={styles.folioNum} aria-hidden /> Programação
              </p>
              <h2 id="ei-schedule" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.bodyMuted}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.toc}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.tocRow} delay={i * 0.05} y={12}>
                  <span className={styles.tocLine}>
                    <span className={styles.tocTime}>{item.time}</span>
                    <span className={styles.leader} aria-hidden />
                    <span className={styles.tocTitle}>{item.title}</span>
                  </span>
                  {item.note ? <span className={styles.tocNote}>{item.note}</span> : null}
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Local: mapa em moldura fina + ficha de serviço */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="ei-place">
          <div className={`${styles.wrap} ${styles.placeGrid}`}>
            <Reveal className={styles.mapFrame} y={20}>
              <iframe
                className={styles.map}
                src={mapEmbedUrl(location)}
                title={`Mapa: ${location.venue || location.city}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Reveal>
            <Reveal className={styles.placeInfo} delay={0.08}>
              <p className={styles.eyebrow}>
                <span className={styles.folioNum} aria-hidden /> Onde
              </p>
              <h2 id="ei-place" className={styles.h2}>
                {location.venue || location.city}
              </h2>
              <dl className={styles.service}>
                {location.venue && location.city ? (
                  <div>
                    <dt>Cidade</dt>
                    <dd>{location.city}</dd>
                  </div>
                ) : null}
                {location.address ? (
                  <div>
                    <dt>Endereço</dt>
                    <dd>{location.address}</dd>
                  </div>
                ) : null}
                {location.note ? (
                  <div>
                    <dt>Nota</dt>
                    <dd>{location.note}</dd>
                  </div>
                ) : null}
              </dl>
              <a className={styles.link} href={mapLink(location)} target="_blank" rel="noreferrer">
                Abrir no Google Maps
              </a>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Cartões: colunas de texto separadas por fios verticais */}
      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={styles.wrap}>
            <Reveal className={styles.eyebrow}>
              <span className={styles.folioNum} aria-hidden /> Bom saber
            </Reveal>
            <div className={styles.cardCols}>
              {cards.map((card, i) => (
                <Reveal as="article" key={card.id} className={styles.card} delay={i * 0.06}>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  {card.subtitle ? <p className={styles.cardSub}>{card.subtitle}</p> : null}
                  {card.body ? <p className={styles.bodySmall}>{card.body}</p> : null}
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Presentes */}
      {hasGifts ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="ei-gifts">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.giftsHead}>
              <p className={styles.eyebrow}>
                <span className={styles.folioNum} aria-hidden /> Presentes
              </p>
              <h2 id="ei-gifts" className={styles.h2}>
                Um gesto para a casa nova
              </h2>
              <p className={styles.bodyMuted}>
                Cada cota é um Pix direto para o casal. Escolha a que mais combina com vocês.
              </p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {photos.length ? <Gallery photos={photos} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      {/* Encerramento: pull-quote + retrato de contracapa */}
      {wedding.finalText || wedding.footerImage ? (
        <section className={styles.closing} aria-label="Encerramento">
          <div className={styles.wrap}>
            {wedding.finalText ? (
              <Reveal as="figure" className={styles.quote}>
                <span className={styles.quoteMark} aria-hidden>
                  “
                </span>
                <blockquote className={styles.quoteText}>{wedding.finalText}</blockquote>
                <figcaption className={styles.quoteBy}>{wedding.coupleNames}</figcaption>
              </Reveal>
            ) : null}
            {wedding.footerImage ? (
              <Reveal className={styles.backCover} delay={0.1} y={20}>
                <Image
                  src={wedding.footerImage}
                  alt={`Retrato de ${wedding.coupleNames}`}
                  fill
                  loading="lazy"
                  sizes="(min-width: 720px) 16rem, 60vw"
                  className={styles.backCoverImg}
                />
              </Reveal>
            ) : null}
          </div>
        </section>
      ) : null}

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.colophon}`}>
          <div>
            <p className={styles.colophonMono}>{wedding.monogram}</p>
            <p>{wedding.coupleNames}</p>
          </div>
          <div>
            <p className={styles.colophonLabel}>Edição</p>
            <p>
              {wedding.weddingDateLabel}
              {location?.city ? ` · ${location.city}` : ""}
            </p>
          </div>
          <div>
            {wedding.footerText ? <p className={styles.colophonText}>{wedding.footerText}</p> : null}
            <p className={styles.colophonLabel}>Feito com Noivar</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ---------------------------------------------------------------- masthead */

function Masthead({ wedding, nav }: Props & { nav: [string, string][] }) {
  const [open, toggle, close] = useMenu();
  return (
    <header className={styles.masthead}>
      <div className={`${styles.wrap} ${styles.mastheadRow}`}>
        <a href="#topo" className={styles.mastheadMono} aria-label={wedding.coupleNames}>
          {wedding.monogram}
        </a>
        <nav className={styles.mastheadNav} aria-label="Seções">
          {nav.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        {wedding.rsvp.enabled ? (
          <a href="#confirmar" className={styles.mastheadCta}>
            Confirmar
          </a>
        ) : null}
        <button type="button" className={styles.menuBtn} aria-expanded={open} onClick={toggle}>
          {open ? "Fechar" : "Menu"}
        </button>
      </div>
      {open ? (
        <nav className={styles.menu} aria-label="Seções">
          {[...nav, ...(wedding.rsvp.enabled ? [["#confirmar", "Confirmar presença"] as [string, string]] : [])].map(
            ([href, label]) => (
              <a key={href} href={href} onClick={close}>
                {label}
              </a>
            )
          )}
        </nav>
      ) : null}
    </header>
  );
}

/* ------------------------------------------------------------------- cover */

function Cover({ wedding, year }: Props & { year: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  /* O alcance zera no reduced-motion em vez de trocar a prop style: o atributo do SSR tem de bater com o do cliente. */
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "10%"]);
  const [first, second] = splitCouple(wedding.coupleNames);
  const date = dateParts(wedding);
  const location = mainLocation(wedding);

  return (
    <section id="topo" ref={ref} className={styles.cover} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <div className={`${styles.wrap} ${styles.coverGrid}`}>
        <div className={styles.coverText}>
          <p className={`${styles.eyebrow} hero-rise`}>Edição especial{year ? ` · ${year}` : ""}</p>
          <h1 className={`${styles.names} hero-rise`} data-scale={nameScale(wedding.coupleNames)} style={{ animationDelay: "120ms" }}>
            <span className={styles.name}>{first}</span>
            {second ? (
              <>
                <span className={styles.amp}>&amp;</span>
                <span className={styles.name}>{second}</span>
              </>
            ) : null}
          </h1>
          <div className={`${styles.coverFoot} hero-rise`} style={{ animationDelay: "240ms" }}>
            <p className={styles.coverService}>
              <span>{wedding.weddingDateLabel}</span>
              {wedding.weddingTime ? <span>{wedding.weddingTime}</span> : null}
              {location ? <span>{placeLine(wedding)}</span> : null}
            </p>
            <span className={styles.folio} aria-hidden>
              p. 01
            </span>
          </div>
        </div>

        {wedding.heroImage ? (
          <div className={styles.coverMedia}>
            <motion.div className={styles.coverMediaInner} style={{ y }}>
              <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 1024px) 58vw, 100vw" className={styles.coverImg} />
            </motion.div>
          </div>
        ) : (
          <div className={`${styles.coverMedia} ${styles.coverPlate} hero-rise`} style={{ animationDelay: "200ms" }}>
            {date.day ? (
              <p className={styles.plateDate}>
                <span className={styles.plateDay}>{date.day}</span>
                <span className={styles.plateRule} aria-hidden />
                <span className={styles.plateMonth}>{date.month}</span>
                <span className={styles.plateYear}>{date.year}</span>
              </p>
            ) : (
              <p className={styles.plateSoon}>{wedding.weddingDateLabel}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- countdown */

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
      <div className={`${styles.wrap} ${styles.countRow}`}>
        <Reveal className={styles.countHead}>
          <p className={styles.eyebrow}>{hasDate && c.isPast ? "Hoje é o dia" : "Contagem regressiva"}</p>
          <p className={styles.countDate}>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </p>
        </Reveal>
        {hasDate && !c.isPast ? (
          <Reveal className={styles.countUnits} delay={0.08}>
            {units.map(([value, label]) => (
              <span key={label} className={styles.countUnit}>
                <span className={styles.countNum}>{pad(value)}</span>
                <span className={styles.countLabel}>{label}</span>
              </span>
            ))}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- gallery */

function Gallery({ photos }: { photos: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="ei-gallery">
      <div className={styles.wrap}>
        <Reveal as="header" className={styles.galleryHead}>
          <p className={styles.eyebrow}>
            <span className={styles.folioNum} aria-hidden /> Galeria
          </p>
          <h2 id="ei-gallery" className={styles.h2}>
            Retratos
          </h2>
        </Reveal>
        <div className={styles.mosaic} data-m={photos.length % 2} data-d={photos.length % 3}>
          {photos.map((photo, i) => (
            <Reveal as="figure" key={photo.id} className={styles.tile} delay={(i % 3) * 0.05} y={14}>
              <button type="button" className={styles.tileBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${photo.alt}`}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className={styles.tileImg}
                />
              </button>
              <figcaption className={styles.tileCap}>Fig. {pad(i + 1)}</figcaption>
            </Reveal>
          ))}
        </div>
      </div>
      <Lightbox
        images={photos}
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
