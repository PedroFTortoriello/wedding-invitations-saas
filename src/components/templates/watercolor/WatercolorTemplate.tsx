"use client";

import Image from "next/image";
import { Plus_Jakarta_Sans, Spectral } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, pad, useCountdown } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { WatercolorEdge, WatercolorWash } from "@/components/templates/kit/watercolor";
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
import styles from "./watercolor.module.css";

const display = Spectral({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--wc-display",
  display: "swap"
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--wc-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

/* Pigmentos: a cor é a tinta; a opacidade da lavagem fica no CSS (.washRose etc.). */
const ROSE = "#e7c9c0";
const SAGE = "#7a8f72";
const OCHRE = "#d9b26a";
const PIGMENTS = [
  { color: ROSE, cls: styles.washRose },
  { color: SAGE, cls: styles.washSage },
  { color: OCHRE, cls: styles.washOchre }
] as const;
/* Cor da faixa da contagem e da transição do convite (iguais aos fundos no CSS). */
const ROSE_TINT = "#f5e8e4";
const SAGE_TINT = "#eef1ea";

export function WatercolorTemplate({ wedding }: Props) {
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
      <Nav wedding={wedding} links={nav} />
      <Hero wedding={wedding} />

      {/* Convite: coluna estreita centrada; a lavagem sálvia escorre para a história */}
      <section id="convite" className={styles.invite} aria-labelledby="wc-invite">
        <Reveal className={styles.inviteInner}>
          <p className={styles.eyebrow}>O convite</p>
          <h2 id="wc-invite" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <p className={styles.inviteText}>{wedding.welcomeText}</p>
        </Reveal>
        {moments.length ? <WatercolorEdge color={SAGE_TINT} seed={5} className={styles.inviteEdge} /> : null}
      </section>

      {/* História: capítulos com uma mancha de cor diferente atrás de cada foto */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="wc-story">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.storyHead}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="wc-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
            <div className={styles.chapters}>
              {moments.map((moment, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(moment.headline);
                const pigment = PIGMENTS[i % PIGMENTS.length];
                return (
                  <Reveal as="article" key={moment.id} className={`${styles.chapter} ${i % 2 ? styles.chapterFlip : ""}`}>
                    <div className={styles.chapterArt}>
                      <WatercolorWash color={pigment.color} seed={11 + i * 3} className={`${styles.wash} ${pigment.cls} ${styles.chapterWash}`} />
                      {img ? (
                        <figure className={styles.cutout}>
                          <Image
                            src={img.src}
                            alt={img.alt}
                            width={720}
                            height={900}
                            loading="lazy"
                            sizes="(min-width: 900px) 34vw, 70vw"
                            className={styles.cutoutImg}
                          />
                        </figure>
                      ) : null}
                      <span className={styles.chapterNum} aria-hidden>
                        {moment.number}
                      </span>
                    </div>
                    <div className={styles.chapterText}>
                      <h3 className={styles.chapterTitle}>{moment.title}</h3>
                      {lines.length ? (
                        <p className={styles.chapterHeadline}>
                          {lines.map((line, k) => (
                            <span key={k}>{line}</span>
                          ))}
                        </p>
                      ) : null}
                      <p className={styles.body}>{moment.description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação: título fixo à esquerda, lista com pingos de aquarela à direita */}
      {schedule.length ? (
        <section id="programacao" className={styles.schedule} aria-labelledby="wc-schedule">
          <div className={`${styles.wrap} ${styles.scheduleGrid}`}>
            <Reveal as="header" className={styles.scheduleHead}>
              <p className={styles.eyebrow}>Programação</p>
              <h2 id="wc-schedule" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.list}>
              {schedule.map((item, i) => {
                const pigment = PIGMENTS[i % PIGMENTS.length];
                return (
                  <Reveal as="li" key={item.id} className={styles.item} delay={i * 0.05} y={12}>
                    <WatercolorWash color={pigment.color} seed={21 + i} className={`${styles.drop} ${pigment.cls}`} />
                    <span className={styles.itemTime}>{item.time}</span>
                    <span className={styles.itemMain}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      {item.note ? <span className={styles.itemNote}>{item.note}</span> : null}
                    </span>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Local: texto à esquerda, mapa em moldura branca grossa sobre uma mancha ocre */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="wc-place">
          <div className={`${styles.wrap} ${styles.placeGrid}`}>
            <Reveal className={styles.placeText}>
              <p className={styles.eyebrow}>Onde</p>
              <h2 id="wc-place" className={styles.h2}>
                {location.venue || location.city}
              </h2>
              <p className={styles.placeMeta}>{[location.venue ? location.city : "", location.address].filter(Boolean).join(" · ")}</p>
              {location.note ? <p className={styles.body}>{location.note}</p> : null}
              <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
                Abrir no Google Maps
              </a>
            </Reveal>
            <Reveal className={styles.mapArt} y={20}>
              <WatercolorWash color={OCHRE} seed={8} className={`${styles.wash} ${styles.washOchre} ${styles.mapWash}`} />
              <div className={styles.mapFrame}>
                <iframe
                  className={styles.map}
                  src={mapEmbedUrl(location)}
                  title={`Mapa: ${location.venue || location.city}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Cartões: blocos brancos com uma mancha clara escapando pelo canto */}
      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={styles.wrap}>
            <ul className={styles.cardList}>
              {cards.map((card, i) => {
                const pigment = PIGMENTS[i % PIGMENTS.length];
                return (
                  <Reveal as="li" key={card.id} className={styles.card} delay={i * 0.06}>
                    <span className={styles.cardWashClip} aria-hidden="true">
                      <WatercolorWash color={pigment.color} seed={31 + i} className={`${styles.wash} ${pigment.cls} ${styles.cardWash}`} />
                    </span>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    {card.subtitle ? <p className={styles.cardSub}>{card.subtitle}</p> : null}
                    {card.body ? <p className={styles.cardBody}>{card.body}</p> : null}
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="wc-gifts">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.giftsHead}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="wc-gifts" className={styles.h2}>
                Um gesto para a casa nova
              </h2>
              <p className={styles.lead}>Cada cota vai por Pix direto para o casal, sem taxas no caminho.</p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {photos.length ? <Gallery images={photos} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      {/* Encerramento: foto colada sobre uma mancha grande, frase em itálico */}
      <section className={`${styles.closing} ${wedding.footerImage ? "" : styles.closingNoPhoto}`} aria-label="Até lá">
        <div className={`${styles.wrap} ${styles.closingGrid}`}>
          <Reveal className={styles.closingText}>
            <p className={styles.eyebrow}>Até lá</p>
            <p className={styles.closingQuote}>{wedding.finalText}</p>
          </Reveal>
          <Reveal className={styles.closingArt} y={20}>
            <WatercolorWash color={ROSE} seed={41} className={`${styles.wash} ${styles.washRose} ${styles.closingWash}`} />
            {wedding.footerImage ? (
              <figure className={`${styles.cutout} ${styles.closingCutout}`}>
                <Image
                  src={wedding.footerImage}
                  alt=""
                  width={1200}
                  height={900}
                  loading="lazy"
                  sizes="(min-width: 900px) 44vw, 86vw"
                  className={styles.cutoutImg}
                />
              </figure>
            ) : (
              <WatercolorWash color={SAGE} seed={43} className={`${styles.wash} ${styles.washSage} ${styles.closingWash2}`} />
            )}
          </Reveal>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <p className={styles.footerText}>{wedding.footerText}</p>
          <p className={styles.footerMeta}>
            {[wedding.monogram, wedding.coupleNames, wedding.weddingDateLabel, location?.city, "Feito com Noivar"].filter(Boolean).join(" · ")}
          </p>
        </div>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ Nav */

function Nav({ wedding, links }: Props & { links: [string, string][] }) {
  const [open, toggle, close] = useMenu();
  const solid = useScrolled(40);
  return (
    <header className={`${styles.nav} ${solid || open ? styles.navSolid : ""}`}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <a href="#topo" className={styles.navMono} aria-label={wedding.coupleNames}>
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

/* ----------------------------------------------------------------- Capa */

function Hero({ wedding }: Props) {
  const [first, second] = splitCouple(wedding.coupleNames);
  const location = mainLocation(wedding);
  const hasPhoto = Boolean(wedding.heroImage);
  const slow = { animationDuration: "1.2s" };
  return (
    <section
      id="topo"
      className={`${styles.hero} ${hasPhoto ? "" : styles.heroNoPhoto}`}
      aria-label={`Casamento de ${wedding.coupleNames}`}
    >
      {hasPhoto ? (
        <div className={`${styles.heroStage} hero-rise`} style={{ ...slow, animationDelay: "60ms" }}>
          <WatercolorWash color={ROSE} seed={3} className={`${styles.wash} ${styles.washRose} ${styles.heroWash}`} />
          <figure className={`${styles.cutout} ${styles.heroCutout} hero-rise`} style={{ animationDelay: "260ms" }}>
            <span className={styles.heroImgBox}>
              <Image src={wedding.heroImage} alt="" fill priority sizes="100vw" className={styles.heroImg} />
            </span>
          </figure>
        </div>
      ) : null}

      <WatercolorWash color={SAGE} seed={6} className={`${styles.wash} ${styles.washSage} ${styles.heroWashSmall} hero-rise`} style={{ ...slow, animationDelay: "200ms" }} />

      <div className={styles.heroText}>
        {!hasPhoto ? (
          <>
            <WatercolorWash color={ROSE} seed={3} className={`${styles.wash} ${styles.washRose} ${styles.heroWashA} hero-rise`} style={slow} />
            <WatercolorWash color={SAGE} seed={9} className={`${styles.wash} ${styles.washSage} ${styles.heroWashB} hero-rise`} style={{ ...slow, animationDelay: "160ms" }} />
          </>
        ) : null}
        <h1 className={`${styles.names} hero-rise`} data-scale={nameScale(wedding.coupleNames)} style={{ animationDelay: "120ms" }}>
          <span className={styles.name}>{first}</span>
          {second ? (
            <>
              <span className={styles.amp} aria-hidden>
                &amp;
              </span>
              <span className={styles.srOnly}> e </span>
              <span className={styles.name}>{second}</span>
            </>
          ) : null}
        </h1>
        <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "240ms" }}>
          <span>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </span>
          {location ? <span>{[location.venue, location.city].filter(Boolean).join(" · ")}</span> : null}
        </p>
        {wedding.rsvp.enabled ? (
          <a href="#confirmar" className={`${styles.btn} hero-rise`} style={{ animationDelay: "360ms" }}>
            Confirmar presença
          </a>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Contagem */

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
    <section className={styles.count} aria-label="Contagem regressiva">
      <WatercolorEdge color={ROSE_TINT} seed={2} className={`${styles.countEdge} ${styles.countEdgeTop}`} />
      <Reveal className={`${styles.wrap} ${styles.countInner}`}>
        <p className={styles.eyebrow}>{c.isPast ? "Hoje é o dia" : "Contagem regressiva"}</p>
        {valid && !c.isPast ? (
          <div className={styles.units}>
            {units.map(([value, label]) => (
              <span key={label} className={styles.unit}>
                <span className={styles.unitNum}>{c.ready ? pad(value) : "–"}</span>
                <span className={styles.unitLabel}>{label}</span>
              </span>
            ))}
          </div>
        ) : null}
        <p className={styles.countDate}>{wedding.weddingDateLabel}</p>
      </Reveal>
      <WatercolorEdge color={ROSE_TINT} seed={7} className={`${styles.countEdge} ${styles.countEdgeBottom}`} />
    </section>
  );
}

/* --------------------------------------------------------------- Galeria */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="wc-gallery">
      <div className={styles.wrap}>
        <Reveal as="header" className={styles.galleryHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="wc-gallery" className={styles.h2}>
            Recortes dos dois
          </h2>
        </Reveal>
        <div className={styles.galleryGrid}>
          {images.map((image, i) => (
            <Reveal key={image.id} className={styles.shot} delay={(i % 3) * 0.05} y={14}>
              <button type="button" className={styles.shotBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${image.alt}`}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={900}
                  height={1100}
                  loading="lazy"
                  sizes="(min-width: 900px) 30vw, 46vw"
                  className={styles.shotImg}
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
          close: styles.lbClose,
          nav: styles.lbNav,
          figure: styles.lbFig,
          img: styles.lbImg,
          caption: styles.lbCap
        }}
      />
    </section>
  );
}
