"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { Public_Sans, Rosarivo } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { useMenu } from "@/components/templates/kit/hooks";
import { CANVAS } from "@/components/templates/kit/textures";
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
import styles from "./painted-memories.module.css";

const display = Rosarivo({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--pm-display",
  display: "swap"
});

const sans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--pm-sans",
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

/* Quadro: moldura dupla ocre, passe-partout e sombra interna curta sobre a tela. */
function Frame({ children, className, ratio }: { children: ReactNode; className?: string; ratio?: string }) {
  return (
    <div className={`${styles.frame} ${className ?? ""}`}>
      <div className={styles.canvas} style={ratio ? ({ "--pm-ratio": ratio } as CSSProperties) : undefined}>
        {children}
      </div>
    </div>
  );
}

/* Plaquinha de museu: retângulo pequeno em caixa alta. */
function Plate({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={`${styles.plate} ${className ?? ""}`}>{children}</p>;
}

/* Estudo: manchas de tinta (ocre, ardósia, musgo) quando não há foto. */
function Study({ label, seed = 0 }: { label: string; seed?: number }) {
  return (
    <div className={styles.study} data-seed={seed % 3} aria-hidden>
      <span className={styles.studyMark}>{label}</span>
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

export function PaintedMemoriesTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gifts = activeGifts(wedding);
  const photos = galleryRest(wedding);
  const place = location ? [location.venue, location.city].filter(Boolean).join(" · ") : "";

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template}`} style={{ "--pm-canvas": CANVAS } as CSSProperties}>
      <Nav wedding={wedding} />
      <Hero wedding={wedding} place={place} />

      {/* Convite: faixa ardósia-escura, texto tela, fio ocre */}
      <section id="convite" className={styles.invite} aria-labelledby="pm-invite">
        <Reveal className={styles.inviteCol} y={12}>
          <p className={styles.eyebrowLight}>Convite</p>
          <h2 id="pm-invite" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <span className={styles.ruleOcre} aria-hidden />
          <p className={styles.inviteText}>{wedding.welcomeText}</p>
        </Reveal>
      </section>

      {/* História: sala da galeria, quadros pendurados num fio */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="pm-story">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.storyHead} y={12}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="pm-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
          </div>
          <div className={`${styles.wrap} ${styles.rail}`}>
            <div className={styles.room}>
              {moments.map((moment, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(moment.headline);
                return (
                  <Reveal as="article" key={moment.id} className={styles.hung} delay={i * 0.07} y={12}>
                    <span className={styles.wire} aria-hidden />
                    <Frame className={styles.hungFrame}>
                      {img ? (
                        <Image src={img.src} alt={img.alt} width={900} height={1125} loading="lazy" sizes="(min-width: 900px) 30vw, 80vw" className={styles.img} />
                      ) : (
                        <Study label={moment.number} seed={i} />
                      )}
                    </Frame>
                    <Plate className={styles.hungPlate}>
                      <span>{moment.number}</span>
                      {moment.title}
                    </Plate>
                    {lines.length ? (
                      <h3 className={styles.chapterHeadline}>
                        {lines.map((line, k) => (
                          <span key={k}>{line}</span>
                        ))}
                      </h3>
                    ) : null}
                    {moment.description ? <p className={styles.body}>{moment.description}</p> : null}
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação: etiquetas de exposição */}
      {schedule.length ? (
        <section id="programacao" className={styles.program} aria-labelledby="pm-program">
          <div className={`${styles.wrap} ${styles.programGrid}`}>
            <Reveal as="header" className={styles.programHead} y={12}>
              <p className={styles.eyebrow}>Programação</p>
              <h2 id="pm-program" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.body}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.labels}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.label} delay={i * 0.05} y={12}>
                  <span className={styles.labelTime}>{item.time}</span>
                  <span className={styles.labelMain}>
                    <span className={styles.labelTitle}>{item.title}</span>
                    {item.note ? <span className={styles.labelNote}>{item.note}</span> : null}
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Local: mapa emoldurado como quadro com plaquinha */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="pm-place">
          <div className={`${styles.wrap} ${styles.placeGrid}`}>
            <Reveal className={styles.placeArt} y={12}>
              <Frame ratio="4 / 3">
                <iframe className={styles.map} src={mapEmbedUrl(location)} title={`Mapa: ${location.venue || location.city}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </Frame>
              <Plate className={styles.placePlate}>{place}</Plate>
            </Reveal>
            <Reveal className={styles.placeText} delay={0.08} y={12}>
              <p className={styles.eyebrow}>Local</p>
              <h2 id="pm-place" className={styles.h2}>
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

      {/* Cartões: plaquinhas grandes */}
      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={styles.wrap}>
            <ul className={styles.cardList}>
              {cards.map((card, i) => (
                <Reveal as="li" key={card.id} className={styles.card} delay={i * 0.06} y={12}>
                  {card.subtitle ? <p className={styles.cardSub}>{card.subtitle}</p> : null}
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  {card.body ? <p className={styles.cardBody}>{card.body}</p> : null}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Presentes */}
      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="pm-gifts">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.giftsHead} y={12}>
              <p className={styles.eyebrow}>Lista de presentes</p>
              <h2 id="pm-gifts" className={styles.h2}>
                Um gesto para a casa nova
              </h2>
              <p className={styles.lead}>Cada presente vai por Pix, direto para o casal, sem taxas nem intermediários.</p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

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
  const plateLine = [wedding.coupleNames, wedding.weddingDateLabel].filter(Boolean).join(" · ");
  return (
    <section id="topo" className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <div className={`${styles.wrap} ${styles.heroGrid}`}>
        <div className={styles.heroText}>
          <p className={`${styles.eyebrow} hero-rise`}>Convite de casamento</p>
          <div className="hero-rise" style={{ animationDelay: "120ms" }}>
            <Names names={wedding.coupleNames} />
          </div>
          <dl className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "240ms" }}>
            <div>
              <dt>Data</dt>
              <dd>{[wedding.weddingDateLabel, wedding.weddingTime].filter(Boolean).join(", ") || "Em breve"}</dd>
            </div>
            {place ? (
              <div>
                <dt>Local</dt>
                <dd>{place}</dd>
              </div>
            ) : null}
          </dl>
          <a href="#confirmar" className={`${styles.btn} ${styles.heroBtn} hero-rise`} style={{ animationDelay: "360ms" }}>
            Confirmar presença
          </a>
        </div>
        <div className={`${styles.heroArt} hero-rise`} style={{ animationDelay: "200ms" }}>
          <Frame className={styles.heroFrame}>
            {hasPhoto ? (
              <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 900px) 42vw, 100vw" className={styles.heroImg} />
            ) : (
              <Study label={wedding.monogram} />
            )}
          </Frame>
          <Plate className={styles.heroPlate}>{plateLine}</Plate>
        </div>
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
      <Reveal className={`${styles.wrap} ${styles.countInner}`} y={12}>
        <p className={styles.countEyebrow}>{hasDate && c.isPast ? "O grande dia" : "Contagem regressiva"}</p>
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
    </section>
  );
}

