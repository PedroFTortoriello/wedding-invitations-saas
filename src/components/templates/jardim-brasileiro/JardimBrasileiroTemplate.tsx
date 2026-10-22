"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { Gloock, Onest } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, pad, useCountdown } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import {
  BromeliaBloom,
  FernFrond,
  MonsteraLeaf,
  OrangeBlossom,
  PalmFrond,
  VineTendril
} from "@/components/templates/kit/ornaments";
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
  placeLine,
  program,
  splitCouple,
  storyMoments
} from "@/components/templates/kit/utils";
import styles from "./jardim-brasileiro.module.css";

const display = Gloock({
  subsets: ["latin"],
  weight: "400",
  variable: "--jb-display",
  display: "swap"
});

const sans = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--jb-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

/* Pingos de ipê: posições em % (x, y) e tamanho em px; o CSS lê as vars. */
const DROPS: ReadonlyArray<[number, number, number]> = [
  [8, 18, 10],
  [16, 70, 7],
  [26, 34, 5],
  [40, 12, 8],
  [62, 9, 6],
  [76, 26, 11],
  [88, 58, 7],
  [70, 80, 5],
  [34, 88, 9],
  [92, 14, 5]
];

function Drops({ className }: { className?: string }) {
  return (
    <span className={`${styles.drops} ${className ?? ""}`} aria-hidden>
      {DROPS.map(([x, y, s], i) => (
        <i key={i} className={styles.drop} style={{ "--x": `${x}%`, "--y": `${y}%`, "--s": `${s}px` } as CSSProperties} />
      ))}
    </span>
  );
}

/* Uma planta em traço para cada cartão de informação, em ciclo. */
const CARD_PLANTS = [FernFrond, OrangeBlossom, VineTendril, BromeliaBloom, FernFrond];

