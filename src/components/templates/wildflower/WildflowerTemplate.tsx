"use client";

import Image from "next/image";
import { Caveat, Lora, Work_Sans } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, pad, useCountdown } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { WildflowerCluster } from "@/components/templates/kit/ornaments";
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
import styles from "./wildflower.module.css";

const display = Lora({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--wf-display",
  display: "swap"
});

const sans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--wf-sans",
  display: "swap"
});

const script = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--wf-script",
  display: "swap"
});

type Props = { wedding: WeddingSite };

/* A margarida do cluster do kit, recortada pelo viewBox: marcador dos cartões. */
const BLOOM_VIEWBOX = "118 22 80 80";

export function WildflowerTemplate({ wedding }: Props) {
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
    <main className={`${display.variable} ${sans.variable} ${script.variable} ${styles.template}`}>
      <Nav wedding={wedding} links={nav} />
      <Hero wedding={wedding} />

      {/* Convite: faixa lavanda, texto centrado, flores pequenas nos cantos */}
      <section id="convite" className={styles.invite} aria-labelledby="wf-invite">
        <WildflowerCluster className={`${styles.inviteFlower} ${styles.inviteFlowerL}`} />
        <WildflowerCluster className={`${styles.inviteFlower} ${styles.inviteFlowerR}`} />
        <Reveal className={styles.inviteInner}>
          <p className={styles.eyebrow}>O convite</p>
          <h2 id="wf-invite" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <p className={styles.inviteText}>{wedding.welcomeText}</p>
        </Reveal>
      </section>

      {/* História: páginas de diário com fio pontilhado e foto flutuando */}
      {moments.length ? (
        <section id="historia" className={styles.story} aria-labelledby="wf-story">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.storyHead}>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="wf-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
            <div className={styles.pages}>
              {moments.map((moment, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(moment.headline);
                return (
                  <Reveal as="article" key={moment.id} className={`${styles.page} ${i % 2 ? styles.pageLeft : ""}`}>
                    <div className={styles.pageText}>
                      <span className={styles.pageNum} aria-hidden>
                        {moment.number}
                      </span>
                      <h3 className={styles.pageTitle}>{moment.title}</h3>
                      {lines.length ? (
                        <p className={styles.pageHeadline}>
                          {lines.map((line, k) => (
                            <span key={k}>{line}</span>
                          ))}
                        </p>
                      ) : null}
                      <p className={styles.body}>{moment.description}</p>
                    </div>
                    {img ? (
                      <figure className={styles.pagePhoto}>
                        <Image
                          src={img.src}
                          alt={img.alt}
                          width={720}
                          height={900}
                          loading="lazy"
                          sizes="(min-width: 900px) 30vw, 60vw"
                          className={styles.pagePhotoImg}
                        />
                      </figure>
                    ) : null}
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <Countdown wedding={wedding} />

      {/* Programação: trilha horizontal no desktop, vertical no celular */}
      {schedule.length ? (
        <section id="programacao" className={styles.schedule} aria-labelledby="wf-schedule">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.scheduleHead}>
              <p className={styles.eyebrow}>O dia</p>
              <h2 id="wf-schedule" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? <p className={styles.lead}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <ol className={styles.trail}>
              {schedule.map((item, i) => (
                <Reveal as="li" key={item.id} className={styles.stop} delay={i * 0.06} y={12}>
                  <span className={styles.stopTime}>{item.time}</span>
                  <span className={styles.stopTitle}>{item.title}</span>
                  {item.note ? <span className={styles.stopNote}>{item.note}</span> : null}
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Local: texto acima, mapa com borda de 24px */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="wf-place">
          <div className={styles.wrap}>
            <Reveal className={styles.placeHead}>
              <p className={styles.eyebrow}>Onde</p>
              <h2 id="wf-place" className={styles.h2}>
                {location.venue || location.city}
              </h2>
              <p className={styles.placeCity}>
                {[location.venue ? location.city : "", location.address].filter(Boolean).join(" · ")}
              </p>
              {location.note ? <p className={styles.body}>{location.note}</p> : null}
              <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
                Abrir no Google Maps
              </a>
            </Reveal>
            <Reveal className={styles.map} y={20}>
              <iframe
                className={styles.mapFrame}
                src={mapEmbedUrl(location)}
                title={`Mapa: ${location.venue || location.city}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Cartões: três colunas com uma margarida como marcador */}
      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={styles.wrap}>
            <ul className={styles.cardList}>
              {cards.map((card, i) => (
                <Reveal as="li" key={card.id} className={styles.card} delay={i * 0.06}>
                  <WildflowerCluster viewBox={BLOOM_VIEWBOX} className={styles.bloom} />
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
        <section id="presentes" className={styles.gifts} aria-labelledby="wf-gifts">
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.giftsHead}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="wf-gifts" className={styles.h2}>
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

      {/* Encerramento: foto grande com faixa de flores sobre a borda inferior */}
      <section className={styles.closing} aria-label="Até lá">
        <Reveal className={styles.closingText}>
          <p className={`${styles.eyebrow} ${styles.eyebrowScript}`}>com amor</p>
          <p className={styles.closingQuote}>{wedding.finalText}</p>
        </Reveal>
        <div className={styles.closingMedia}>
          {wedding.footerImage ? (
            <Reveal className={styles.closingPhoto} y={20}>
              <Image
                src={wedding.footerImage}
                alt=""
                width={1600}
                height={1000}
                loading="lazy"
                sizes="(min-width: 1200px) 1120px, 100vw"
                className={styles.closingImg}
              />
            </Reveal>
          ) : null}
          <div className={styles.meadow} aria-hidden>
            {Array.from({ length: 9 }, (_, i) => (
              <WildflowerCluster key={i} className={styles.meadowFlower} />
            ))}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <p className={styles.footerMono}>{wedding.monogram}</p>
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
  return (
    <section id="topo" className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <WildflowerCluster className={`${styles.heroFlower} ${styles.heroFlowerBig}`} />
      <WildflowerCluster className={`${styles.heroFlower} ${styles.heroFlowerSmall}`} />

      <div className={styles.heroText}>
        <p className={`${styles.eyebrow} ${styles.eyebrowScript} hero-rise`}>com amor</p>
        <h1
          className={`${styles.names} hero-rise`}
          data-scale={nameScale(wedding.coupleNames)}
          style={{ animationDelay: "120ms" }}
        >
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
        {wedding.rsvp.enabled ? (
          <a href="#confirmar" className={`${styles.btn} hero-rise`} style={{ animationDelay: "360ms" }}>
            Confirmar presença
          </a>
        ) : null}
      </div>

      {wedding.heroImage ? (
        <figure className={`${styles.polaroid} hero-rise`} style={{ animationDelay: "300ms" }}>
          <span className={styles.polaroidFrame}>
            <Image
              src={wedding.heroImage}
              alt=""
              fill
              priority
              sizes="(min-width: 900px) 36vw, 72vw"
              className={styles.polaroidImg}
            />
          </span>
        </figure>
      ) : null}
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
            <div className={styles.rings}>
              {units.map(([value, label]) => (
                <span key={label} className={styles.ring}>
                  <span className={styles.ringNum}>{c.ready ? pad(value) : "–"}</span>
                  <span className={styles.ringLabel}>{label}</span>
                </span>
              ))}
            </div>
          ) : null}
          <p className={styles.countScript}>até o nosso dia</p>
          <p className={styles.countDate}>{wedding.weddingDateLabel}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Galeria */

function Gallery({ images }: { images: WeddingSite["gallery"] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="wf-gallery">
      <div className={styles.wrap}>
        <Reveal as="header" className={styles.galleryHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="wf-gallery" className={styles.h2}>
            Retratos dos dois
          </h2>
        </Reveal>
        <div className={styles.galleryGrid}>
          {images.map((image, i) => (
            <Reveal
              key={image.id}
              className={`${styles.shot} ${i % 3 === 2 ? styles.shotTilt : ""}`}
              delay={(i % 2) * 0.06}
              y={14}
            >
              <button
                type="button"
                className={styles.shotBtn}
                onClick={() => lb.open(i)}
                aria-label={`Abrir foto: ${image.alt}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={900}
                  height={1100}
                  loading="lazy"
                  sizes="(min-width: 900px) 40vw, 50vw"
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