/* --------------------------------------------------------------- galeria */

function Gallery({ photos }: { photos: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="pm-gallery">
      <div className={styles.wrap}>
        <Reveal as="header" className={styles.galleryHead} y={12}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="pm-gallery" className={styles.h2}>
            Parede de retratos
          </h2>
        </Reveal>
        <ul className={styles.wall}>
          {photos.map((photo, i) => (
            <Reveal as="li" key={photo.id} className={styles.wallItem} delay={(i % 4) * 0.05} y={12}>
              <button type="button" className={styles.wallBtn} onClick={() => lb.open(i)} aria-label={`Ampliar: ${photo.alt}`}>
                <Frame className={styles.wallFrame}>
                  <Image src={photo.src} alt={photo.alt} width={800} height={1000} loading="lazy" sizes="(min-width: 1100px) 22vw, (min-width: 700px) 30vw, 44vw" className={styles.img} />
                </Frame>
                <span className={`${styles.plate} ${styles.wallPlate}`}>{photo.caption || photo.alt}</span>
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
    <section className={styles.closing} aria-label="Encerramento">
      <Reveal className={`${styles.wrap} ${styles.closingInner}`} y={12}>
        {wedding.footerImage ? (
          <Frame className={styles.closingFrame} ratio="3 / 2">
            <Image src={wedding.footerImage} alt="" fill loading="lazy" sizes="(min-width: 900px) 60vw, 100vw" className={styles.heroImg} />
          </Frame>
        ) : null}
        <div className={styles.closingPlate}>
          <p className={styles.closingKicker}>{wedding.monogram}</p>
          {wedding.finalText ? <p className={styles.closingWords}>{wedding.finalText}</p> : null}
          <a href="#confirmar" className={styles.btn}>
            Confirmar presença
          </a>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- rodapé */

function Footer({ wedding, place }: Props & { place: string }) {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.wrap} ${styles.footerInner}`}>
        <p className={styles.footerNames}>{wedding.coupleNames}</p>
        {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
        <p className={styles.footerMeta}>{[wedding.weddingDateLabel, place].filter(Boolean).join(" · ")}</p>
        <p className={styles.footerBrand}>Feito com Noivar</p>
      </div>
    </footer>
  );
}
