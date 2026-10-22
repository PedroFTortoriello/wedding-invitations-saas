"use client";

import Image from "next/image";
import { Cormorant_Garamond, Nunito_Sans } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { useMenu } from "@/components/templates/kit/hooks";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { EucalyptusSprig, FernFrond, LaurelWreath, OliveBranch } from "@/components/templates/kit/ornaments";
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
import styles from "./botanical-garden.module.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--bt-display",
  display: "swap"
});

const sans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--bt-sans",
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

/* Jardim Botânico — herbário: creme de papel, traço fino verde-folha, etiquetas
   de coleção. As folhagens saem por trás das molduras; nada de caixa com sombra. */
export function BotanicalGardenTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gifts = activeGifts(wedding);
  const photos = galleryRest(wedding);

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template}`}>
      <Nav wedding={wedding} />
      <Hero wedding={wedding} />

      {/* Convite — coluna estreita sobre creme-2; a moldura da capa invade esta faixa */}
      <section id="convite" className={styles.invite} aria-labelledby="bg-invite-title">
        <Reveal className={styles.inviteCol}>
          <p className={styles.eyebrow}>O convite</p>
          <h2 id="bg-invite-title" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <OliveBranch className={styles.inviteRule} />
          <p className={styles.lead}>{wedding.welcomeText}</p>
        </Reveal>
      </section>

      {/* História — pranchas assimétricas: foto num canto, texto no outro, numeral grande */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="bg-story-title">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.storyHead}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="bg-story-title" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
            <div className={styles.chapters} data-plain={wedding.gallery.length ? undefined : ""}>
              {moments.map((moment, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(moment.headline);
                return (
                  <article key={moment.id} className={styles.chapter} data-alt={i % 2 === 1 ? "" : undefined} data-photo={img ? "" : undefined}>
                    {img ? (
                      <Reveal as="figure" className={styles.chapterFig} y={24}>
                        <span className={styles.chapterFrame}>
                          <Image
                            src={img.src}
                            alt={img.alt}
                            width={900}
                            height={1100}
                            loading="lazy"
                            sizes="(min-width: 900px) 42vw, 86vw"
                            className={styles.chapterImg}
                          />
                        </span>
                        <OliveBranch className={styles.chapterBranch} />
                      </Reveal>
                    ) : null}
                    <Reveal className={styles.chapterBody} delay={0.08}>
                      <span className={styles.chapterNum} aria-hidden>
                        {moment.number}
                      </span>
                      <p className={styles.kicker}>
                        <span className={styles.srOnly}>{moment.number}. </span>
                        {moment.title}
                      </p>
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
                    </Reveal>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação — split: cabeçalho fixo à esquerda, lista com folhinha à direita */}
      {schedule.length ? (
        <section id="programacao" className={styles.schedule} aria-labelledby="bg-schedule-title">
          <div className={`${styles.wrap} ${styles.scheduleGrid}`}>
            <Reveal as="header" className={styles.scheduleHead}>
              <p className={styles.eyebrow}>O dia</p>
              <h2 id="bg-schedule-title" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.scheduleList}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.scheduleItem} delay={i * 0.05} y={12}>
                  <EucalyptusSprig className={styles.scheduleLeaf} />
                  <span className={styles.scheduleTime}>{item.time}</span>
                  <span className={styles.scheduleMain}>
                    <span className={styles.scheduleTitle}>{item.title}</span>
                    {item.note ? <span className={styles.scheduleNote}>{item.note}</span> : null}
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Local — mapa em moldura com ramos nos cantos, texto ao lado */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="bg-place-title">
          <div className={`${styles.wrap} ${styles.placeGrid}`}>
            <Reveal className={styles.placeInfo}>
              <p className={styles.eyebrow}>Onde</p>
              <h2 id="bg-place-title" className={styles.h2}>
                {location.venue || location.city}
              </h2>
              {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
              {location.address ? <p className={styles.body}>{location.address}</p> : null}
              {location.note ? <p className={styles.body}>{location.note}</p> : null}
              <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
                Abrir no mapa
              </a>
            </Reveal>
            <Reveal className={styles.placeMap} delay={0.08} y={24}>
              <OliveBranch className={`${styles.mapBranch} ${styles.mapBranchA}`} />
              <OliveBranch className={`${styles.mapBranch} ${styles.mapBranchB}`} />
              <iframe
                className={styles.mapFrame}
                src={mapEmbedUrl(location)}
                title={`Mapa — ${location.venue || location.city}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Cartões — pranchas separadas por fios, sem caixa */}
      {cards.length ? (
        <section id="informacoes" className={styles.plates} aria-label="Informações">
          <div className={styles.wrap}>
            <Reveal className={styles.platesHead}>
              <p className={styles.eyebrow}>Bom saber</p>
            </Reveal>
            <dl className={styles.plateList}>
              {cards.map((card, i) => (
                <Reveal as="div" key={card.id} className={styles.plate} delay={i * 0.04}>
                  <dt className={styles.plateTitle}>
                    {card.title}
                    {card.subtitle ? <span className={styles.plateSub}>{card.subtitle}</span> : null}
                  </dt>
                  <dd className={styles.plateBody}>{card.body}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      {/* Presentes */}
      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="bg-gifts-title">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.giftsHead}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="bg-gifts-title" className={styles.h2}>
                Um gesto para a casa nova
              </h2>
              <p className={styles.lead}>Cada presente vai por Pix direto para o casal, sem intermediários.</p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {photos.length ? <Gallery images={photos} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      {/* Encerramento — foto em arco e a última frase */}
      <section className={styles.closing} aria-label="Encerramento">
        <Reveal className={styles.closingCol}>
          {wedding.footerImage ? (
            <span className={styles.arch}>
              <Image src={wedding.footerImage} alt="" fill loading="lazy" sizes="(min-width: 700px) 420px, 80vw" className={styles.archImg} />
            </span>
          ) : (
            <FernFrond className={styles.closingFern} />
          )}
          <p className={styles.closingText}>{wedding.finalText}</p>
        </Reveal>
      </section>

      <Footer wedding={wedding} location={location} />
    </main>
  );
}

/* ------------------------------------------------------------------ Nav */

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

/* ----------------------------------------------------------------- Capa */

function Hero({ wedding }: Props) {
  const [a, b] = splitCouple(wedding.coupleNames);
  const location = mainLocation(wedding);
  const place = location ? [location.venue, location.city].filter(Boolean).join(" · ") : "";
  const rows: Array<[string, string]> = [
    ["Data", wedding.weddingDateLabel],
    ["Hora", wedding.weddingTime],
    ["Local", place]
  ];

  return (
    <section id="topo" className={styles.hero} data-photo={wedding.heroImage ? "" : undefined} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <div className={styles.heroText}>
        <p className={`${styles.eyebrow} hero-rise`}>Convite de casamento</p>
        <h1 className={`${styles.names} hero-rise`} data-scale={nameScale(wedding.coupleNames)} style={{ animationDelay: "120ms" }}>
          <span className={styles.name}>{a}</span>
          {b ? (
            <>
              <em className={styles.amp} aria-hidden>
                &
              </em>
              <span className={styles.srOnly}> e </span>
              <span className={styles.name}>{b}</span>
            </>
          ) : null}
        </h1>
        <dl className={`${styles.tag} hero-rise`} style={{ animationDelay: "240ms" }}>
          {rows
            .filter(([, value]) => value)
            .map(([key, value]) => (
              <div key={key} className={styles.tagRow}>
                <dt className={styles.tagKey}>{key}</dt>
                <dd className={styles.tagVal}>{value}</dd>
              </div>
            ))}
        </dl>
      </div>

      {/* Ramos atrás da moldura (ou dos nomes, sem foto). */}
      <div className={`${styles.heroStage} hero-rise`} style={{ animationDelay: "320ms" }}>
        <FernFrond className={`${styles.heroFern} ${styles.sway}`} />
        <EucalyptusSprig className={`${styles.heroEuca} ${styles.swayAlt}`} />
        {wedding.heroImage ? (
          <span className={styles.heroFrame}>
            <span className={styles.heroPhoto}>
              <Image src={wedding.heroImage} alt="" fill priority sizes="100vw" className={styles.heroImg} />
            </span>
          </span>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Contagem */

function Countdown({ wedding }: Props) {
  const c = useCountdown(wedding.weddingDate);
  const hasDate = Number.isFinite(new Date(wedding.weddingDate || "x").getTime());
  const units: Array<[number, string]> = [
    [c.days, "dias"],
    [c.hours, "horas"],
    [c.minutes, "min"],
    [c.seconds, "seg"]
  ];

  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <Reveal className={styles.countLabel}>
        <p className={styles.countEyebrow}>{!hasDate ? "Guarde a data" : c.isPast ? "Hoje é o grande dia" : "Faltam"}</p>
        {hasDate && !c.isPast ? (
          <div className={styles.countGrid}>
            {units.map(([value, label]) => (
              <div key={label} className={styles.countCell}>
                <span className={styles.countNum}>{c.ready ? pad(value) : "—"}</span>
                <span className={styles.countUnit}>{label}</span>
              </div>
            ))}
          </div>
        ) : null}
        <p className={styles.countDate}>
          {wedding.weddingDateLabel}
          {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
        </p>
      </Reveal>
    </section>
  );
}

/* -------------------------------------------------------------- Galeria */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="bg-gallery-title">
      <div className={styles.wrap}>
        <Reveal as="header" className={styles.galleryHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="bg-gallery-title" className={styles.h2}>
            Coleção de momentos
          </h2>
        </Reveal>
        <ul className={styles.galleryGrid}>
          {/* Reveal descarta data-*: os atributos ficam no <li>, o Reveal preenche a célula. */}
          {images.map((img, i) => (
            <li key={img.id} className={styles.galleryItem} data-tall={i % 5 === 0 ? "" : undefined} data-wide={i % 7 === 3 ? "" : undefined}>
              <Reveal className={styles.galleryCell} delay={(i % 4) * 0.05}>
                <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Ampliar foto: ${img.alt}`}>
                  <Image src={img.src} alt={img.alt} fill loading="lazy" sizes="(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw" className={styles.galleryImg} />
                </button>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
      <Lightbox images={images} active={lb.active} onClose={lb.close} classNames={{ dialog: styles.lightbox, close: styles.lightboxClose, figure: styles.lightboxFig, img: styles.lightboxImg, caption: styles.lightboxCap, nav: styles.lightboxNav }} />
    </section>
  );
}

/* --------------------------------------------------------------- Rodapé */

function Footer({ wedding, location }: Props & { location: ReturnType<typeof mainLocation> }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerMono}>
        <LaurelWreath className={styles.wreath} />
        <span className={styles.monogram}>{wedding.monogram}</span>
      </div>
      <p className={styles.footerNames}>{wedding.coupleNames}</p>
      <p className={styles.footerMeta}>
        {[wedding.weddingDateLabel, location?.city].filter(Boolean).join(" · ")}
      </p>
      {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
      <p className={styles.footerBrand}>Feito com Noivar</p>
    </footer>
  );
}
