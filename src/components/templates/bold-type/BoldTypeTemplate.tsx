"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { Unbounded, Schibsted_Grotesk } from "next/font/google";
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
  firstNames,
  headlineLines,
  mainLocation,
  mapEmbedUrl,
  mapLink,
  program,
  splitCouple,
  storyMoments
} from "@/components/templates/kit/utils";
import styles from "./bold-type.module.css";

const display = Unbounded({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--bt-display",
  display: "swap"
});

const text = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--bt-text",
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

export function BoldTypeTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gallery = galleryRest(wedding);
  const hasGifts = activeGifts(wedding).length > 0;

  return (
    <main className={`${display.variable} ${text.variable} ${styles.template}`}>
      <Nav wedding={wedding} />
      <Hero wedding={wedding} />

      {/* Convite: faixa preta, coluna deslocada para a direita */}
      <section id="convite" className={styles.invite} aria-labelledby="bt-invite">
        <div className={`${styles.wrap} ${styles.inviteGrid}`}>
          <Reveal className={styles.inviteSide} y={24}>
            <span className={styles.chip} aria-hidden />
            <p className={styles.eyebrowOnBlack}>Convite</p>
          </Reveal>
          <Reveal className={styles.inviteMain} y={24} delay={0.06}>
            <h2 id="bt-invite" className={styles.inviteWords}>
              {wedding.invitationWords.join(" ")}
            </h2>
            {wedding.welcomeText ? <p className={styles.inviteText}>{wedding.welcomeText}</p> : null}
          </Reveal>
        </div>
      </section>

      {/* História: capítulos em blocos alternados giz/preto, número gigante atrás */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="bt-story">
          <div className={`${styles.wrap} ${styles.storyHead}`}>
            <Reveal y={24}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="bt-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
          </div>
          {moments.map((m, i) => {
            const img = storyImage(wedding.gallery, i);
            const lines = headlineLines(m.headline);
            const dark = i % 2 === 1;
            return (
              <article key={m.id} className={`${styles.chapter} ${dark ? styles.chapterDark : ""}`}>
                <span className={styles.chapterNum} aria-hidden>
                  {m.number}
                </span>
                <div className={`${styles.wrap} ${styles.chapterGrid} ${img ? "" : styles.chapterNoImg}`}>
                  {img ? (
                    <Reveal className={styles.chapterMedia} y={24}>
                      <Image
                        src={img.src}
                        alt={img.alt}
                        width={1000}
                        height={1250}
                        loading="lazy"
                        sizes="(min-width: 900px) 40vw, 100vw"
                        className={styles.chapterImg}
                      />
                    </Reveal>
                  ) : null}
                  <Reveal className={styles.chapterBody} y={24} delay={0.06}>
                    <p className={styles.chapterKicker}>
                      <span className={styles.chapterIndex}>{m.number}</span>
                      {m.title}
                    </p>
                    {lines.length ? (
                      <h3 className={styles.chapterHeadline}>
                        {lines.map((line, k) => (
                          <span key={k}>{line}</span>
                        ))}
                      </h3>
                    ) : null}
                    {m.description ? <p className={styles.body}>{m.description}</p> : null}
                  </Reveal>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação: lista com fios pretos de 2px */}
      {schedule.length ? (
        <section id="programa" className={styles.section} aria-labelledby="bt-program">
          <div className={`${styles.wrap} ${styles.programGrid}`}>
            <Reveal className={styles.programHead} y={24}>
              <p className={styles.eyebrow}>Programa</p>
              <h2 id="bt-program" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.body}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.program}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.programRow} y={24} delay={i * 0.04}>
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

      {/* Local: texto em cima, mapa em moldura preta 3px */}
      {location ? (
        <section id="local" className={`${styles.section} ${styles.place}`} aria-labelledby="bt-place">
          <div className={styles.wrap}>
            <Reveal className={styles.placeHead} y={24}>
              <div>
                <p className={styles.eyebrow}>Local</p>
                <h2 id="bt-place" className={styles.placeName}>
                  {location.venue || location.city}
                </h2>
                {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
              </div>
              <div className={styles.placeInfo}>
                {location.address ? <p className={styles.body}>{location.address}</p> : null}
                {location.note ? <p className={styles.body}>{location.note}</p> : null}
                <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
                  Abrir no mapa
                </a>
              </div>
            </Reveal>
            <Reveal className={styles.mapFrame} y={24} delay={0.06}>
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

      {/* Cartões: blocos com borda preta 2px */}
      {cards.length ? (
        <section className={styles.section} aria-label="Informações">
          <div className={`${styles.wrap} ${styles.cards}`}>
            {cards.map((card, i) => (
              <Reveal as="article" key={card.id} className={styles.card} y={24} delay={i * 0.05}>
                {card.subtitle ? <p className={styles.eyebrow}>{card.subtitle}</p> : null}
                <h3 className={styles.cardTitle}>{card.title}</h3>
                {card.body ? <p className={styles.body}>{card.body}</p> : null}
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* Presentes */}
      {hasGifts ? (
        <section id="presentes" className={`${styles.section} ${styles.gifts}`} aria-labelledby="bt-gifts">
          <div className={styles.wrap}>
            <Reveal className={styles.giftsHead} y={24}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="bt-gifts" className={styles.h2}>
                Um presente para a casa nova
              </h2>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {gallery.length ? <Gallery images={gallery} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      {/* Encerramento: preto, finalText em Unbounded, foto com contraste */}
      <section className={styles.closing} aria-label="Encerramento">
        <div className={`${styles.wrap} ${styles.closingGrid} ${wedding.footerImage ? "" : styles.closingNoImg}`}>
          <Reveal className={styles.closingBody} y={24}>
            <span className={styles.chip} aria-hidden />
            <p className={styles.closingText}>{wedding.finalText}</p>
          </Reveal>
          {wedding.footerImage ? (
            <Reveal className={styles.closingMedia} y={24} delay={0.06}>
              <Image
                src={wedding.footerImage}
                alt=""
                width={900}
                height={1125}
                loading="lazy"
                sizes="(min-width: 900px) 36vw, 100vw"
                className={styles.closingImg}
              />
            </Reveal>
          ) : null}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerGrid}`}>
          <p className={styles.footerMono}>{wedding.monogram}</p>
          <div className={styles.footerMeta}>
            <p className={styles.footerNames}>{wedding.coupleNames}</p>
            <p>
              {wedding.weddingDateLabel}
              {location?.city ? ` · ${location.city}` : ""}
            </p>
            {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
          </div>
          <p className={styles.footerCredit}>Feito com Noivar</p>
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

/* ----------------------------------------------------------------- capa */

function Hero({ wedding }: Props) {
  const [fullA, fullB] = splitCouple(wedding.coupleNames);
  const [a, b] = firstNames(wedding.coupleNames);
  const surnameA = fullA.slice(a.length).trim();
  const surnameB = fullB.slice(b.length).trim();
  const surnames = [surnameA, surnameB].filter(Boolean).join(" · ");
  const location = mainLocation(wedding);
  const { day, month, year } = dateParts(wedding);
  // ponytail: a largura do nome é estimada por contagem de letras (CSS puro, sem medir no cliente)
  const chars = Math.max(a.length, b.length, 4);
  const meta = [wedding.weddingDateLabel, wedding.weddingTime, location ? [location.venue, location.city].filter(Boolean).join(", ") : ""]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <section id="topo" className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <div className={`${styles.wrap} ${styles.heroWrap}`}>
        <h1 className={styles.names} style={{ "--bt-chars": chars } as CSSProperties}>
          <span className={`${styles.nameLine} hero-rise`}>{a}</span>
          {b ? (
            <>
              <span className={`${styles.ampRow} hero-rise`} style={{ animationDelay: "120ms" }} aria-hidden>
                <span className={styles.amp}>&amp;</span>
                <span className={styles.ampRule} />
              </span>
              <span className={`${styles.nameLine} hero-rise`} style={{ animationDelay: "200ms" }}>
                {b}
              </span>
            </>
          ) : null}
        </h1>

        <div className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "300ms" }}>
          {surnames ? <p className={styles.heroSurnames}>{surnames}</p> : null}
          {meta ? <p className={styles.heroLine}>{meta}</p> : null}
        </div>
      </div>

      {wedding.heroImage ? (
        <div className={`${styles.strip} hero-rise`} style={{ animationDelay: "380ms" }}>
          <Image src={wedding.heroImage} alt="" fill priority sizes="100vw" className={styles.stripImg} />
        </div>
      ) : (
        <div className={`${styles.strip} ${styles.stripBare} hero-rise`} style={{ animationDelay: "380ms" }}>
          <p className={styles.stripDate}>{day ? `${day}.${month}.${year}` : wedding.weddingDateLabel || "Em breve"}</p>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ contagem */

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
        <Reveal className={styles.countHead} y={24}>
          <p className={styles.eyebrowOnOrange}>{c.isPast ? "Hoje é o dia" : "Faltam"}</p>
          <p className={styles.countDate}>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </p>
        </Reveal>
        {valid && !c.isPast ? (
          <Reveal className={styles.countGrid} y={24} delay={0.06}>
            {units.map(([value, label]) => (
              <div key={label} className={styles.countCell}>
                <span className={styles.countNum}>{c.ready ? pad(value) : "00"}</span>
                <span className={styles.countLabel}>{label}</span>
              </div>
            ))}
          </Reveal>
        ) : (
          <Reveal y={24} delay={0.06}>
            <p className={styles.countFallback}>{c.isPast ? "O grande dia chegou" : "A data vem em breve"}</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- galeria */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.galleryWrap} aria-labelledby="bt-gallery">
      <div className={`${styles.wrap} ${styles.galleryHead}`}>
        <Reveal y={24}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="bt-gallery" className={styles.h2}>
            Retratos
          </h2>
        </Reveal>
      </div>
      <div className={styles.gallery}>
        {images.map((img, i) => (
          <Reveal key={img.id} className={styles.galleryCell} y={24} delay={(i % 4) * 0.04}>
            <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${img.alt}`}>
              <Image
                src={img.src}
                alt={img.alt}
                width={800}
                height={800}
                loading="lazy"
                sizes="(min-width: 900px) 25vw, 50vw"
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
          figure: styles.lightboxFig,
          img: styles.lightboxImg,
          caption: styles.lightboxCaption,
          nav: styles.lightboxNav
        }}
      />
    </section>
  );
}
