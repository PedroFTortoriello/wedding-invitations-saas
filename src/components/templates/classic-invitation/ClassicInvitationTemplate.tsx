"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { Josefin_Sans, Libre_Baskerville } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, pad, useCountdown } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { DoubleRule, Flourish } from "@/components/templates/kit/ornaments";
import { PAPER } from "@/components/templates/kit/textures";
import { useMenu } from "@/components/templates/kit/hooks";
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
import styles from "./classic-invitation.module.css";

const display = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--ci-display",
  display: "swap"
});

const sans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--ci-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

const ROOT_STYLE = { "--ci-paper": PAPER } as CSSProperties;

export function ClassicInvitationTemplate({ wedding }: Props) {
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
    <main className={`${display.variable} ${sans.variable} ${styles.template}`} style={ROOT_STYLE}>
      <Nav wedding={wedding} items={nav} />
      <Hero wedding={wedding} />

      {/* Convite: cartão de mensagem + cartão de RSVP (a "resposta" da suíte) */}
      <section id="convite" className={styles.invite} aria-labelledby="invite-title">
        <div className={`${styles.wrap} ${styles.inviteGrid}`}>
          <Reveal as="article" className={`${styles.card} ${styles.message}`} y={20}>
            <p className={styles.eyebrow}>Uma mensagem dos noivos</p>
            <h2 id="invite-title" className={styles.inviteWords}>
              {wedding.invitationWords.join(" ")}
            </h2>
            <span className={styles.hair} aria-hidden />
            <p className={styles.messageText}>{wedding.welcomeText}</p>
          </Reveal>
          {wedding.rsvp.enabled ? (
            <Reveal as="aside" className={`${styles.card} ${styles.reply}`} y={20} delay={0.1}>
              <p className={styles.eyebrow}>Cartão de resposta</p>
              <p className={styles.replyTitle}>{wedding.rsvp.title}</p>
              <p className={styles.replyText}>{wedding.rsvp.subtitle}</p>
              <a href="#confirmar" className={styles.btn}>
                Confirmar presença
              </a>
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* História: três cartões sobre a mesa, em degraus */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="story-title">
          <div className={styles.wrap}>
            <Reveal className={styles.sectionHead}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="story-title" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
            <div className={styles.storyRow}>
              {moments.map((moment, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(moment.headline);
                return (
                  <Reveal as="article" key={moment.id} className={`${styles.card} ${styles.storyCard}`} y={20} delay={i * 0.1}>
                    {img ? (
                      <figure className={styles.storyFig}>
                        <Image
                          src={img.src}
                          alt={img.alt}
                          width={900}
                          height={1125}
                          loading="lazy"
                          sizes="(min-width: 880px) 30vw, 100vw"
                          className={styles.storyImg}
                        />
                      </figure>
                    ) : null}
                    <div className={styles.storyBody}>
                      <span className={styles.storyNum} aria-hidden>
                        {moment.number}
                      </span>
                      <p className={styles.eyebrow}>{moment.title}</p>
                      {lines.length ? (
                        <h3 className={styles.storyHeadline}>
                          {lines.map((line, k) => (
                            <span key={k} className={styles.line}>
                              {line}
                            </span>
                          ))}
                        </h3>
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

      {/* Programação + Local: dois cartões que se sobrepõem na mesa */}
      {schedule.length || location ? (
        <section className={styles.day} aria-label="Programação e local">
          <div className={styles.wrap}>
            {schedule.length ? (
              <Reveal as="article" id="programacao" className={`${styles.card} ${styles.programCard}`} y={20} aria-labelledby="program-title">
                <p className={styles.eyebrow}>Programa</p>
                <h2 id="program-title" className={styles.h2}>
                  {wedding.detailsTitle}
                </h2>
                {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
                <ol className={styles.program}>
                  {schedule.map((item, i) => (
                    <li key={item.id} className={styles.programItem}>
                      {i > 0 ? <DoubleRule className={styles.rule} /> : null}
                      <span className={styles.programTime}>{item.time}</span>
                      <span className={styles.programTitle}>{item.title}</span>
                      {item.note ? <span className={styles.programNote}>{item.note}</span> : null}
                    </li>
                  ))}
                </ol>
              </Reveal>
            ) : null}

            {location ? (
              <Reveal
                as="article"
                id="local"
                className={`${styles.card} ${styles.placeCard} ${schedule.length ? styles.placeOverlap : ""}`}
                y={20}
                delay={0.1}
                aria-labelledby="place-title"
              >
                <div className={styles.placeInfo}>
                  <p className={styles.eyebrow}>Direções</p>
                  <h2 id="place-title" className={styles.h2}>
                    {location.venue || location.city}
                  </h2>
                  {location.venue && location.city ? <p className={styles.caps}>{location.city}</p> : null}
                  {location.address ? <p className={styles.body}>{location.address}</p> : null}
                  {location.note ? <p className={styles.bodyItalic}>{location.note}</p> : null}
                  <a className={`${styles.btn} ${styles.btnGhost}`} href={mapLink(location)} target="_blank" rel="noreferrer">
                    Abrir no Google Maps
                  </a>
                </div>
                <div className={styles.map}>
                  <iframe src={mapEmbedUrl(location)} title={`Mapa: ${location.venue || location.city}`} loading="lazy" className={styles.mapFrame} />
                </div>
              </Reveal>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Informações: cartões pequenos lado a lado */}
      {cards.length ? (
        <section id="informacoes" className={styles.info} aria-label="Informações">
          <div className={`${styles.wrap} ${styles.infoGrid}`}>
            {cards.map((card, i) => (
              <Reveal as="article" key={card.id} className={`${styles.card} ${styles.infoCard}`} y={20} delay={(i % 4) * 0.08}>
                <Flourish className={styles.flourish} />
                <h3 className={styles.infoTitle}>{card.title}</h3>
                {card.subtitle ? <p className={styles.caps}>{card.subtitle}</p> : null}
                {card.body ? <p className={styles.body}>{card.body}</p> : null}
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* Presentes */}
      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="gifts-title">
          <div className={styles.wrap}>
            <Reveal className={styles.sectionHead}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="gifts-title" className={styles.h2}>
                Lista de presentes
              </h2>
              <p className={styles.lead}>Escolha uma cota e contribua pelo Pix, direto para o casal.</p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {photos.length ? <Gallery images={photos} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      {/* Encerramento */}
      <section className={styles.closing} aria-label="Encerramento">
        <div className={styles.wrap}>
          <Reveal as="article" className={`${styles.card} ${styles.closingCard}`} y={20}>
            {wedding.footerImage ? (
              <figure className={styles.closingFig}>
                <Image src={wedding.footerImage} alt="" width={1200} height={800} loading="lazy" sizes="(min-width: 760px) 44rem, 100vw" className={styles.closingImg} />
              </figure>
            ) : null}
            <div className={styles.closingBody}>
              <DoubleRule className={styles.rule} />
              <p className={styles.closingText}>{wedding.finalText}</p>
              <p className={styles.closingSign}>{wedding.footerText}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <p className={styles.footerLine}>
            <span>{wedding.coupleNames}</span>
            <span aria-hidden>·</span>
            <span>{wedding.weddingDateLabel}</span>
            {location?.city ? (
              <>
                <span aria-hidden>·</span>
                <span>{location.city}</span>
              </>
            ) : null}
          </p>
          <p className={styles.footerCredit}>Feito com Noivar</p>
        </div>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ nav */

function Nav({ wedding, items }: Props & { items: [string, string][] }) {
  const [open, toggle, close] = useMenu();
  return (
    <header className={styles.nav}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <a href="#top" className={styles.navMono} aria-label={wedding.coupleNames}>
          {wedding.monogram}
        </a>
        <nav className={styles.navLinks} aria-label="Seções">
          {items.map(([href, label]) => (
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
          {items.map(([href, label]) => (
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
  const [first, second] = splitCouple(wedding.coupleNames);
  const location = mainLocation(wedding);
  const place = location ? [location.venue, location.city].filter(Boolean).join(" · ") : "";

  return (
    <section id="top" className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <div className={styles.wrap}>
        <div className={`${styles.card} ${styles.heroCard} hero-rise`}>
          <p className={`${styles.eyebrow} hero-rise`} style={{ animationDelay: "120ms" }}>
            Com a bênção de suas famílias
          </p>
          <h1 className={`${styles.names} hero-rise`} data-scale={nameScale(wedding.coupleNames)} style={{ animationDelay: "200ms" }}>
            <span className={styles.name}>{first}</span>
            {second ? (
              <>
                <em className={styles.amp}>&amp;</em>
                <span className={styles.name}>{second}</span>
              </>
            ) : null}
          </h1>
          <p className={`${styles.heroLine} hero-rise`} style={{ animationDelay: "280ms" }}>
            convidam para a celebração do seu casamento
          </p>
          <DoubleRule className={`${styles.rule} hero-rise`} style={{ animationDelay: "320ms" }} />
          <p className={`${styles.heroDate} hero-rise`} style={{ animationDelay: "360ms" }}>
            {wedding.weddingDateLabel}
          </p>
          {wedding.weddingTime || place ? (
            <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "420ms" }}>
              {wedding.weddingTime ? <span>às {wedding.weddingTime}</span> : null}
              {place ? <span>{place}</span> : null}
            </p>
          ) : null}
        </div>

        {wedding.heroImage ? (
          <figure className={`${styles.card} ${styles.heroPhoto} hero-rise`} style={{ animationDelay: "500ms" }}>
            <Image src={wedding.heroImage} alt="" fill priority sizes="100vw" className={styles.heroImg} />
          </figure>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ countdown */

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
      <div className={styles.wrap}>
        <Reveal as="article" className={`${styles.card} ${styles.countCard}`} y={20}>
          <p className={styles.eyebrow}>{hasDate && c.isPast ? "Hoje é o grande dia" : "Contagem regressiva"}</p>
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
          <p className={styles.countDate}>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- gallery */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="gallery-title">
      <div className={styles.wrap}>
        <Reveal className={styles.sectionHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="gallery-title" className={styles.h2}>
            Retratos
          </h2>
        </Reveal>
        <div className={styles.galleryGrid}>
          {images.map((image, i) => (
            <Reveal key={image.id} y={20} delay={(i % 4) * 0.06}>
              <button type="button" className={styles.photo} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${image.alt}`}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={800}
                  height={800}
                  loading="lazy"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className={styles.photoImg}
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
