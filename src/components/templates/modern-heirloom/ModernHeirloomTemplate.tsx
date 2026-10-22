"use client";

import Image from "next/image";
import { Karla, Libre_Caslon_Text } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown } from "@/components/templates/shared/motion";
import { useMenu } from "@/components/templates/kit/hooks";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import {
  CornerFlourish,
  Diamond,
  DoubleRule,
  MonogramRing,
} from "@/components/templates/kit/ornaments";
import { PAPER } from "@/components/templates/kit/textures";
import {
  activeCards,
  activeGifts,
  dateParts,
  firstNames,
  headlineLines,
  initials,
  mainLocation,
  mapEmbedUrl,
  mapLink,
  monthName,
  nameScale,
  program,
  splitCouple,
  storyMoments,
  weddingYear,
} from "@/components/templates/kit/utils";
import styles from "./modern-heirloom.module.css";

const display = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--mh-display",
  display: "swap",
});

const sans = Karla({
  subsets: ["latin"],
  weight: "variable",
  variable: "--mh-sans",
  display: "swap",
});

type Props = { wedding: WeddingSite };

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export function ModernHeirloomTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gifts = activeGifts(wedding);
  const moments = storyMoments(wedding);
  const photos = galleryRest(wedding);
  const [nameA, nameB] = splitCouple(wedding.coupleNames);
  const [initialA, initialB] = initials(
    wedding.coupleNames,
    wedding.monogram.charAt(0) || "♥",
  );
  const [firstA, firstB] = firstNames(wedding.coupleNames);
  const year = weddingYear(wedding);
  const place = location
    ? [location.venue, location.city].filter(Boolean).join(" · ")
    : "";
  const lb = useLightbox();

  const links: Array<[string, string]> = [["#convite", "Convite"]];
  if (moments.length) links.push(["#historia", "História"]);
  if (schedule.length) links.push(["#programacao", "Programação"]);
  if (location) links.push(["#local", "Local"]);
  if (gifts.length) links.push(["#presentes", "Presentes"]);
  if (photos.length) links.push(["#galeria", "Galeria"]);
  links.push(["#confirmar", wedding.rsvp.enabled ? "Confirmar" : "Recados"]);

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template}`}>
      <span
        className={styles.paper}
        style={{ backgroundImage: PAPER }}
        aria-hidden
      />
      <Nav
        wedding={wedding}
        links={links}
        fallbackMonogram={`${initialA}${initialB}`}
      />

      {/* Capa: papel, selo, nomes e a linha de versaletes — a foto vem abaixo da dobra. */}
      <section
        id="topo"
        className={styles.hero}
        aria-label={`Casamento de ${wedding.coupleNames}`}
      >
        <span className={styles.heroFrame} aria-hidden />
        <div className={styles.heroInner}>
          <span className="hero-rise">
            <Seal a={initialA} b={initialB} />
          </span>
          <div className={styles.heroMid}>
            <p
              className={`${styles.heroEyebrow} hero-rise`}
              style={{ animationDelay: "80ms" }}
            >
              Convidam para o seu casamento
            </p>
            <h1
              className={`${styles.names} hero-rise`}
              data-scale={nameScale(wedding.coupleNames)}
              style={{ animationDelay: "140ms" }}
            >
              <span className={styles.name}>{nameA}</span>
              {nameB ? (
                <>
                  <span className={styles.amp}>&</span>
                  <span className={styles.name}>{nameB}</span>
                </>
              ) : null}
            </h1>
          </div>
          <p
            className={`${styles.heroLine} hero-rise`}
            style={{ animationDelay: "220ms" }}
          >
            <span className={styles.heroItem}>{wedding.weddingDateLabel}</span>
            {wedding.weddingTime ? (
              <span className={styles.heroItem}>
                <Diamond className={styles.dia} />
                {wedding.weddingTime}
              </span>
            ) : null}
            {place ? (
              <span className={styles.heroItem}>
                <Diamond className={styles.dia} />
                {place}
              </span>
            ) : null}
          </p>
          {!wedding.heroImage ? (
            <DoubleRule
              className={`${styles.heroRule} hero-rise`}
              style={{ animationDelay: "300ms" }}
            />
          ) : null}
        </div>
      </section>

      {wedding.heroImage ? (
        <section className={styles.album} aria-label="Foto do casal">
          <Reveal as="figure" className={styles.albumCard} y={24}>
            <span className={styles.albumMat}>
              <span className={styles.albumPhoto}>
                <Image
                  src={wedding.heroImage}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 900px) 34rem, 100vw"
                  className={styles.albumImg}
                />
              </span>
            </span>
            <figcaption className={styles.albumCaption}>
              {firstB ? `${firstA} & ${firstB}` : firstA}
              {year ? ` · ${year}` : ""}
            </figcaption>
          </Reveal>
        </section>
      ) : null}

      {/* Convite: retângulo fino com florões nos quatro cantos. */}
      <section
        id="convite"
        className={styles.invite}
        aria-labelledby="mh-invite"
      >
        <Reveal className={styles.inviteBox}>
          <CornerFlourish className={styles.corner} data-pos="tl" />
          <CornerFlourish className={styles.corner} data-pos="tr" />
          <CornerFlourish className={styles.corner} data-pos="bl" />
          <CornerFlourish className={styles.corner} data-pos="br" />
          <p className={styles.eyebrow}>O convite</p>
          <h2 id="mh-invite" className={styles.inviteWords}>
            {wedding.invitationWords.join(" ")}
          </h2>
          {wedding.welcomeText ? (
            <p className={`${styles.body} ${styles.inviteText}`}>
              {wedding.welcomeText}
            </p>
          ) : null}
        </Reveal>
      </section>

      {/* História: linha do tempo vertical, números em círculos, fotos pequenas alternando. */}
      {moments.length ? (
        <section
          id="historia"
          className={styles.story}
          aria-labelledby="mh-story"
        >
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.storyHead}>
              {wedding.storyEyebrow ? (
                <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              ) : null}
              <h2 id="mh-story" className={styles.h2}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
            <ol className={styles.timeline}>
              {moments.map((moment, i) => {
                const img = storyImage(wedding.gallery, i);
                const lines = headlineLines(moment.headline);
                return (
                  <Reveal
                    as="li"
                    key={moment.id}
                    className={styles.chapter}
                    delay={i * 0.06}
                  >
                    <span className={styles.chapterNum} aria-hidden>
                      {moment.number || String(i + 1).padStart(2, "0")}
                    </span>
                    <div className={styles.chapterBody}>
                      {moment.title ? (
                        <p className={styles.kicker}>{moment.title}</p>
                      ) : null}
                      {lines.length ? (
                        <h3 className={styles.chapterHead}>
                          {lines.map((line, k) => (
                            <span key={k}>{line}</span>
                          ))}
                        </h3>
                      ) : null}
                      {moment.description ? (
                        <p className={styles.body}>{moment.description}</p>
                      ) : null}
                    </div>
                    {img ? (
                      <figure className={styles.chapterPhoto}>
                        <Image
                          src={img.src}
                          alt={img.alt}
                          width={600}
                          height={800}
                          loading="lazy"
                          sizes="(min-width: 860px) 15rem, 50vw"
                          className={styles.chapterImg}
                        />
                      </figure>
                    ) : null}
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </section>
      ) : null}

      <Calendar wedding={wedding} />

      {/* Programação: cardápio em duas colunas. */}
      {schedule.length ? (
        <section
          id="programacao"
          className={styles.menu}
          aria-labelledby="mh-program"
        >
          <div className={`${styles.wrap} ${styles.menuGrid}`}>
            <Reveal as="header" className={styles.menuHead}>
              <p className={styles.eyebrow}>Programação</p>
              <h2 id="mh-program" className={styles.h2}>
                {wedding.detailsTitle}
              </h2>
              {wedding.detailsSubtitle ? (
                <p className={styles.lead}>{wedding.detailsSubtitle}</p>
              ) : null}
            </Reveal>
            <ol className={styles.menuList}>
              {schedule.map((item, i) => (
                <Reveal
                  as="li"
                  key={item.id}
                  className={styles.menuItem}
                  delay={i * 0.05}
                  y={12}
                >
                  <span className={styles.menuTime}>{item.time}</span>
                  <span className={styles.menuTitle}>{item.title}</span>
                  {item.note ? (
                    <span className={styles.menuNote}>{item.note}</span>
                  ) : null}
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Local: cartão de papel com borda dupla e o mapa dentro. */}
      {location ? (
        <section id="local" className={styles.place} aria-labelledby="mh-place">
          <div className={styles.wrap}>
            <Reveal className={styles.placeCard}>
              <div className={styles.placeInfo}>
                <p className={styles.eyebrow}>O local</p>
                <h2 id="mh-place" className={styles.h2}>
                  {location.venue || location.city}
                </h2>
                {location.venue && location.city ? (
                  <p className={styles.placeCity}>{location.city}</p>
                ) : null}
                {location.address ? (
                  <p className={styles.placeAddr}>{location.address}</p>
                ) : null}
                {location.note ? (
                  <p className={styles.body}>{location.note}</p>
                ) : null}
                <a
                  className={styles.btn}
                  href={mapLink(location)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir no mapa
                </a>
              </div>
              <div className={styles.placeMap}>
                <iframe
                  className={styles.map}
                  src={mapEmbedUrl(location)}
                  title={`Mapa — ${location.venue || location.city}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Informações: lista "ficha" — título em versaletes, fio inferior. */}
      {cards.length ? (
        <section
          id="informacoes"
          className={styles.sheet}
          aria-labelledby="mh-cards"
        >
          <div className={styles.wrap}>
            <Reveal as="header">
              <p className={styles.eyebrow}>Bom saber</p>
              <h2 id="mh-cards" className={styles.h2}>
                Informações
              </h2>
            </Reveal>
            <ul className={styles.sheetList}>
              {cards.map((card, i) => (
                <Reveal
                  as="li"
                  key={card.id}
                  className={styles.sheetRow}
                  delay={i * 0.05}
                  y={12}
                >
                  <h3 className={styles.sheetTitle}>{card.title}</h3>
                  <div className={styles.sheetText}>
                    {card.subtitle ? (
                      <p className={styles.sheetSub}>{card.subtitle}</p>
                    ) : null}
                    {card.body ? (
                      <p className={styles.body}>{card.body}</p>
                    ) : null}
                  </div>
                  {card.image ? (
                    <Image
                      src={card.image}
                      alt=""
                      width={180}
                      height={180}
                      loading="lazy"
                      sizes="5rem"
                      className={styles.sheetThumb}
                    />
                  ) : null}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {gifts.length ? (
        <section
          id="presentes"
          className={styles.gifts}
          aria-labelledby="mh-gifts"
        >
          <div className={styles.wrap}>
            <Reveal as="header" className={styles.giftsHead}>
              <p className={styles.eyebrow}>Lista de presentes</p>
              <h2 id="mh-gifts" className={styles.h2}>
                Um gesto para a casa nova
              </h2>
              <p className={styles.lead}>
                Cada presente vira um Pix direto para o casal, sem
                intermediários.
              </p>
            </Reveal>
            <GiftRegistry wedding={wedding} variant="inherit" />
          </div>
        </section>
      ) : null}

      {/* Galeria: grade com molduras finas, lightbox do kit. */}
      {photos.length ? (
        <section
          id="galeria"
          className={styles.gallery}
          aria-labelledby="mh-gallery"
        >
          <div className={styles.wrap}>
            <Reveal as="header">
              <p className={styles.eyebrow}>Álbum</p>
              <h2 id="mh-gallery" className={styles.h2}>
                Galeria
              </h2>
            </Reveal>
            <ul className={styles.galleryGrid}>
              {photos.map((img, i) => (
                <Reveal
                  as="li"
                  key={img.id}
                  className={styles.galleryItem}
                  delay={(i % 3) * 0.06}
                  y={12}
                >
                  <button
                    type="button"
                    className={styles.galleryBtn}
                    onClick={() => lb.open(i)}
                    aria-label={`Ampliar foto: ${img.alt}`}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      width={800}
                      height={1000}
                      loading="lazy"
                      sizes="(min-width: 860px) 24rem, 50vw"
                      className={styles.galleryImg}
                    />
                  </button>
                </Reveal>
              ))}
            </ul>
          </div>
          <Lightbox
            images={photos}
            active={lb.active}
            onClose={lb.close}
            classNames={{
              dialog: styles.lightbox,
              close: styles.lightboxClose,
              nav: styles.lightboxNav,
              figure: styles.lightboxFig,
              img: styles.lightboxImg,
              caption: styles.lightboxCaption,
            }}
          />
        </section>
      ) : null}

      <GuestForms
        wedding={wedding}
        variant="inherit"
        mode="both"
        sectionId="confirmar"
      />

      {/* Encerramento: footerImage em oval com o texto ao lado. */}
      <section className={styles.closing} aria-label="Mensagem final">
        <div
          className={`${styles.wrap} ${styles.closingGrid}`}
          data-photo={wedding.footerImage ? "true" : undefined}
        >
          {wedding.footerImage ? (
            <Reveal as="figure" className={styles.ovalRing} y={24}>
              <span className={styles.oval}>
                <Image
                  src={wedding.footerImage}
                  alt=""
                  width={700}
                  height={875}
                  loading="lazy"
                  sizes="(min-width: 860px) 20rem, 70vw"
                  className={styles.ovalImg}
                />
              </span>
            </Reveal>
          ) : null}
          <Reveal className={styles.closingText} delay={0.08}>
            <p className={styles.eyebrow}>Até lá</p>
            {wedding.finalText ? (
              <p className={styles.closingLead}>{wedding.finalText}</p>
            ) : null}
            {!wedding.footerImage ? (
              <DoubleRule className={styles.rule} />
            ) : null}
            <p className={styles.signature}>
              {nameB ? `${nameA} & ${nameB}` : nameA}
            </p>
          </Reveal>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <Seal a={initialA} b={initialB} className={styles.footerSeal} />
          <p className={styles.footerLove}>com amor</p>
          {wedding.footerText ? (
            <p className={styles.footerText}>{wedding.footerText}</p>
          ) : null}
          <p className={styles.footerMeta}>
            {wedding.coupleNames} · {wedding.weddingDateLabel}
            {location?.city ? ` · ${location.city}` : ""}
          </p>
          <p className={styles.footerBrand}>Feito com Noivar</p>
        </div>
      </footer>
    </main>
  );
}

/* ----------------------------------------------------------------- Selo */

function Seal({
  a,
  b,
  className,
}: {
  a: string;
  b: string;
  className?: string;
}) {
  return (
    <span className={`${styles.seal} ${className ?? ""}`} aria-hidden>
      <MonogramRing className={styles.sealRing} />
      <span className={styles.sealText}>
        {a}
        {b ? <em>&</em> : null}
        {b}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ Nav */

function Nav({
  wedding,
  links,
  fallbackMonogram,
}: Props & { links: Array<[string, string]>; fallbackMonogram: string }) {
  const [open, toggle, close] = useMenu();
  return (
    <header className={styles.nav}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <a
          href="#topo"
          className={styles.navMono}
          aria-label={wedding.coupleNames}
        >
          {wedding.monogram || fallbackMonogram}
        </a>
        <nav className={styles.navLinks} aria-label="Seções">
          {links.map(([href, label]) => (
            <a key={href} href={href} className={styles.navLink}>
              {label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          className={styles.navToggle}
          aria-expanded={open}
          onClick={toggle}
        >
          {open ? "Fechar" : "Menu"}
        </button>
      </div>
      {open ? (
        <nav className={styles.navMobile} aria-label="Seções">
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className={styles.navMobileLink}
              onClick={close}
            >
              {label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

/* ------------------------------------------------------------ Calendário */

function Calendar({ wedding }: Props) {
  const c = useCountdown(wedding.weddingDate);
  const { day, year } = dateParts(wedding);
  const month = monthName(wedding);
  const valid = Boolean(day);

  let text: string;
  if (!valid) text = wedding.weddingDateLabel;
  else if (c.isPast) text = "Hoje é o grande dia.";
  else if (!c.ready) text = "Contando os dias…";
  else
    text = `Faltam ${plural(c.days, "dia", "dias")}, ${plural(c.hours, "hora", "horas")} e ${plural(
      c.minutes,
      "minuto",
      "minutos",
    )}.`;

  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <div className={`${styles.wrap} ${styles.countGrid}`}>
        {valid ? (
          <Reveal className={styles.calendar}>
            <span className={styles.calMonth}>{month}</span>
            <span className={styles.calDay}>{day}</span>
            <span className={styles.calYear}>{year}</span>
          </Reveal>
        ) : null}
        <Reveal className={styles.countText} delay={0.08}>
          <p className={styles.eyebrow}>A contagem</p>
          <p className={styles.countLead}>{text}</p>
          {valid ? (
            <p className={styles.countMeta}>
              {wedding.weddingDateLabel}
              {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
