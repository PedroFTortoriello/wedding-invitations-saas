"use client";

import Image from "next/image";
import { Epilogue, Instrument_Serif } from "next/font/google";
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
import styles from "./contemporary-contrast.module.css";

const sans = Epilogue({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--cc-sans",
  display: "swap"
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--cc-serif",
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

/** "Nome Sobrenome" -> ["Nome", "Sobrenome"]: primeiro nome em sans 800, o resto em serif itálica. */
function splitName(name: string): [string, string] {
  const [first, ...rest] = name.trim().split(/\s+/);
  return [first ?? "", rest.join(" ")];
}

export function ContemporaryContrastTemplate({ wedding }: Props) {
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

      {/* Convite: faixa tinta full-bleed, frase em serif itálica grande */}
      <section id="convite" className={styles.invite} aria-labelledby="cc-invite">
        <div className={styles.wrap}>
          <Reveal className={styles.inviteGrid} y={12}>
            <p className={styles.eyebrowChalk}>
              <span className={styles.sq} aria-hidden="true" />
              Convite
            </p>
            <h2 id="cc-invite" className={styles.inviteWords}>
              {wedding.invitationWords.join(" ")}
            </h2>
            <p className={styles.inviteText}>{wedding.welcomeText}</p>
          </Reveal>
        </div>
      </section>

      {/* História: capítulos em grade, fotos 2:3 estreitas, blocos giz/oliva atrás do texto */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="cc-story">
          <div className={styles.wrap}>
            <Reveal className={styles.storyHead} y={12}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="cc-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
            <div className={styles.chapters}>
              {moments.map((m, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(m.headline);
                const olive = i % 2 === 1;
                return (
                  <Reveal as="article" key={m.id} className={`${styles.chapter} ${olive ? styles.chapterOlive : ""}`} y={12} delay={(i % 2) * 0.08}>
                    {img ? (
                      <div className={styles.chapterMedia}>
                        <Image src={img.src} alt={img.alt} width={600} height={900} loading="lazy" sizes="(min-width: 900px) 18vw, 38vw" className={styles.chapterImg} />
                      </div>
                    ) : null}
                    <div className={styles.chapterBody}>
                      <span className={styles.numBox}>{m.number}</span>
                      <p className={styles.chapterTitle}>{m.title}</p>
                      {lines.length ? (
                        <h3 className={styles.chapterHeadline}>
                          {lines.map((line, k) => (
                            <span key={k}>{k === 0 ? line.charAt(0).toUpperCase() + line.slice(1) : line}</span>
                          ))}
                        </h3>
                      ) : null}
                      <p className={styles.chapterText}>{m.description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação: split assimétrico, tabela com fios 2px */}
      {schedule.length ? (
        <section id="programa" className={styles.program} aria-labelledby="cc-program">
          <div className={`${styles.wrap} ${styles.programGrid}`}>
            <Reveal className={styles.programHead} y={12}>
              <p className={styles.eyebrow}>Programa</p>
              <h2 id="cc-program" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.body}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <Reveal as="ol" className={styles.table} y={12} delay={0.08}>
              {schedule.map((item) => (
                <li key={item.id} className={styles.row}>
                  <span className={styles.time}>{item.time}</span>
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>{item.title}</span>
                    {item.note ? <span className={styles.rowNote}>{item.note}</span> : null}
                  </span>
                </li>
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Local: mapa com borda tinta, bloco oliva sobreposto com o endereço */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="cc-place">
          <div className={styles.wrap}>
            <Reveal className={styles.placeGrid} y={12}>
              <div className={styles.mapBox}>
                <iframe
                  className={styles.map}
                  src={mapEmbedUrl(location)}
                  title={`Mapa: ${location.venue || location.city}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className={styles.placeCard}>
                <p className={styles.eyebrowChalk}>
                  <span className={styles.sq} aria-hidden="true" />
                  Local
                </p>
                <h2 id="cc-place" className={styles.placeName}>
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

      {/* Cartões: blocos com borda 2px e quadrado coral */}
      {cards.length ? (
        <section className={styles.cardsSection} aria-label="Informações">
          <div className={`${styles.wrap} ${styles.cards}`}>
            {cards.map((card, i) => (
              <Reveal as="article" key={card.id} className={styles.card} y={12} delay={(i % 3) * 0.06}>
                <span className={styles.sqBig} aria-hidden="true" />
                <h3 className={styles.cardTitle}>{card.title}</h3>
                {card.subtitle ? <p className={styles.cardSub}>{card.subtitle}</p> : null}
                <p className={styles.cardBody}>{card.body}</p>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* Presentes */}
      {hasGifts ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="cc-gifts">
          <div className={styles.wrap}>
            <Reveal className={styles.giftsHead} y={12}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="cc-gifts" className={styles.h2}>
                Um gesto <em className={styles.em}>para a casa nova</em>
              </h2>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {gallery.length ? <Gallery images={gallery} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      {/* Encerramento: tinta, texto serif itálico giz, foto com recorte coral */}
      <section className={styles.closing} aria-label="Encerramento">
        <div className={`${styles.wrap} ${styles.closingGrid}`}>
          <Reveal y={12}>
            <p className={styles.eyebrowChalk}>
              <span className={styles.sq} aria-hidden="true" />
              Até lá
            </p>
            <p className={styles.closingText}>{wedding.finalText}</p>
          </Reveal>
          {wedding.footerImage ? (
            <Reveal className={styles.closingMedia} y={12} delay={0.1}>
              <Image src={wedding.footerImage} alt="" width={700} height={900} loading="lazy" sizes="(min-width: 900px) 24vw, 60vw" className={styles.closingImg} />
              <span className={styles.closingCoral} aria-hidden="true" />
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* Rodapé: faixa coral com tipografia grande em tinta (3,4:1 só em texto grande) + tira tinta com o miúdo */}
      <footer className={styles.footer}>
        <div className={styles.footerCoral}>
          <div className={`${styles.wrap} ${styles.footerBig}`}>
            <span className={styles.footerNames}>{wedding.coupleNames}</span>
            <span className={styles.footerDate}>
              {wedding.weddingDateLabel}
              {location?.city ? ` · ${location.city}` : ""}
            </span>
          </div>
        </div>
        <div className={`${styles.wrap} ${styles.footerSmall}`}>
          <span className={styles.footerMono}>{wedding.monogram}</span>
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

function NameBlock({ name, delay }: { name: string; delay: string }) {
  const [first, rest] = splitName(name);
  return (
    <span className={`${styles.name} hero-rise`} style={{ animationDelay: delay }}>
      <span className={styles.nameFirst}>{first}</span>
      {rest ? <span className={styles.nameRest}>{rest}</span> : null}
    </span>
  );
}

function Hero({ wedding }: Props) {
  const [a, b] = splitCouple(wedding.coupleNames);
  const { day, month, year } = dateParts(wedding);
  const location = mainLocation(wedding);
  const numerals = day ? `${day}.${month}.${year}` : "";
  const place = location ? [location.venue, location.city].filter(Boolean).join(", ") : "";

  return (
    <section id="topo" className={`${styles.hero} ${wedding.heroImage ? "" : styles.heroBare}`} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <div className={styles.heroLeft}>
        <p className={`${styles.eyebrow} hero-rise`}>
          <span className={styles.sq} aria-hidden="true" />
          Vamos casar
        </p>
        <h1 className={styles.names} data-scale={nameScale(wedding.coupleNames)}>
          <NameBlock name={a} delay="80ms" />
          {b ? (
            <>
              <span className={`${styles.amp} hero-rise`} style={{ animationDelay: "160ms" }} aria-hidden="true">
                &
              </span>
              <span className={styles.srOnly}> e </span>
              <NameBlock name={b} delay="240ms" />
            </>
          ) : null}
        </h1>
      </div>

      <div className={styles.heroRight}>
        {wedding.heroImage ? (
          <>
            <div className={`${styles.heroPhoto} hero-rise`} style={{ animationDelay: "120ms" }}>
              <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 900px) 50vw, 100vw" className={styles.heroImg} />
              <span className={styles.heroCoral} aria-hidden="true" />
            </div>
            <div className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "280ms" }}>
              <span className={styles.heroDate}>{numerals || wedding.weddingDateLabel}</span>
              <span className={styles.heroMetaText}>
                {numerals ? wedding.weddingDateLabel : null}
                {wedding.weddingTime ? (numerals ? ` · ${wedding.weddingTime}` : wedding.weddingTime) : null}
                {place ? <span className={styles.heroPlace}>{place}</span> : null}
              </span>
            </div>
          </>
        ) : (
          <div className={`${styles.heroBareInner} hero-rise`} style={{ animationDelay: "160ms" }}>
            {numerals ? (
              <span className={styles.heroBigDate}>
                <span>{day}</span>
                <span>{month}</span>
                <span>{year}</span>
              </span>
            ) : (
              <span className={`${styles.heroBigDate} ${styles.heroBigLabel}`}>{wedding.weddingDateLabel}</span>
            )}
            {numerals || wedding.weddingTime || place ? (
              <span className={styles.heroBareMeta}>
                {numerals ? wedding.weddingDateLabel : null}
                {wedding.weddingTime ? (numerals ? ` · ${wedding.weddingTime}` : wedding.weddingTime) : null}
                {place ? <span className={styles.heroPlace}>{place}</span> : null}
              </span>
            ) : null}
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
  const small: Array<[number, string]> = [
    [c.hours, "horas"],
    [c.minutes, "minutos"],
    [c.seconds, "segundos"]
  ];

  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <div className={styles.wrap}>
        <Reveal y={12}>
          <p className={styles.eyebrow}>
            <span className={styles.sq} aria-hidden="true" />
            {c.isPast ? "Hoje é o dia" : "Contagem regressiva"}
          </p>
        </Reveal>
        {valid && !c.isPast ? (
          <Reveal className={styles.countGrid} y={12} delay={0.06}>
            <p className={styles.countBig}>
              <span className={styles.countDays}>{c.ready ? c.days : 0}</span>
              <em className={styles.countUnit}>dias</em>
            </p>
            <ul className={styles.countSmall}>
              {small.map(([value, label]) => (
                <li key={label} className={styles.countCell}>
                  <span className={styles.countNum}>{c.ready ? pad(value) : "00"}</span>
                  <em className={styles.countLabel}>{label}</em>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : (
          <Reveal y={12}>
            <p className={styles.countFallback}>{c.isPast ? wedding.weddingDateLabel : "A data vem em breve"}</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- gallery */

const RATIOS = [styles.r23, styles.r11, styles.r32] as const;

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="cc-gallery">
      <div className={styles.wrap}>
        <Reveal className={styles.galleryHead} y={12}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="cc-gallery" className={styles.h2}>
            Retratos <em className={styles.em}>dos dois</em>
          </h2>
        </Reveal>
        <div className={styles.galleryCols}>
          {images.map((img, i) => (
            <Reveal key={img.id} className={styles.galleryItem} y={12} delay={(i % 3) * 0.05}>
              <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${img.alt}`}>
                <Image src={img.src} alt={img.alt} width={800} height={1000} loading="lazy" sizes="(min-width: 900px) 30vw, 48vw" className={`${styles.galleryImg} ${RATIOS[i % 3]}`} />
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