export function JardimBrasileiroTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gifts = activeGifts(wedding);
  const photos = galleryRest(wedding);
  const nav = [
    ["#convite", "Convite"],
    moments.length ? ["#historia", "História"] : null,
    schedule.length ? ["#programacao", "O dia"] : null,
    location ? ["#local", "Local"] : null,
    gifts.length ? ["#presentes", "Presentes"] : null,
    photos.length ? ["#galeria", "Galeria"] : null,
    wedding.rsvp.enabled ? ["#confirmar", "Confirmar"] : null
  ].filter((item): item is [string, string] => item !== null);

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template}`}>
      <Nav wedding={wedding} links={nav} />
      <Hero wedding={wedding} />

      {/* Convite: faixa verde-mata full-bleed, texto creme, bromélia pequena */}
      <section id="convite" className={styles.invite} aria-labelledby="jb-invite">
        <BromeliaBloom className={styles.inviteBloom} />
        <Reveal className={styles.inviteInner}>
          <p className={`${styles.eyebrow} ${styles.eyebrowOnForest}`}>O convite</p>
          <h2 id="jb-invite" className={styles.inviteWords}>
            {wedding.invitationWords.map((word, i) => (
              <span key={`${word}-${i}`} className={styles.inviteWord}>
                {word}
              </span>
            ))}
          </h2>
          <p className={styles.inviteText}>{wedding.welcomeText}</p>
        </Reveal>
      </section>

      {/* História: capítulos com foto em recorte de folha, alternando o lado */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="jb-story">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.storyHead}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="jb-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
            <div className={`${styles.chapters} ${wedding.gallery.length ? "" : styles.chaptersBare}`}>
              {moments.map((moment, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(moment.headline);
                const flip = i % 2 === 1;
                return (
                  <Reveal as="article" key={moment.id} className={`${styles.chapter} ${flip ? styles.chapterFlip : ""}`}>
                    {img ? (
                      <figure className={styles.leaf}>
                        <Image
                          src={img.src}
                          alt={img.alt}
                          width={900}
                          height={1100}
                          loading="lazy"
                          sizes="(min-width: 900px) 40vw, 86vw"
                          className={styles.leafImg}
                        />
                      </figure>
                    ) : null}
                    <div className={styles.chapterText}>
                      <span className={styles.chapterNum} aria-hidden>
                        {moment.number}
                      </span>
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

      {/* Programação: coluna estreita à esquerda, costela-de-adão fantasma à direita */}
      {schedule.length ? (
        <section id="programacao" className={styles.schedule} aria-labelledby="jb-schedule">
          <MonsteraLeaf className={styles.scheduleLeaf} />
          <div className={`${styles.wrap} ${styles.scheduleGrid}`}>
            <Reveal as="header" className={styles.scheduleHead}>
              <p className={styles.eyebrow}>O dia</p>
              <h2 id="jb-schedule" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.timeline}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.slot} delay={i * 0.05} y={12}>
                  <span className={styles.slotTime}>{item.time}</span>
                  <span className={styles.slotBody}>
                    <span className={styles.slotTitle}>{item.title}</span>
                    {item.note ? <span className={styles.slotNote}>{item.note}</span> : null}
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Local: texto acima, mapa com moldura verde-mata */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="jb-place">
          <div className={styles.wrap}>
            <Reveal className={styles.placeHead}>
              <p className={styles.eyebrow}>Onde</p>
              <h2 id="jb-place" className={styles.h2}>
                {location.venue || location.city}
              </h2>
              <p className={styles.placeLine}>
                {[location.venue ? location.city : "", location.address].filter(Boolean).join(" · ")}
              </p>
              {location.note ? <p className={styles.body}>{location.note}</p> : null}
              <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
                Abrir no Google Maps
              </a>
            </Reveal>
            <Reveal className={styles.mapFrame} y={20}>
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

      {/* Cartões: três blocos, cada um com uma planta diferente em traço */}
      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={styles.wrap}>
            <ul className={styles.cardList}>
              {cards.map((card, i) => {
                const Plant = CARD_PLANTS[i % CARD_PLANTS.length];
                return (
                  <Reveal as="li" key={card.id} className={styles.card} delay={i * 0.06}>
                    <Plant className={styles.cardPlant} />
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
        <section id="presentes" className={styles.gifts} aria-labelledby="jb-gifts">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.giftsHead}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="jb-gifts" className={styles.h2}>
                Para a casa que vamos plantar
              </h2>
              <p className={styles.lead}>Cada cota vai por Pix direto para o casal, sem taxas no caminho.</p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {photos.length ? <Gallery images={photos} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      {/* Encerramento: foto em arco com o jardim em volta; sem foto, só o jardim e o texto */}
      <section className={styles.closing} aria-label="Até lá">
        <div className={`${styles.stage} ${wedding.footerImage ? styles.closingStage : styles.closingStageBare}`}>
          <div className={styles.garden} aria-hidden>
            <MonsteraLeaf className={`${styles.plant} ${styles.closingMonstera}`} />
            <BromeliaBloom className={`${styles.plant} ${styles.closingBromelia}`} />
            <OrangeBlossom className={`${styles.plant} ${styles.closingBlossom}`} />
            <FernFrond className={`${styles.plant} ${styles.closingFern}`} />
            <Drops />
          </div>
          {wedding.footerImage ? (
            <Reveal as="figure" className={styles.closingArch} y={20}>
              <Image
                src={wedding.footerImage}
                alt=""
                width={1200}
                height={1500}
                loading="lazy"
                sizes="(min-width: 900px) 520px, 78vw"
                className={styles.closingImg}
              />
            </Reveal>
          ) : (
            <span className={styles.closingSun} aria-hidden />
          )}
        </div>
        <Reveal className={styles.closingText}>
          <p className={`${styles.closingQuote} ${wedding.finalText.length > 180 ? styles.closingQuoteLong : ""}`}>{wedding.finalText}</p>
          <p className={styles.closingSign}>{wedding.coupleNames}</p>
        </Reveal>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <p className={styles.footerMono}>{wedding.monogram}</p>
          <p className={styles.footerText}>{wedding.footerText}</p>
          <p className={styles.footerMeta}>
            {[wedding.weddingDateLabel, location?.city].filter(Boolean).join(" · ")}
          </p>
          <p className={styles.footerCredit}>Feito com Noivar</p>
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
  const place = mainLocation(wedding) ? placeLine(wedding) : "";
  const hasPhoto = Boolean(wedding.heroImage);
  const text = (
    <div className={styles.heroText}>
      <p className={`${styles.eyebrow} hero-rise`}>Vamos nos casar</p>
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
        <span className={styles.heroDate}>
          {wedding.weddingDateLabel}
          {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
        </span>
        {place ? <span className={styles.heroPlace}>{place}</span> : null}
      </p>
    </div>
  );
  /* O jardim: traço + silhueta em volta do arco (ou dos nomes, sem foto). */
  const garden = (
    <div className={styles.garden} aria-hidden>
      <MonsteraLeaf className={`${styles.plant} ${styles.monsteraL}`} />
      <PalmFrond className={`${styles.plant} ${styles.palmR}`} />
      <BromeliaBloom className={`${styles.plant} ${styles.bromeliaR}`} />
      <OrangeBlossom className={`${styles.plant} ${styles.blossomL}`} />
      <FernFrond className={`${styles.plant} ${styles.fernR}`} />
      <Drops />
    </div>
  );
  return (
    <section id="topo" className={`${styles.hero} ${hasPhoto ? "" : styles.heroBare}`} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <div className={styles.heroInner}>
        {hasPhoto ? (
          <>
            {text}
            <div className={`${styles.stage} ${styles.stagePhoto}`}>
              {garden}
              <figure className={`${styles.arch} hero-rise`} style={{ animationDelay: "300ms" }}>
                <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 900px) 560px, 84vw" className={styles.archImg} />
              </figure>
            </div>
          </>
        ) : (
          <div className={`${styles.stage} ${styles.stageBare}`}>
            {garden}
            {text}
          </div>
        )}

        {wedding.rsvp.enabled ? (
          <a href="#confirmar" className={`${styles.btn} ${styles.heroBtn} hero-rise`} style={{ animationDelay: "420ms" }}>
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
    [c.minutes, "min"],
    [c.seconds, "seg"]
  ];
  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <div className={styles.wrap}>
        <Reveal className={styles.countInner}>
          <p className={styles.eyebrow}>{c.isPast ? "Hoje é o dia" : "Contagem regressiva"}</p>
          {valid && !c.isPast ? (
            <div className={styles.countGrid}>
              {units.map(([value, label]) => (
                <span key={label} className={styles.cell}>
                  <span className={styles.cellNum}>{c.ready ? pad(value) : "–"}</span>
                  <span className={styles.cellLabel}>{label}</span>
                </span>
              ))}
            </div>
          ) : null}
          <p className={styles.countDate}>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Galeria */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="jb-gallery">
      <div className={styles.wrap}>
        <Reveal as="header" className={styles.galleryHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="jb-gallery" className={styles.h2}>
            Retratos no jardim
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
                  sizes="(min-width: 900px) 30vw, 50vw"
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
