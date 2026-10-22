"use client";

import Image from "next/image";
import { DM_Sans, Newsreader } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, pad, useCountdown } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { useMenu, useScrolled } from "@/components/templates/kit/hooks";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import {
  activeCards,
  activeGifts,
  dateParts,
  headlineLines,
  mainLocation,
  mapEmbedUrl,
  mapLink,
  monthName,
  nameScale,
  program,
  splitCouple,
  storyMoments
} from "@/components/templates/kit/utils";
import styles from "./soft-minimal.module.css";

const display = Newsreader({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--sm-display",
  display: "swap"
});

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--sm-sans",
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

export function SoftMinimalTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gallery = galleryRest(wedding);
  const hasGifts = activeGifts(wedding).length > 0;
  const words = wedding.invitationWords.filter((w) => w.trim());

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template}`}>
      <Nav wedding={wedding} />
      <Hero wedding={wedding} />

      {/* Convite: coluna estreita, respiro curto */}
      {words.length || wedding.welcomeText ? (
        <section id="convite" className={styles.invite} aria-labelledby="invite-title">
          <Reveal className={styles.inviteCol} duration={0.8}>
            <p className={styles.eyebrow}>O convite</p>
            {words.length ? (
              <h2 id="invite-title" className={styles.inviteWords}>
                {words.join(" ")}
              </h2>
            ) : null}
            {wedding.welcomeText ? <p className={styles.inviteText}>{wedding.welcomeText}</p> : null}
          </Reveal>
        </section>
      ) : null}

      {/* História: capítulos em fita, foto em círculo alternando de lado */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="story-title">
          <Reveal className={styles.storyHead} duration={0.8}>
            {wedding.storyEyebrow ? <p className={styles.eyebrow}>{wedding.storyEyebrow}</p> : null}
            <h2 id="story-title" className={styles.h2}>
              {wedding.storyTitle}
            </h2>
          </Reveal>
          <ol className={styles.ribbons}>
            {moments.map((moment, i) => {
              const img = storyImage(wedding.gallery, i);
              const lines = headlineLines(moment.headline);
              return (
                <Reveal as="li" key={moment.id} className={styles.ribbon} duration={0.8} y={20}>
                  <div className={styles.ribbonInner} data-flip={i % 2 === 1 ? "" : undefined}>
                    {img ? (
                      <div className={styles.ribbonPhoto}>
                        <Image
                          src={img.src}
                          alt={img.alt}
                          width={640}
                          height={640}
                          loading="lazy"
                          sizes="(min-width: 860px) 260px, 180px"
                          className={styles.ribbonImg}
                        />
                      </div>
                    ) : (
                      <span className={styles.ribbonNum} aria-hidden>
                        {moment.number}
                      </span>
                    )}
                    <div className={styles.ribbonText}>
                      {moment.title ? (
                        <p className={styles.kicker}>
                          {img ? `${moment.number} · ` : ""}
                          {moment.title}
                        </p>
                      ) : null}
                      {lines.length ? (
                        <h3 className={styles.h3}>
                          {lines.map((line, k) => (
                            <span key={k} className={styles.line}>
                              {line}
                            </span>
                          ))}
                        </h3>
                      ) : null}
                      {moment.description ? <p className={styles.body}>{moment.description}</p> : null}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação: lista com horário em itálico */}
      {schedule.length ? (
        <section id="programacao" className={styles.schedule} aria-labelledby="schedule-title">
          <div className={styles.scheduleGrid}>
            <Reveal className={styles.scheduleHead} duration={0.8}>
              <p className={styles.eyebrow}>O dia</p>
              <h2 id="schedule-title" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.body}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.timeline}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.slot} duration={0.8} delay={i * 0.06} y={12}>
                  <span className={styles.slotTime}>{item.time}</span>
                  <span className={styles.slotMain}>
                    <span className={styles.slotTitle}>{item.title}</span>
                    {item.note ? <span className={styles.slotNote}>{item.note}</span> : null}
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Local: texto acima, mapa arredondado abaixo */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="place-title">
          <Reveal className={styles.placeHead} duration={0.8}>
            <p className={styles.eyebrow}>Onde</p>
            <h2 id="place-title" className={styles.h2}>
              {location.venue || location.city}
            </h2>
            <p className={styles.placeMeta}>
              {[location.venue ? location.city : "", location.address].filter(Boolean).join(" · ")}
            </p>
            {location.note ? <p className={styles.body}>{location.note}</p> : null}
            <a className={styles.pill} href={mapLink(location)} target="_blank" rel="noreferrer">
              Abrir no mapa
            </a>
          </Reveal>
          <Reveal className={styles.map} duration={0.8} y={24}>
            <iframe
              className={styles.mapFrame}
              src={mapEmbedUrl(location)}
              title={`Mapa: ${location.venue || location.city}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>
        </section>
      ) : null}

      {/* Cartões de informação: três colunas rosa-pó, sem sombra */}
      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <ul className={styles.cardGrid}>
            {cards.map((card, i) => (
              <Reveal as="li" key={card.id} className={styles.card} duration={0.8} delay={i * 0.08}>
                {card.subtitle ? <p className={styles.kicker}>{card.subtitle}</p> : null}
                <h3 className={styles.cardTitle}>{card.title}</h3>
                {card.body ? <p className={styles.cardBody}>{card.body}</p> : null}
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Presentes */}
      {hasGifts ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="gifts-title">
          <Reveal className={styles.giftsHead} duration={0.8}>
            <p className={styles.eyebrow}>Presentes</p>
            <h2 id="gifts-title" className={styles.h2}>
              Um gesto para a casa nova
            </h2>
            <p className={styles.body}>
              Cada presente é um Pix direto para o casal, sem taxas e sem intermediários.
            </p>
          </Reveal>
          <GiftRegistry wedding={wedding} variant="inherit" />
        </section>
      ) : null}

      {gallery.length ? <Gallery images={gallery} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      <Closing wedding={wedding} />
      <Footer wedding={wedding} />
    </main>
  );
}

