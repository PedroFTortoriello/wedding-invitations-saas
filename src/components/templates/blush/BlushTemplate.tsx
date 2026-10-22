"use client";

import Image from "next/image";
import { Ovo, Red_Hat_Text } from "next/font/google";
import type { WeddingSite, WeddingGalleryImage, WeddingLocation } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, pad, useCountdown } from "@/components/templates/shared/motion";
import { useMenu, useScrolled } from "@/components/templates/kit/hooks";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { OrangeBlossom } from "@/components/templates/kit/ornaments";
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
  storyMoments
} from "@/components/templates/kit/utils";
import styles from "./blush.module.css";

/* Ovo só existe em 400 regular; o itálico dos destaques fica com a Red Hat Text. */
const display = Ovo({ subsets: ["latin"], weight: "400", variable: "--bl-display", display: "swap" });
const sans = Red_Hat_Text({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--bl-sans",
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

export function BlushTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gifts = activeGifts(wedding);
  const photos = galleryRest(wedding);
  const anchors = new Set<string>(["#convite"]);
  if (moments.length) anchors.add("#historia");
  if (schedule.length) anchors.add("#programacao");
  if (location) anchors.add("#local");
  if (gifts.length) anchors.add("#presentes");
  if (photos.length) anchors.add("#galeria");
  if (wedding.rsvp.enabled) anchors.add("#confirmar");

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template}`}>
      <Nav wedding={wedding} links={NAV.filter(([href]) => anchors.has(href))} />
      <Hero wedding={wedding} location={location} />

      {/* Convite: faixa blush, coluna estreita centrada, fio curto rosa. */}
      <section id="convite" className={styles.invite} aria-labelledby="bl-invite">
        <Reveal className={styles.inviteInner}>
          <p className={styles.eyebrow}>Convite</p>
          <h2 id="bl-invite" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          <span className={styles.rule} aria-hidden />
          <p className={styles.inviteText}>{wedding.welcomeText}</p>
        </Reveal>
      </section>

      {moments.length ? <Story wedding={wedding} moments={moments} /> : null}

      <Countdown wedding={wedding} />

      {schedule.length ? (
        <section id="programacao" className={styles.schedule} aria-labelledby="bl-schedule">
          <div className={`${styles.wrap} ${styles.scheduleGrid}`}>
            <Reveal className={styles.scheduleHead}>
              <p className={styles.eyebrow}>Programação</p>
              <h2 id="bl-schedule" className={styles.h2}>
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

      {location ? <Place location={location} /> : null}

      {cards.length ? (
        <section className={styles.cards} aria-label="Informações">
          <div className={`${styles.wrap} ${styles.cardsGrid}`}>
            {cards.map((card, i) => (
              <Reveal as="article" key={card.id} className={styles.card} delay={i * 0.06} y={14}>
                {card.image ? (
                  <Image
                    src={card.image}
                    alt=""
                    width={640}
                    height={800}
                    loading="lazy"
                    sizes="(min-width: 900px) 30vw, 70vw"
                    className={styles.cardImg}
                  />
                ) : null}
                {card.subtitle ? <p className={styles.cardKicker}>{card.subtitle}</p> : null}
                <h3 className={styles.cardTitle}>{card.title}</h3>
                {card.body ? <p className={styles.cardBody}>{card.body}</p> : null}
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {gifts.length ? (
        <section id="presentes" className={styles.gifts} aria-labelledby="bl-gifts">
          <div className={styles.wrap}>
            <Reveal className={styles.giftsHead}>
              <p className={styles.eyebrow}>Presentes</p>
              <h2 id="bl-gifts" className={styles.h2}>
                Um carinho para a vida a dois
              </h2>
              <p className={styles.lead}>Cada cota é um Pix direto para o casal, sem taxas nem intermediários.</p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {photos.length ? <Gallery photos={photos} /> : null}

      <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />

      <Closing wedding={wedding} />

      <footer className={styles.footer}>
        <p className={styles.footerMono}>{wedding.monogram || initials(wedding.coupleNames).join("")}</p>
        <p className={styles.footerNames}>{wedding.coupleNames}</p>
        <p className={styles.footerMeta}>
          {[wedding.weddingDateLabel, location?.city].filter(Boolean).join(" · ")}
        </p>
        {wedding.footerText ? <p className={styles.footerText}>{wedding.footerText}</p> : null}
        <p className={styles.footerCredit}>Feito com Noivar</p>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ Nav */

function Nav({ wedding, links }: Props & { links: ReadonlyArray<readonly [string, string]> }) {
  const solid = useScrolled(60);
  const [open, toggle, close] = useMenu();
  return (
    <header className={`${styles.nav} ${solid || open ? styles.navSolid : ""}`}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <a href="#top" className={styles.navMono} aria-label={wedding.coupleNames}>
          {wedding.monogram || initials(wedding.coupleNames).join("")}
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

function Hero({ wedding, location }: Props & { location: WeddingLocation | null }) {
  const [a, b] = splitCouple(wedding.coupleNames);
  const mono = wedding.monogram || initials(wedding.coupleNames).join("");
  const place = location ? [location.venue, location.city].filter(Boolean).join(" · ") : "";
  return (
    <section id="top" className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <div className={`${styles.wrap} ${styles.heroGrid}`}>
        <div className={styles.heroText}>
          <p className={`${styles.eyebrow} hero-rise`}>Vamos nos casar</p>
          <h1 className={`${styles.heroNames} hero-rise`} data-scale={nameScale(wedding.coupleNames)} style={{ animationDelay: "100ms" }}>
            <span className={styles.heroName}>{a}</span>
            {b ? (
              <>
                <span className={styles.heroAmp} aria-hidden>
                  &amp;
                </span>
                <span className={styles.heroName}>{b}</span>
              </>
            ) : null}
          </h1>
          <p className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "200ms" }}>
            <span>{wedding.weddingDateLabel}</span>
            {wedding.weddingTime ? <span>{wedding.weddingTime}</span> : null}
            {place ? <span>{place}</span> : null}
          </p>
          <a href="#confirmar" className={`${styles.btn} ${styles.heroCta} hero-rise`} style={{ animationDelay: "300ms" }}>
            Confirmar presença
          </a>
        </div>

        <div className={`${styles.heroArt} hero-rise`} style={{ animationDelay: "160ms" }}>
          <OrangeBlossom className={styles.heroBlossom} />
          {wedding.heroImage ? (
            <div className={styles.heroArch}>
              <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 900px) 38vw, 70vw" className={styles.heroImg} />
            </div>
          ) : (
            <div className={`${styles.heroArch} ${styles.heroArchEmpty}`}>
              <span className={styles.heroMono}>{mono}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- História */

function Story({ wedding, moments }: Props & { moments: WeddingSite["storyMoments"] }) {
  return (
    <section id="historia" className={styles.story} aria-labelledby="bl-story">
      <div className={styles.wrap}>
        <Reveal className={styles.storyHead}>
          <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
          <h2 id="bl-story" className={styles.h2}>
            {wedding.storyTitle}
          </h2>
        </Reveal>
        <div className={styles.chapters}>
          {moments.map((moment, i) => {
            const img = storyImage(wedding.gallery, i);
            const lines = headlineLines(moment.headline);
            return (
              <Reveal as="article" key={moment.id} className={`${styles.chapter} ${i % 2 ? styles.chapterAlt : ""}`} y={20}>
                <div className={styles.chapterArt}>
                  {img ? (
                    <Image
                      src={img.src}
                      alt={img.alt}
                      width={600}
                      height={780}
                      loading="lazy"
                      sizes="(min-width: 900px) 18vw, 36vw"
                      className={styles.chapterImg}
                    />
                  ) : (
                    <span className={styles.chapterBlank} aria-hidden />
                  )}
                  <span className={styles.chapterNum} aria-hidden>
                    {moment.number}
                  </span>
                </div>
                <div className={styles.chapterBody}>
                  <h3 className={styles.chapterTitle}>{moment.title}</h3>
                  {lines.length ? (
                    <p className={styles.chapterHeadline}>
                      {lines.map((line, k) => (
                        <span key={k}>{line}</span>
                      ))}
                    </p>
                  ) : null}
                  {moment.description ? <p className={styles.body}>{moment.description}</p> : null}
                </div>
              </Reveal>
            );
          })}
        </div>
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
      <Reveal className={`${styles.wrap} ${styles.countInner}`}>
        <p className={styles.eyebrow}>{c.isPast ? "Chegou o dia" : "Faltam"}</p>
        {valid && !c.isPast ? (
          <div className={styles.pills}>
            {units.map(([value, label]) => (
              <span key={label} className={styles.pill}>
                <span className={styles.pillNum}>{c.ready ? pad(value) : "—"}</span>
                <span className={styles.pillLabel}>{label}</span>
              </span>
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

/* ----------------------------------------------------------------- Local */

function Place({ location }: { location: WeddingLocation }) {
  return (
    <section id="local" className={styles.place} aria-labelledby="bl-place">
      <div className={styles.wrap}>
        <Reveal className={styles.placeHead}>
          <p className={styles.eyebrow}>Onde</p>
          <h2 id="bl-place" className={styles.h2}>
            {location.venue || location.city}
          </h2>
          {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
          {location.address ? <p className={styles.placeAddress}>{location.address}</p> : null}
          {location.note ? <p className={styles.lead}>{location.note}</p> : null}
          <a className={styles.btn} href={mapLink(location)} target="_blank" rel="noreferrer">
            Abrir no Google Maps
          </a>
        </Reveal>
        <Reveal className={styles.mapFrame} delay={0.08} y={20}>
          <iframe className={styles.map} src={mapEmbedUrl(location)} title={`Mapa — ${location.venue || location.city}`} loading="lazy" />
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Galeria */

function Gallery({ photos }: { photos: WeddingGalleryImage[] }) {
  const lb = useLightbox();
  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="bl-gallery">
      <div className={styles.wrap}>
        <Reveal className={styles.galleryHead}>
          <p className={styles.eyebrow}>Galeria</p>
          <h2 id="bl-gallery" className={styles.h2}>
            Nossos dias
          </h2>
        </Reveal>
        <ul className={styles.galleryGrid}>
          {photos.map((img, i) => (
            <Reveal as="li" key={img.id} className={styles.galleryItem} delay={(i % 3) * 0.06} y={14}>
              <button type="button" className={`${styles.galleryBtn} ${i % 2 ? styles.galleryRound : styles.galleryArch}`} onClick={() => lb.open(i)} aria-label={`Ampliar: ${img.alt}`}>
                <Image src={img.src} alt={img.alt} width={700} height={880} loading="lazy" sizes="(min-width: 900px) 30vw, 46vw" className={styles.galleryImg} />
              </button>
            </Reveal>
          ))}
        </ul>
      </div>
      <Lightbox
        images={photos}
        active={lb.active}
        onClose={lb.close}
        classNames={{ dialog: styles.lightbox, close: styles.lbClose, nav: styles.lbNav, figure: styles.lbFig, img: styles.lbImg, caption: styles.lbCaption }}
      />
    </section>
  );
}

/* ---------------------------------------------------------- Encerramento */

function Closing({ wedding }: Props) {
  if (!wedding.finalText && !wedding.footerImage) return null;
  return (
    <section className={styles.closing} aria-label="Encerramento">
      <div className={styles.wrap}>
        {wedding.footerImage ? (
          <Reveal className={styles.closingArch} y={20}>
            <Image src={wedding.footerImage} alt="" width={900} height={1100} loading="lazy" sizes="(min-width: 900px) 34vw, 68vw" className={styles.closingImg} />
          </Reveal>
        ) : null}
        {wedding.finalText ? (
          <Reveal className={`${styles.closingPanel} ${wedding.footerImage ? styles.closingPanelOverlap : ""}`} delay={0.08}>
            {!wedding.footerImage ? <OrangeBlossom className={styles.closingBlossom} /> : null}
            <p className={styles.closingText}>{wedding.finalText}</p>
            <p className={styles.closingSign}>{wedding.coupleNames}</p>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
