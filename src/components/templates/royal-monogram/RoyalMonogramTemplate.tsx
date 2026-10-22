"use client";

import Image from "next/image";
import { Cinzel, EB_Garamond } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, pad, useCountdown } from "@/components/templates/shared/motion";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { useMenu, useScrolled } from "@/components/templates/kit/hooks";
import { Diamond, FrameDouble, LaurelWreath, MonogramRing } from "@/components/templates/kit/ornaments";
import {
  activeCards,
  activeGifts,
  headlineLines,
  initials,
  mainLocation,
  mapEmbedUrl,
  mapLink,
  nameScale,
  program,
  splitCouple,
  storyMoments,
  weddingYear
} from "@/components/templates/kit/utils";
import styles from "./royal-monogram.module.css";

const display = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--rm-display",
  display: "swap"
});

const text = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--rm-text",
  display: "swap"
});

type Props = { wedding: WeddingSite };

const NAV = [
  ["#convite", "Convite"],
  ["#historia", "História"],
  ["#programacao", "O dia"],
  ["#local", "Local"],
  ["#presentes", "Presentes"],
  ["#confirmar", "Confirmar"]
] as const;

export function RoyalMonogramTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gallery = galleryRest(wedding);
  const hasGifts = activeGifts(wedding).length > 0;
  const [first, second] = splitCouple(wedding.coupleNames);
  const letters = initials(wedding.coupleNames, wedding.monogram.charAt(0) || "♥");

  return (
    <main className={`${display.variable} ${text.variable} ${styles.template}`}>
      <Nav wedding={wedding} letters={letters} />

      {/* Capa: tipografia e o anel; a foto fica para a seção seguinte. */}
      <section id="top" className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
        <p className={`${styles.heroKicker} hero-rise`}>O casamento de</p>
        <div className={`${styles.heroSeal} hero-rise`} style={{ animationDelay: "120ms" }}>
          <Seal letters={letters} className={styles.heroRing} draw />
        </div>
        <h1 className={`${styles.heroNames} hero-rise`} data-scale={nameScale(wedding.coupleNames)} style={{ animationDelay: "240ms" }}>
          <span className={styles.heroName}>{first}</span>
          {second ? (
            <>
              <span className={styles.heroAmp} aria-hidden>
                &amp;
              </span>
              <span className={styles.heroName}>{second}</span>
            </>
          ) : null}
        </h1>
        <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "360ms" }}>
          <span>{wedding.weddingDateLabel}</span>
          {location ? (
            <>
              <Diamond className={styles.heroDiamond} fill="currentColor" strokeWidth={8} />
              <span>{[location.venue, location.city].filter(Boolean).join(", ")}</span>
            </>
          ) : null}
        </p>
      </section>

      {wedding.heroImage ? (
        <section className={styles.portrait} aria-label="Retrato do casal">
          <Reveal className={styles.portraitFrame} y={24}>
            <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 900px) 620px, 100vw" className={styles.portraitImg} />
            <FrameDouble className={styles.frameOverlay} />
          </Reveal>
          <Reveal className={styles.portraitAside} delay={0.1}>
            <span className={styles.portraitYear}>{weddingYear(wedding)}</span>
            <span className={styles.rule} aria-hidden />
            <span className={styles.portraitNames}>{wedding.coupleNames}</span>
          </Reveal>
        </section>
      ) : null}

      {/* Convite: faixa marinho, louro aberto atrás do título. */}
      <section id="convite" className={styles.invite} aria-labelledby="invite-title">
        <LaurelWreath className={styles.laurel} />
        <Reveal className={styles.inviteInner}>
          <p className={styles.eyebrowLight}>Convite</p>
          <h2 id="invite-title" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <p className={styles.inviteText}>{wedding.welcomeText}</p>
        </Reveal>
      </section>

      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="story-title">
          <Reveal className={styles.sectionHead}>
            <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
            <h2 id="story-title" className={styles.h2}>
              {wedding.storyTitle}
            </h2>
          </Reveal>
          <div className={styles.chapters}>
            {moments.map((moment, i) => {
              const img = storyImage(wedding.gallery, i);
              const lines = headlineLines(moment.headline);
              return (
                <Reveal as="article" key={moment.id} className={styles.chapter} delay={i * 0.08}>
                  {img ? (
                    <div className={styles.chapterPhoto}>
                      <Image src={img.src} alt={img.alt} fill loading="lazy" sizes="(min-width: 900px) 30vw, 100vw" className={styles.cover} />
                    </div>
                  ) : null}
                  <span className={styles.chapterNum}>{moment.number}</span>
                  <h3 className={styles.chapterTitle}>{moment.title}</h3>
                  {lines.length ? (
                    <p className={styles.chapterHeadline}>
                      {lines.map((line, k) => (
                        <span key={k}>{line}</span>
                      ))}
                    </p>
                  ) : null}
                  <p className={styles.body}>{moment.description}</p>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {schedule.length ? (
        <section id="programacao" className={styles.schedule} aria-labelledby="schedule-title">
          <Reveal className={styles.sectionHead}>
            <p className={styles.eyebrow}>Ordem do dia</p>
            <h2 id="schedule-title" className={styles.h2}>
              {wedding.detailsTitle}
            </h2>
            {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
          </Reveal>
          <ol className={styles.order}>
            {schedule.map((item, i) => (
              <Reveal as="li" key={item.id} className={styles.orderItem} delay={i * 0.05}>
                {i > 0 ? <Diamond className={styles.orderDiamond} fill="currentColor" strokeWidth={8} /> : null}
                <span className={styles.orderTime}>{item.time}</span>
                <span className={styles.orderTitle}>{item.title}</span>
                {item.note ? <span className={styles.orderNote}>{item.note}</span> : null}
              </Reveal>
            ))}
          </ol>
        </section>
      ) : null}

      {location ? (
        <section id="local" className={styles.place} aria-labelledby="place-title">
          <Reveal className={styles.mapFrame} y={24}>
            <iframe className={styles.map} src={mapEmbedUrl(location)} title={`Mapa — ${location.venue || location.city}`} loading="lazy" />
          </Reveal>
          <Reveal className={styles.placeInfo} delay={0.1}>
            <p className={styles.eyebrowLight}>O local</p>
            <h2 id="place-title" className={styles.placeTitle}>
              {location.venue || location.city}
            </h2>
            {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
            {location.address ? <p className={styles.placeText}>{location.address}</p> : null}
            {location.note ? <p className={styles.placeText}>{location.note}</p> : null}
            <a className={styles.btnLight} href={mapLink(location)} target="_blank" rel="noreferrer">
              Abrir no mapa
            </a>
          </Reveal>
        </section>
      ) : null}

      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={styles.cardGrid}>
            {cards.map((card, i) => (
              <Reveal as="article" key={card.id} className={styles.card} delay={i * 0.06}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <span className={styles.ruleShort} aria-hidden />
                {card.subtitle ? <p className={styles.cardSub}>{card.subtitle}</p> : null}
                {card.body ? <p className={styles.cardBody}>{card.body}</p> : null}
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {hasGifts ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="gifts-title">
          <Reveal className={styles.sectionHead}>
            <p className={styles.eyebrow}>Presentes</p>
            <h2 id="gifts-title" className={styles.h2}>
              Lista de presentes
            </h2>
            <p className={styles.lead}>Cada cota vai por Pix, direto para o casal.</p>
          </Reveal>
          <GiftRegistry wedding={wedding} variant="inherit" />
        </section>
      ) : null}

      {gallery.length ? <Gallery images={gallery} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      <section className={styles.closing} aria-label="Encerramento">
        {wedding.footerImage ? (
          <Reveal className={styles.oval} y={24}>
            <span className={styles.ovalPhoto}>
              <Image src={wedding.footerImage} alt="" fill loading="lazy" sizes="(min-width: 900px) 420px, 80vw" className={styles.cover} />
            </span>
            <Seal letters={letters} className={styles.ovalSeal} />
          </Reveal>
        ) : (
          <Reveal>
            <Seal letters={letters} className={styles.closingSeal} />
          </Reveal>
        )}
        <Reveal as="div" className={styles.closingText} delay={0.1}>
          <p className={styles.finalText}>{wedding.finalText}</p>
        </Reveal>
      </section>

      <footer className={styles.footer}>
        <Seal letters={letters} className={styles.footerSeal} />
        <p className={styles.footerNames}>{wedding.coupleNames}</p>
        {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
        <p className={styles.footerMeta}>
          {[wedding.weddingDateLabel, location?.city].filter(Boolean).join(" · ")}
        </p>
        <p className={styles.footerCredit}>Feito com Noivar</p>
      </footer>
    </main>
  );
}

/* Selo: anel do kit com as iniciais sobrepostas. `draw` anima o traço (capa). */
function Seal({ letters, className, draw }: { letters: [string, string]; className: string; draw?: boolean }) {
  return (
    <span className={`${styles.seal} ${className}`} aria-hidden>
      <MonogramRing className={`${styles.ring} ${draw ? styles.ringDraw : ""}`} strokeWidth={1.6} />
      <span className={styles.sealLetters}>
        <span>{letters[0]}</span>
        {letters[1] ? <span>{letters[1]}</span> : null}
      </span>
    </span>
  );
}

function Nav({ wedding, letters }: Props & { letters: [string, string] }) {
  const [open, toggle, close] = useMenu();
  const solid = useScrolled(40);
  return (
    <header className={`${styles.nav} ${solid ? styles.navSolid : ""}`}>
      <div className={styles.navBar}>
        <a href="#top" className={styles.navSeal} aria-label={wedding.coupleNames}>
          <Seal letters={letters} className={styles.navRing} />
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

function Countdown({ wedding }: Props) {
  const c = useCountdown(wedding.weddingDate);
  const valid = weddingYear(wedding) !== "";
  const units: Array<[number, string]> = [
    [c.days, "dias"],
    [c.hours, "horas"],
    [c.minutes, "minutos"],
    [c.seconds, "segundos"]
  ];
  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <Reveal className={styles.countInner}>
        <p className={styles.eyebrow}>{!valid ? "Nosso dia" : c.isPast ? "Hoje é o grande dia" : "Faltam"}</p>
        {valid && !c.isPast ? (
          <div className={styles.countGrid}>
            {units.map(([value, label]) => (
              <span key={label} className={styles.countCell}>
                <span className={styles.countNum}>{c.ready ? pad(value) : "—"}</span>
                <span className={styles.countLabel}>{label}</span>
              </span>
            ))}
          </div>
        ) : null}
        <p className={styles.countDate}>{[wedding.weddingDateLabel, wedding.weddingTime].filter(Boolean).join(" · ")}</p>
      </Reveal>
    </section>
  );
}

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="gallery-title">
      <Reveal className={styles.sectionHead}>
        <p className={styles.eyebrow}>Galeria</p>
        <h2 id="gallery-title" className={styles.h2}>
          Retratos
        </h2>
      </Reveal>
      <div className={styles.galleryGrid}>
        {images.map((image, i) => (
          <Reveal key={image.id} className={styles.galleryItem} delay={(i % 3) * 0.06}>
            <button type="button" className={styles.galleryBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${image.alt}`}>
              <Image src={image.src} alt={image.alt} fill loading="lazy" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className={styles.cover} />
              <FrameDouble className={styles.frameOverlay} />
            </button>
          </Reveal>
        ))}
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
