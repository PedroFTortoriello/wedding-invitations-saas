"use client";

import Image from "next/image";
import { Inter_Tight, Instrument_Serif } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { useMenu } from "@/components/templates/kit/hooks";
import {
  activeCards,
  activeGifts,
  dateParts,
  headlineLines,
  mainLocation,
  mapEmbedUrl,
  mapLink,
  nameScale,
  program,
  splitCouple,
  storyMoments
} from "@/components/templates/kit/utils";
import styles from "./pure-form.module.css";

const sans = Inter_Tight({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--pf-sans",
  display: "swap"
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--pf-serif",
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

export function PureFormTemplate({ wedding }: Props) {
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

      {/* Convite: coluna 7–12 da grade (assimétrico) */}
      <section id="convite" className={styles.section} aria-labelledby="pf-invite">
        <div className={`${styles.wrap} ${styles.cols}`}>
          <Reveal as="span" className={styles.inviteLabel} y={8}>
            <span className={styles.eyebrow}>Convite</span>
          </Reveal>
          <Reveal className={styles.inviteCol} y={8} delay={0.05}>
            <h2 id="pf-invite" className={styles.inviteWords}>
              {wedding.invitationWords.join(" ")}
            </h2>
            <p className={styles.body}>{wedding.welcomeText}</p>
          </Reveal>
        </div>
      </section>

      {/* História: tabela de capítulos */}
      {moments.length ? (
        <section id="historia" className={styles.section} aria-labelledby="pf-story">
          <div className={`${styles.wrap} ${styles.cols}`}>
            <Reveal className={styles.storyHead} y={8}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="pf-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
            <div className={styles.table}>
              {moments.map((m, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(m.headline);
                return (
                  <Reveal as="article" key={m.id} className={styles.row} y={8} delay={i * 0.05}>
                    <div className={styles.rowMedia}>
                      {img ? (
                        <Image
                          src={img.src}
                          alt={img.alt}
                          width={320}
                          height={320}
                          loading="lazy"
                          sizes="96px"
                          className={styles.thumb}
                        />
                      ) : null}
                      <span className={styles.num}>{m.number}</span>
                    </div>
                    <p className={styles.rowTitle}>{m.title}</p>
                    {lines.length ? (
                      <h3 className={styles.rowHeadline}>
                        {lines.map((line, k) => (
                          <span key={k}>{line}</span>
                        ))}
                      </h3>
                    ) : null}
                    <p className={`${styles.body} ${styles.rowBody}`}>{m.description}</p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação: duas colunas com horários tabulares */}
      {schedule.length ? (
        <section id="programa" className={styles.section} aria-labelledby="pf-program">
          <div className={`${styles.wrap} ${styles.cols}`}>
            <Reveal className={styles.programHead} y={8}>
              <p className={styles.eyebrow}>Programa</p>
              <h2 id="pf-program" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.body}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.program}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.programItem} y={8} delay={i * 0.04}>
                  <span className={styles.time}>{item.time}</span>
                  <span>
                    <span className={styles.programTitle}>{item.title}</span>
                    {item.note ? <span className={styles.programNote}>{item.note}</span> : null}
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Local: mapa full-width, dados num retângulo branco no canto */}
      {location ? (
        <section id="local" className={styles.section} aria-labelledby="pf-place">
          <div className={styles.wrap}>
            <Reveal className={styles.mapWrap} y={8}>
              <iframe
                className={styles.map}
                src={mapEmbedUrl(location)}
                title={`Mapa: ${location.venue || location.city}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className={styles.placeCard}>
                <p className={styles.eyebrow}>Local</p>
                <h2 id="pf-place" className={styles.placeName}>
                  {location.venue || location.city}
                </h2>
                {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
                {location.address ? <p className={styles.placeLine}>{location.address}</p> : null}
                {location.note ? <p className={styles.placeLine}>{location.note}</p> : null}
                <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
                  Abrir no mapa
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Cartões: três colunas de texto puro */}
      {cards.length ? (
        <section className={styles.section} aria-label="Informações">
          <div className={`${styles.wrap} ${styles.cards}`}>
            {cards.map((card, i) => (
              <Reveal as="article" key={card.id} className={styles.card} y={8} delay={i * 0.05}>
                <p className={styles.eyebrow}>{card.subtitle}</p>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.body}>{card.body}</p>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* Presentes */}
      {hasGifts ? (
        <section id="presentes" className={`${styles.section} ${styles.paper}`} aria-labelledby="pf-gifts">
          <div className={styles.wrap}>
            <Reveal className={styles.giftsHead} y={8}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="pf-gifts" className={styles.h2}>
                Um gesto para a casa nova
              </h2>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {gallery.length ? <Gallery images={gallery} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      {/* Encerramento: texto grande + foto pequena 1:1 */}
      <section className={styles.section} aria-label="Encerramento">
        <div className={`${styles.wrap} ${styles.closing}`}>
          <Reveal y={8}>
            <p className={styles.closingText}>{wedding.finalText}</p>
          </Reveal>
          {wedding.footerImage ? (
            <Reveal className={styles.closingMedia} y={8} delay={0.08}>
              <Image
                src={wedding.footerImage}
                alt=""
                width={600}
                height={600}
                loading="lazy"
                sizes="(min-width: 900px) 20vw, 45vw"
                className={styles.closingImg}
              />
            </Reveal>
          ) : null}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerLine}`}>
          <span className={styles.footerMono}>{wedding.monogram}</span>
          <span>{wedding.coupleNames}</span>
          <span>{wedding.weddingDateLabel}</span>
          {location?.city ? <span>{location.city}</span> : null}
          {wedding.footerText ? <span className={styles.footerText}>{wedding.footerText}</span> : null}
          <span className={styles.footerCredit}>Feito com Noivar</span>
        </div>
      </footer>
    </main>
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

/* ----------------------------------------------------------------- hero */

function Hero({ wedding }: Props) {
  const [a, b] = splitCouple(wedding.coupleNames);
  const { day, month, year } = dateParts(wedding);
  const location = mainLocation(wedding);
  const numerals = day ? `${day}.${month}.${year}` : wedding.weddingDateLabel;

  return (
    <section
      id="topo"
      className={`${styles.hero} ${wedding.heroImage ? "" : styles.heroBare}`}
      aria-label={`Casamento de ${wedding.coupleNames}`}
    >
      <div className={`${styles.wrap} ${styles.heroInner}`}>
        <div className={`${styles.heroTop} hero-rise`}>
          <div>
            <p className={styles.heroDate}>{numerals}</p>
            <p className={styles.heroMeta}>
              {day ? wedding.weddingDateLabel : null}
              {wedding.weddingTime ? (day ? ` · ${wedding.weddingTime}` : wedding.weddingTime) : null}
            </p>
          </div>
          {location ? (
            <div className={styles.heroPlace}>
              <p className={styles.heroPlaceName}>{location.venue || location.city}</p>
              {location.venue && location.city ? <p className={styles.heroMeta}>{location.city}</p> : null}
            </div>
          ) : null}
        </div>

        {wedding.heroImage ? (
          <div className={`${styles.heroPhoto} hero-rise`} style={{ animationDelay: "120ms" }}>
            <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 900px) 28vw, 40vw" className={styles.heroImg} />
          </div>
        ) : null}

        <h1 className={`${styles.names} hero-rise`} data-scale={nameScale(wedding.coupleNames)} style={{ animationDelay: "200ms" }}>
          <span className={styles.nameLine}>{a}</span>
          {b ? (
            <span className={styles.nameLine}>
              <em className={styles.amp}>&</em>
              {b}
            </span>
          ) : null}
        </h1>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ countdown */

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
    <section className={`${styles.section} ${styles.paper}`} aria-label="Contagem regressiva">
      <div className={styles.wrap}>
        <Reveal y={8}>
          <p className={styles.eyebrow}>{c.isPast ? "Hoje é o dia" : "Faltam"}</p>
        </Reveal>
        {valid && !c.isPast ? (
          <Reveal className={styles.count} y={8} delay={0.05}>
            {units.map(([value, label]) => (
              <div key={label} className={styles.countCell}>
                <span className={styles.countNum}>{c.ready ? pad(value) : "00"}</span>
                <span className={styles.countLabel}>{label}</span>
              </div>
            ))}
          </Reveal>
        ) : (
          <Reveal y={8}>
            <p className={styles.h2}>{c.isPast ? wedding.weddingDateLabel : "A data vem em breve"}</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- gallery */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.section} aria-labelledby="pf-gallery">
      <div className={styles.wrap}>
        <Reveal y={8}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="pf-gallery" className={styles.h2}>
            Retratos
          </h2>
        </Reveal>
        <div className={styles.galleryGrid}>
          {images.map((img, i) => (
            <Reveal key={img.id} y={8} delay={(i % 3) * 0.04}>
              <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${img.alt}`}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={800}
                  height={800}
                  loading="lazy"
                  sizes="(min-width: 900px) 30vw, 33vw"
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
        classNames={{ dialog: styles.lightbox, close: styles.lightboxClose, figure: styles.lightboxFig, img: styles.lightboxImg, caption: styles.lightboxCaption, nav: styles.lightboxNav }}
      />
    </section>
  );
}
