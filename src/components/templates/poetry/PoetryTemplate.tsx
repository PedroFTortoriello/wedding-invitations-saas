"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Inter, Literata } from "next/font/google";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { galleryRest, storyImage } from "@/components/templates/shared/gallery";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { Lightbox, useLightbox } from "@/components/templates/kit/Lightbox";
import { useMenu } from "@/components/templates/kit/hooks";
import {
  activeCards,
  activeGifts,
  mainLocation,
  mapEmbedUrl,
  mapLink,
  nameScale,
  program,
  splitCouple,
  storyMoments
} from "@/components/templates/kit/utils";
import styles from "./poetry.module.css";

/* Literata variável: o eixo opsz dá o desenho fino nos versos grandes e o firme no corpo. */
const display = Literata({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--po-display",
  display: "swap"
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--po-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

const NAV = [
  ["#convite", "Convite"],
  ["#historia", "História"],
  ["#indice", "Programação"],
  ["#local", "Local"],
  ["#presentes", "Presentes"],
  ["#galeria", "Fotos"],
  ["#confirmar", "Confirmar"]
] as const;

/* ------------------------------------------------------------ helpers */

/** Quebra a frase-convite em versos de 2–3 palavras (2, 3, 2, 3…); sobra de 1 cola no último. */
function verses(words: string[]): string[] {
  const clean = words.map((w) => w.trim()).filter(Boolean);
  const out: string[] = [];
  let i = 0;
  let size = 2;
  while (i < clean.length) {
    const rest = clean.length - i;
    const take = rest - size === 1 ? rest : Math.min(size, rest);
    out.push(clean.slice(i, i + take).join(" "));
    i += take;
    size = size === 2 ? 3 : 2;
  }
  return out;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const roman = (i: number) => ROMAN[i] ?? String(i + 1);

const UNITS = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

/** Número por extenso em pt-BR (0–9999); acima disso, os dígitos. */
function spell(n: number): string {
  if (n < 20) return UNITS[n];
  if (n < 100) return n % 10 ? `${TENS[Math.floor(n / 10)]} e ${UNITS[n % 10]}` : TENS[Math.floor(n / 10)];
  if (n === 100) return "cem";
  if (n < 1000) return n % 100 ? `${HUNDREDS[Math.floor(n / 100)]} e ${spell(n % 100)}` : HUNDREDS[Math.floor(n / 100)];
  if (n < 10000) {
    const k = Math.floor(n / 1000);
    const r = n % 1000;
    const head = k === 1 ? "mil" : `${UNITS[k]} mil`;
    return r ? `${head} ${r < 100 || r % 100 === 0 ? "e " : ""}${spell(r)}` : head;
  }
  return String(n);
}

/* --------------------------------------------------------------- page */

/** Uma "página" do livro: cabeçalho corrido (rótulo da seção) e fólio centrado no pé. */
function Page({
  id,
  n,
  head,
  className,
  children,
  ariaLabel
}: {
  id?: string;
  n: number;
  head?: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <section id={id} className={`${styles.page} ${className ?? ""}`} aria-label={ariaLabel}>
      {head ? <p className={styles.runHead}>{head}</p> : null}
      <div className={styles.pageBody}>{children}</div>
      <p className={styles.folio} aria-hidden>
        {n}
      </p>
    </section>
  );
}

/* ------------------------------------------------------------ template */

export function PoetryTemplate({ wedding }: Props) {
  const location = mainLocation(wedding);
  const moments = storyMoments(wedding);
  const schedule = program(wedding);
  const cards = activeCards(wedding);
  const gallery = galleryRest(wedding);
  const hasGifts = activeGifts(wedding).length > 0;
  const [a, b] = splitCouple(wedding.coupleNames);
  const poem = verses(wedding.invitationWords);
  const colophon = [wedding.weddingDateLabel, wedding.weddingTime, location?.venue, location?.city].filter(Boolean);

  // Fólios: contados na ordem em que as páginas aparecem (as expressões do JSX
  // são avaliadas na ordem do código, e o render é determinístico).
  let folio = 0;
  const next = () => ++folio;

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template}`}>
      <Nav wedding={wedding} />

      <div className={styles.book}>
        {/* 1 · Capa: só tipografia. Autores, poema, colofão. */}
        <section id="topo" className={styles.cover} aria-label={`Casamento de ${wedding.coupleNames}`}>
          <h1 className={`${styles.authors} hero-rise`} data-scale={nameScale(wedding.coupleNames)}>
            <span className={styles.author}>{a}</span>
            {b ? (
              <>
                <span className={styles.authorAmp} aria-hidden>
                  &amp;
                </span>
                <span className={styles.author}>{b}</span>
              </>
            ) : null}
          </h1>

          <p className={`${styles.poem} hero-rise`} style={{ animationDelay: "120ms" }}>
            {poem.map((verse, i) => (
              <span key={i} className={styles.verse}>
                {verse}
              </span>
            ))}
          </p>

          <div className={`${styles.coverFoot} hero-rise`} style={{ animationDelay: "240ms" }}>
            {colophon.length ? (
              <p className={styles.colophon}>
                {colophon.map((item, i) => (
                  <span key={i} className={styles.colophonItem}>
                    {item}
                  </span>
                ))}
              </p>
            ) : null}
            <p className={styles.folio} aria-hidden>
              {next()}
            </p>
          </div>
        </section>

        {/* 2 · Frontispício: a foto do casal como página inteira, com legenda. */}
        {wedding.heroImage ? (
          <Page n={next()} className={styles.frontis} ariaLabel="Frontispício">
            <Reveal as="figure" className={styles.frontisFig} y={12} duration={0.9}>
              <span className={styles.frontisFrame}>
                <Image src={wedding.heroImage} alt="" fill priority sizes="(min-width: 900px) 26rem, 78vw" className={styles.frontisImg} />
              </span>
              <figcaption className={styles.frontisCap}>
                <span>{wedding.coupleNames}</span>
                {wedding.weddingDateLabel ? <span className={styles.frontisDate}>{wedding.weddingDateLabel}</span> : null}
              </figcaption>
            </Reveal>
          </Page>
        ) : null}

        {/* 3 · Convite: coluna de livro com capitular. */}
        {wedding.welcomeText.trim() ? (
          <Page id="convite" n={next()} head="Convite">
            <Reveal className={styles.column} y={12} duration={0.9}>
              <p className={styles.lead}>{wedding.welcomeText}</p>
            </Reveal>
          </Page>
        ) : null}

        {/* 4 · História: capítulos. */}
        {moments.length ? (
          <Page id="historia" n={next()} head={wedding.storyEyebrow || "Nossa história"}>
            <Reveal className={styles.column} y={12} duration={0.9}>
              <h2 className={styles.title}>{wedding.storyTitle}</h2>
            </Reveal>
            <div className={styles.chapters}>
              {moments.map((m, i) => {
                const img = storyImage(wedding.gallery, i);
                const epigraph = m.headline
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean);
                return (
                  <Reveal as="article" key={m.id} className={styles.chapter} y={12} duration={0.9} delay={i * 0.06}>
                    <p className={styles.chapterNum}>Capítulo {roman(i)}</p>
                    <h3 className={styles.chapterTitle}>{m.title}</h3>
                    {img ? (
                      <span className={styles.chapterPhoto}>
                        <Image src={img.src} alt={img.alt} width={480} height={640} loading="lazy" sizes="(min-width: 900px) 11rem, 34vw" className={styles.chapterImg} />
                      </span>
                    ) : null}
                    {epigraph.length ? (
                      <p className={styles.epigraph}>
                        {epigraph.map((line, k) => (
                          <span key={k}>{line}</span>
                        ))}
                      </p>
                    ) : null}
                    {m.description ? <p className={styles.body}>{m.description}</p> : null}
                  </Reveal>
                );
              })}
            </div>
          </Page>
        ) : null}

        {/* 5 · Contagem por extenso. */}
        <Countdown wedding={wedding} n={next()} />

        {/* 6 · Índice: programação com guia pontilhada e horário como "página". */}
        {schedule.length ? (
          <Page id="indice" n={next()} head="Programação">
            <Reveal className={styles.column} y={12} duration={0.9}>
              <h2 className={styles.title}>{wedding.detailsTitle}</h2>
              {wedding.detailsSubtitle ? <p className={styles.body}>{wedding.detailsSubtitle}</p> : null}
            </Reveal>
            <Reveal as="ol" className={styles.index} y={12} duration={0.9} delay={0.08}>
              {schedule.map((item) => (
                <li key={item.id} className={styles.indexItem}>
                  <span className={styles.indexLine}>
                    <span className={styles.indexTitle}>{item.title}</span>
                    <span className={styles.leader} aria-hidden />
                    <span className={styles.indexTime}>{item.time}</span>
                  </span>
                  {item.note ? <span className={styles.indexNote}>{item.note}</span> : null}
                </li>
              ))}
            </Reveal>
          </Page>
        ) : null}

        {/* 7 · Local: mapa em moldura fina, endereço como nota de rodapé. */}
        {location ? (
          <Page id="local" n={next()} head="Local">
            <Reveal className={styles.column} y={12} duration={0.9}>
              <h2 className={styles.title}>
                {location.venue || location.city}
                {location.address ? (
                  <sup className={styles.ref} aria-hidden>
                    *
                  </sup>
                ) : null}
              </h2>
              {location.venue && location.city ? <p className={styles.placeCity}>{location.city}</p> : null}
              {location.note ? <p className={styles.body}>{location.note}</p> : null}
            </Reveal>
            <Reveal as="figure" className={styles.mapFig} y={12} duration={0.9} delay={0.08}>
              <span className={styles.mapFrame}>
                <iframe
                  className={styles.map}
                  src={mapEmbedUrl(location)}
                  title={`Mapa: ${location.venue || location.city}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </span>
              <figcaption className={styles.mapCap}>
                <span>Fig. — como chegar</span>
                <a className={styles.link} href={mapLink(location)} target="_blank" rel="noreferrer">
                  Abrir no Google Maps
                </a>
              </figcaption>
            </Reveal>
            {location.address ? (
              <p className={styles.footnote}>
                <span className={styles.footnoteMark} aria-hidden>
                  *
                </span>
                {location.address}
              </p>
            ) : null}
          </Page>
        ) : null}

        {/* 8 · Notas: cartões de informação numerados. */}
        {cards.length ? (
          <Page n={next()} head="Notas" ariaLabel="Informações">
            <div className={styles.notes}>
              {cards.map((card, i) => (
                <Reveal as="article" key={card.id} className={styles.note} y={12} duration={0.9} delay={i * 0.05}>
                  <p className={styles.noteMark} aria-hidden>
                    {"*".repeat((i % 3) + 1)}
                  </p>
                  <h3 className={styles.noteTitle}>{card.title}</h3>
                  {card.subtitle ? <p className={styles.noteSub}>{card.subtitle}</p> : null}
                  {card.body ? <p className={styles.noteBody}>{card.body}</p> : null}
                </Reveal>
              ))}
            </div>
          </Page>
        ) : null}

        {/* 9 · Presentes. */}
        {hasGifts ? (
          <Page id="presentes" n={next()} head="Presentes">
            <Reveal className={styles.column} y={12} duration={0.9}>
              <h2 className={styles.title}>Lista de presentes</h2>
              <p className={styles.body}>Cada presente é um Pix direto para o casal, sem intermediários.</p>
            </Reveal>
            <div className={styles.gifts}>
              <GiftRegistry wedding={wedding} variant="inherit" />
            </div>
          </Page>
        ) : null}

        {/* 10 · Caderno de fotos. */}
        {gallery.length ? <Gallery images={gallery} n={next()} /> : null}

        {/* 11 · Confirmação e recados. */}
        <div className={styles.forms}>
          <GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />
        </div>

        {/* 12 · Última página. */}
        <Page n={next()} className={styles.closing} ariaLabel="Encerramento">
          <Reveal className={styles.closingInner} y={12} duration={0.9}>
            {wedding.footerImage ? (
              <span className={styles.closingPhoto}>
                <Image src={wedding.footerImage} alt="" width={420} height={560} loading="lazy" sizes="(min-width: 900px) 10rem, 32vw" className={styles.closingImg} />
              </span>
            ) : null}
            <p className={styles.closingText}>{wedding.finalText}</p>
            <p className={styles.fim}>Fim</p>
          </Reveal>
        </Page>

        {/* Colofão. */}
        <footer className={styles.colofao}>
          <p className={styles.colofaoMono}>{wedding.monogram}</p>
          <p className={styles.colofaoNames}>{wedding.coupleNames}</p>
          {wedding.footerText ? <p className={styles.colofaoText}>{wedding.footerText}</p> : null}
          <p className={styles.colofaoMeta}>
            {[wedding.weddingDateLabel, location?.city].filter(Boolean).map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </p>
          <p className={styles.colofaoCredit}>Composto em Literata e Inter · Feito com Noivar</p>
        </footer>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ nav */

function Nav({ wedding }: Props) {
  const [open, toggle, close] = useMenu();
  return (
    <header className={styles.nav}>
      <div className={styles.navInner}>
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

/* ------------------------------------------------------------ countdown */

function Countdown({ wedding, n }: Props & { n: number }) {
  const c = useCountdown(wedding.weddingDate);
  const valid = Number.isFinite(new Date(wedding.weddingDate).getTime());
  const days = c.days;
  const line = !valid
    ? "A data vem em breve."
    : c.isPast
      ? "É hoje."
      : !c.ready
        ? "Faltam alguns dias."
        : days === 0
          ? "É amanhã."
          : days === 1
            ? "Falta um dia."
            : `Faltam ${spell(days)} dias.`;

  return (
    <Page n={n} head="Contagem" className={styles.count} ariaLabel="Contagem regressiva">
      <Reveal className={styles.countGrid} y={12} duration={0.9}>
        <p className={styles.countLine}>{line}</p>
        {valid && !c.isPast ? (
          <p className={styles.countSmall}>
            <span>
              <b>{c.ready ? pad(c.hours) : "00"}</b> horas
            </span>
            <span>
              <b>{c.ready ? pad(c.minutes) : "00"}</b> minutos
            </span>
            <span>
              <b>{c.ready ? pad(c.seconds) : "00"}</b> segundos
            </span>
          </p>
        ) : null}
        {wedding.weddingDateLabel ? (
          <p className={styles.countDate}>
            {wedding.weddingDateLabel}
            {wedding.weddingTime ? ` · ${wedding.weddingTime}` : ""}
          </p>
        ) : null}
      </Reveal>
    </Page>
  );
}

/* -------------------------------------------------------------- gallery */

function Gallery({ images, n }: { images: WeddingSite["gallery"]; n: number }) {
  const lb = useLightbox();
  return (
    <Page id="galeria" n={n} head="Caderno de fotos">
      <div className={styles.album}>
        {images.map((img, i) => (
          <Reveal as="figure" key={img.id} className={styles.albumFig} y={12} duration={0.9} delay={(i % 2) * 0.06}>
            <button type="button" className={styles.albumBtn} onClick={() => lb.open(i)} aria-label={`Abrir foto: ${img.alt}`}>
              <Image src={img.src} alt={img.alt} width={800} height={1000} loading="lazy" sizes="(min-width: 900px) 30rem, 46vw" className={styles.albumImg} />
            </button>
            <figcaption className={styles.albumCap}>
              <span className={styles.albumNum}>{pad(i + 1)}</span>
              {img.caption || img.alt}
            </figcaption>
          </Reveal>
        ))}
      </div>
      <Lightbox
        images={images}
        active={lb.active}
        onClose={lb.close}
        classNames={{
          dialog: styles.lightbox,
          close: styles.lightboxClose,
          figure: styles.lightboxFig,
          img: styles.lightboxImg,
          caption: styles.lightboxCaption,
          nav: styles.lightboxNav
        }}
      />
    </Page>
  );
}
