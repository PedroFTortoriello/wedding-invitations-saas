"use client";

import Image from "next/image";
import { Forum, Lato } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, pad, useCountdown } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { OliveBranch } from "@/components/templates/kit/ornaments";
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
import styles from "./olive-branch.module.css";

const display = Forum({
  subsets: ["latin"],
  weight: "400",
  variable: "--ob-display",
  display: "swap"
});

const sans = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--ob-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

export function OliveBranchTemplate({ wedding }: Props) {
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

      {/* Convite: faixa oliva, texto marfim, ramo fino como separador */}
      <section id="convite" className={styles.invite} aria-labelledby="ob-invite">
        <Reveal className={styles.inviteInner}>
          <p className={`${styles.eyebrow} ${styles.eyebrowOnOlive}`}>O convite</p>
          <h2 id="ob-invite" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <OliveBranch className={styles.inviteBranch} />
          <p className={styles.inviteText}>{wedding.welcomeText}</p>
        </Reveal>
      </section>

      {/* História: capítulos em split assimétrico, foto 4:5 emoldurada, ramo pequeno no número */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="ob-story">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.sectionHead}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="ob-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
            <div className={styles.chapters}>
              {moments.map((moment, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(moment.headline);
                return (
                  <Reveal
                    as="article"
                    key={moment.id}
                    className={`${styles.chapter} ${i % 2 ? styles.chapterFlip : ""} ${img ? "" : styles.chapterNoPhoto}`}
                  >
                    {img ? (
                      <figure className={styles.chapterPhoto}>
                        <span className={styles.frame}>
                          <Image
                            src={img.src}
                            alt={img.alt}
                            width={800}
                            height={1000}
                            loading="lazy"
                            sizes="(min-width: 900px) 34vw, 78vw"
                            className={styles.chapterImg}
                          />
                        </span>
                      </figure>
                    ) : null}
                    <div className={styles.chapterText}>
                      <span className={styles.chapterNum}>
                        <OliveBranch className={styles.branchMini} strokeWidth={3.2} />
                        <span>{moment.number}</span>
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

      {/* Programação: cabeçalho à esquerda, lista com horário em Forum e ponto oliva */}
      {schedule.length ? (
        <section id="programacao" className={styles.schedule} aria-labelledby="ob-schedule">
          <div className={`${styles.wrap} ${styles.scheduleGrid}`}>
            <Reveal as="header" className={styles.scheduleHead}>
              <p className={styles.eyebrow}>O dia</p>
              <h2 id="ob-schedule" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.program}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.programRow} delay={i * 0.05} y={12}>
                  <span className={styles.programTime}>{item.time}</span>
                  <span className={styles.programDot} aria-hidden />
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

      {/* Local: faixa marfim-2, texto ao lado do mapa com moldura dupla */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="ob-place">
          <div className={`${styles.wrap} ${styles.placeGrid}`}>
            <Reveal className={styles.placeText}>
              <p className={styles.eyebrow}>Onde</p>
              <h2 id="ob-place" className={styles.h2}>
                {location.venue || location.city}
              </h2>
              {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
              {location.address ? <p className={styles.placeAddress}>{location.address}</p> : null}
              {location.note ? <p className={styles.body}>{location.note}</p> : null}
              <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
                Abrir no Google Maps
              </a>
            </Reveal>
            <Reveal className={styles.map} y={20}>
              <span className={`${styles.frame} ${styles.mapFrameBox}`}>
                <iframe
                  className={styles.mapFrame}
                  src={mapEmbedUrl(location)}
                  title={`Mapa: ${location.venue || location.city}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </span>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Cartões: três blocos com ramo pequeno no topo e título em caixa alta */}
      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={styles.wrap}>
            <ul className={styles.cardList}>
              {cards.map((card, i) => (
                <Reveal as="li" key={card.id} className={styles.card} delay={i * 0.06}>
                  <OliveBranch className={styles.branchCard} strokeWidth={2.6} />
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  {card.subtitle ? <p className={styles.cardSub}>{card.subtitle}</p> : null}
                  {card.body ? <p className={styles.cardBody}>{card.body}</p> : null}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="ob-gifts">
          <div className={styles.wrap}>
            <Reveal as="header" className={`${styles.sectionHead} ${styles.sectionHeadCenter}`}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="ob-gifts" className={styles.h2}>
                Um gesto para a nossa mesa
              </h2>
              <p className={styles.lead}>Cada cota vai por Pix direto para o casal, sem taxas no caminho.</p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {photos.length ? <Gallery images={photos} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      {/* Encerramento: foto com ramos sobrepostos nos cantos, texto final em Forum */}
      <section className={styles.closing} aria-label="Até lá">
        <div className={styles.wrap}>
          {wedding.footerImage ? (
            <Reveal className={styles.closingMedia} y={20}>
              <span className={`${styles.closingBranch} ${styles.closingBranchTL}`} aria-hidden>
                <OliveBranch className={styles.sway} />
              </span>
              <span className={`${styles.closingBranch} ${styles.closingBranchBR}`} aria-hidden>
                <OliveBranch className={styles.sway} />
              </span>
              <Image
                src={wedding.footerImage}
                alt=""
                width={1600}
                height={1000}
                loading="lazy"
                sizes="(min-width: 1200px) 1100px, 100vw"
                className={styles.closingImg}
              />
            </Reveal>
          ) : null}
          <Reveal className={`${styles.closingText} ${wedding.footerImage ? "" : styles.closingTextOnly}`}>
            {!wedding.footerImage ? <OliveBranch className={styles.closingBranchSmall} strokeWidth={2.2} /> : null}
            <p className={styles.closingQuote}>{wedding.finalText}</p>
            <p className={styles.closingNames}>{wedding.coupleNames}</p>
          </Reveal>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <p className={styles.footerMono}>
            <OliveBranch className={styles.footerBranch} strokeWidth={2.4} />
            <span>{wedding.monogram}</span>
            <OliveBranch className={`${styles.footerBranch} ${styles.footerBranchFlip}`} strokeWidth={2.4} />
          </p>
          <p className={styles.footerText}>{wedding.footerText}</p>
          <p className={styles.footerMeta}>
            {[wedding.coupleNames, wedding.weddingDateLabel, location?.city].filter(Boolean).join(" · ")}
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
  return (
    <section id="topo" className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <span className={`${styles.heroBranch} ${styles.heroBranchTL}`} aria-hidden>
        <OliveBranch className={styles.sway} />
      </span>
      <span className={`${styles.heroBranch} ${styles.heroBranchBR}`} aria-hidden>
        <OliveBranch className={styles.sway} />
      </span>

      <div className={`${styles.heroInner} ${hasPhoto ? "" : styles.heroInnerBoxed}`}>
        <h1 className={`${styles.names} hero-rise`} data-scale={nameScale(wedding.coupleNames)}>
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

        {hasPhoto ? (
          <figure className={`${styles.heroPhoto} hero-rise`} style={{ animationDelay: "120ms" }}>
            <span className={`${styles.frame} ${styles.heroFrame}`}>
              <Image
                src={wedding.heroImage}
                alt=""
                fill
                priority
                sizes="(min-width: 900px) 36vw, 76vw"
                className={styles.heroImg}
              />
            </span>
          </figure>
        ) : (
          <span className={`${styles.heroRule} hero-rise`} style={{ animationDelay: "120ms" }} aria-hidden />
        )}

        <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "240ms" }}>
          <span className={styles.heroDate}>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </span>
          {place ? <span className={styles.heroPlace}>{place}</span> : null}
        </p>
        {wedding.rsvp.enabled ? (
          <a href="#confirmar" className={`${styles.heroLink} hero-rise`} style={{ animationDelay: "360ms" }}>
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
      <div className={styles.wrap}>
        <Reveal className={styles.countInner}>
          <p className={styles.eyebrow}>{c.isPast ? "Hoje é o dia" : valid ? "Faltam" : "Contagem regressiva"}</p>
          {valid && !c.isPast ? (
            <div className={styles.countGrid}>
              {units.map(([value, label]) => (
                <span key={label} className={styles.countCell}>
                  <span className={styles.countNum}>{c.ready ? pad(value) : "–"}</span>
                  <span className={styles.countLabel}>{label}</span>
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
    <section id="galeria" className={styles.gallery} aria-labelledby="ob-gallery">
      <div className={styles.wrap}>
        <Reveal as="header" className={styles.sectionHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="ob-gallery" className={styles.h2}>
            Retratos dos dois
          </h2>
        </Reveal>
        <div className={styles.galleryGrid}>
          {images.map((image, i) => (
            <Reveal key={image.id} className={styles.shot} delay={(i % 3) * 0.05} y={14}>
              <button
                type="button"
                className={`${styles.frame} ${styles.shotBtn}`}
                onClick={() => lb.open(i)}
                aria-label={`Abrir foto: ${image.alt}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={800}
                  height={1000}
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