/* ------------------------------------------------------------------ nav */

function Nav({ wedding }: Props) {
  const scrolled = useScrolled(40);
  const [open, toggle, close] = useMenu();
  return (
    <header className={styles.nav} data-solid={scrolled || open ? "" : undefined}>
      <div className={styles.navRow}>
        <a href="#top" className={styles.navMono} aria-label={wedding.coupleNames}>
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
  const location = mainLocation(wedding);
  const place = location ? [location.venue, location.city].filter(Boolean).join(", ") : "";
  const { day, year } = dateParts(wedding);
  const month = monthName(wedding);

  return (
    <section id="top" className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <div className={styles.heroText}>
        <p className={`${styles.eyebrow} hero-rise`}>Vamos nos casar</p>
        <h1 className={`${styles.names} hero-rise`} data-scale={nameScale(wedding.coupleNames)} style={{ animationDelay: "120ms" }}>
          <span className={styles.name}>{a}</span>
          {b ? (
            <>
              <em className={styles.amp} aria-hidden>
                &amp;
              </em>
              <span className={styles.name}>{b}</span>
            </>
          ) : null}
        </h1>
        <div className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "240ms" }}>
          {wedding.heroImage || day ? (
            <p className={styles.heroDate}>
              {wedding.weddingDateLabel}
              {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
            </p>
          ) : null}
          {place ? <p className={styles.heroPlace}>{place}</p> : null}
        </div>
      </div>

      <div className={`${styles.arch} ${wedding.heroImage ? "" : styles.archEmpty} hero-rise`} style={{ animationDelay: "200ms" }}>
        {wedding.heroImage ? (
          <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 900px) 55vw, 100vw" className={styles.archImg} />
        ) : (
          <div className={styles.archDate} aria-hidden>
            {day ? (
              <>
                <span className={styles.archDay}>{day}</span>
                <span className={styles.archMonth}>
                  {month}
                  <br />
                  {year}
                </span>
              </>
            ) : (
              <span className={styles.archMonth}>{wedding.weddingDateLabel}</span>
            )}
          </div>
        )}
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
    [c.minutes, "min"],
    [c.seconds, "seg"]
  ];
  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <Reveal duration={0.8}>
        <p className={styles.eyebrow}>{!valid ? "Quando" : c.isPast ? "Hoje é o dia" : "Faltam"}</p>
        {valid && !c.isPast ? (
          <p className={styles.countLine}>
            {units.map(([value, label], i) => (
              <span key={label} className={styles.countUnit}>
                <span className={styles.countNum}>{c.ready ? (i === 0 ? String(value) : pad(value)) : "—"}</span>
                <span className={styles.countLabel}>{label}</span>
              </span>
            ))}
          </p>
        ) : null}
        <p className={styles.countDate}>{wedding.weddingDateLabel}</p>
      </Reveal>
    </section>
  );
}

/* -------------------------------------------------------------- gallery */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="gallery-title">
      <Reveal className={styles.galleryHead} duration={0.8}>
        <p className={styles.eyebrow}>Galeria</p>
        <h2 id="gallery-title" className={styles.h2}>
          Alguns instantes
        </h2>
      </Reveal>
      <div className={styles.galleryGrid}>
        {images.map((image, i) => (
          <Reveal key={image.id} duration={0.8} delay={(i % 2) * 0.08} y={16}>
            <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${image.alt}`}>
              <Image
                src={image.src}
                alt={image.alt}
                width={900}
                height={1125}
                loading="lazy"
                sizes="(min-width: 900px) 36vw, 50vw"
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
          caption: styles.lightboxCaption
        }}
      />
    </section>
  );
}

/* -------------------------------------------------------------- closing */

function Closing({ wedding }: Props) {
  if (!wedding.finalText && !wedding.footerImage) return null;
  return (
    <section className={styles.closing} aria-label="Encerramento">
      {wedding.footerImage ? (
        <Reveal className={styles.closingArch} duration={0.8} y={24}>
          <Image src={wedding.footerImage} alt="" width={1400} height={1000} loading="lazy" sizes="(min-width: 900px) 760px, 100vw" className={styles.closingImg} />
        </Reveal>
      ) : null}
      {wedding.finalText ? (
        <Reveal className={`${styles.closingBlock} ${wedding.footerImage ? styles.overlap : ""}`} duration={0.8}>
          <p className={styles.closingText}>{wedding.finalText}</p>
          <p className={styles.closingSign}>{wedding.coupleNames}</p>
        </Reveal>
      ) : null}
    </section>
  );
}

/* --------------------------------------------------------------- footer */

function Footer({ wedding }: Props) {
  const city = wedding.locations[0]?.city;
  return (
    <footer className={styles.footer}>
      <p className={styles.footerMono}>{wedding.monogram}</p>
      {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
      <p className={styles.footerMeta}>
        {[wedding.coupleNames, wedding.weddingDateLabel, city].filter(Boolean).join(" · ")}
      </p>
      <p className={styles.footerCredit}>Feito com Noivar</p>
    </footer>
  );
}
