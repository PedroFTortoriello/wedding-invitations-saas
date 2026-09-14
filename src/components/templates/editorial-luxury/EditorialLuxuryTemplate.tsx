"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent
} from "react";
import Image from "next/image";
import { Bodoni_Moda, Jost } from "next/font/google";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform
} from "framer-motion";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { Reveal, useCountdown, pad } from "@/components/templates/shared/motion";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import { GuestNameField } from "@/components/templates/shared/GuestNameField";
import styles from "./editorial-luxury.module.css";

const display = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--el-display",
  display: "swap"
});

const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--el-sans",
  display: "swap"
});

type Props = { wedding: WeddingSite };

/** Editorial running order — these are a real sequence, so the folio numbers carry meaning. */
const PROGRAM: ReadonlyArray<[string, string, string]> = [
  ["16:30", "Recepção", "Welcome drinks e retratos ao entardecer."],
  ["17:30", "Cerimônia", "O sim, diante de quem importa."],
  ["19:00", "Jantar", "Menu assinado, servido sem pressa."],
  ["21:30", "Festa", "Brinde, música e dança até tarde."]
];

const NAV = [
  ["#convite", "Convite"],
  ["#historia", "História"],
  ["#detalhes", "Detalhes"],
  ["#presentes", "Presentes"],
  ["#galeria", "Galeria"]
] as const;

export function EditorialLuxuryTemplate({ wedding }: Props) {
  const location = wedding.locations[0];
  const gallery = wedding.gallery.length ? wedding.gallery : [];
  const year = wedding.weddingDate ? new Date(wedding.weddingDate).getFullYear() : "";
  const program = wedding.schedule.length
    ? wedding.schedule
    : PROGRAM.map(([time, title, note]) => ({ id: time, time, title, note }));

  return (
    <main className={`${display.variable} ${sans.variable} ${styles.template}`}>
      <EditorialNav wedding={wedding} />
      <Hero wedding={wedding} />

      {/* Convite — opening editorial statement */}
      <section id="convite" className={styles.invite} aria-labelledby="invite-title">
        <div className={styles.wrap}>
          <Reveal className={styles.inviteInner}>
            <p className={styles.eyebrow}>O Convite</p>
            <h2 id="invite-title" className={styles.inviteWords}>
              {wedding.invitationWords.map((word, i) => (
                <span key={`${word}-${i}`} className={styles.inviteWord}>
                  {word}
                </span>
              ))}
            </h2>
            <p className={styles.lead}>{wedding.welcomeText}</p>
          </Reveal>
        </div>
        <span className={styles.ruleGold} aria-hidden />
      </section>

      {/* História — numbered sequence with alternating editorial spreads */}
      <section id="historia" className={styles.story} aria-labelledby="story-title">
        <div className={styles.wrap}>
          <header className={styles.storyHead}>
            <Reveal>
              <p className={styles.eyebrow}>{wedding.storyEyebrow}</p>
              <h2 id="story-title" className={styles.h1}>
                {wedding.storyTitle}
              </h2>
            </Reveal>
          </header>

          <div className={styles.spreads}>
            {wedding.storyMoments.map((moment, i) => {
              const img = gallery[(i + 1) % Math.max(gallery.length, 1)];
              return (
                <article
                  key={moment.id}
                  className={`${styles.spread} ${i % 2 === 1 ? styles.spreadAlt : ""}`}
                >
                  <Reveal className={styles.spreadMedia} y={24}>
                    {img ? (
                      <Image
                        src={img.src}
                        alt={img.alt}
                        width={1100}
                        height={1400}
                        loading="lazy"
                        sizes="(min-width: 900px) 44vw, 100vw"
                        className={styles.spreadImg}
                      />
                    ) : null}
                    <span className={styles.folio} aria-hidden>
                      {moment.number}
                    </span>
                  </Reveal>
                  <Reveal className={styles.spreadBody} delay={0.08}>
                    <p className={styles.kicker}>{moment.title}</p>
                    <h3 className={styles.h2}>
                      {moment.headline.split("\n").map((line, k) => (
                        <span key={k} className={styles.h2Line}>
                          {line}
                        </span>
                      ))}
                    </h3>
                    <p className={styles.body}>{moment.description}</p>
                  </Reveal>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <Countdown wedding={wedding} year={year} />

      {/* Detalhes — program timeline */}
      <section id="detalhes" className={styles.details} aria-labelledby="details-title">
        <div className={styles.wrap}>
          <header className={styles.detailsHead}>
            <Reveal>
              <p className={styles.eyebrow}>O Dia</p>
              <h2 id="details-title" className={styles.h1}>
                {wedding.detailsTitle}
              </h2>
              <p className={styles.lead}>{wedding.detailsSubtitle}</p>
            </Reveal>
          </header>

          <ol className={styles.program}>
            {program.map((item, i) => (
              <Reveal as="li" key={item.id} className={styles.programRow} delay={i * 0.05} y={14}>
                <span className={styles.programTime}>{item.time}</span>
                <span className={styles.programMain}>
                  <span className={styles.programTitle}>{item.title}</span>
                  <span className={styles.programNote}>{item.note}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Local com mapa */}
      {location ? <LocationBlock wedding={wedding} /> : null}

      {/* Presentes */}
      <section id="presentes" className={styles.gifts} aria-labelledby="gifts-title">
        <div className={styles.wrap}>
          <header className={styles.giftsHead}>
            <Reveal>
              <p className={styles.eyebrow}>Lista de Presentes</p>
              <h2 id="gifts-title" className={styles.h1}>
                Um gesto para a vida a dois
              </h2>
              <p className={styles.lead}>
                Cada presente é um Pix direto na chave do casal — 100% para eles, sem
                taxas, sem intermediários.
              </p>
            </Reveal>
          </header>
          <GiftRegistry wedding={wedding} variant="editorial" />
        </div>
      </section>

      {/* RSVP */}
      <RsvpBlock wedding={wedding} />

      {/* Galeria */}
      {gallery.length ? <Gallery wedding={wedding} /> : null}

      {/* Recados */}
      <GuestForms wedding={wedding} variant="editorial" mode="messages" sectionId="recados" />

      <Footer wedding={wedding} />
    </main>
  );
}

/* ------------------------------------------------------------------ Nav */

function EditorialNav({ wedding }: Props) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.nav} ${solid ? styles.navSolid : ""}`}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <a href="#top" className={styles.navMono} aria-label={wedding.coupleNames}>
          {wedding.monogram}
        </a>
        <nav className={styles.navLinks} aria-label="Seções">
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className={styles.navLink}>
              {label}
            </a>
          ))}
        </nav>
        <a href="#rsvp" className={styles.navCta}>
          Confirmar
        </a>
        <button
          type="button"
          className={styles.navToggle}
          aria-expanded={open}
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden>{open ? "Fechar" : "Menu"}</span>
        </button>
      </div>
      {open ? (
        <nav className={styles.navMobile} aria-label="Seções">
          {[...NAV, ["#rsvp", "Confirmar presença"] as const].map(([href, label]) => (
            <a key={href} href={href} className={styles.navMobileLink} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

/* ----------------------------------------------------------------- Hero */

function Hero({ wedding }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const location = wedding.locations[0];

  return (
    <section id="top" ref={ref} className={styles.hero} aria-label={`Casamento de ${wedding.coupleNames}`}>
      <motion.div className={styles.heroMediaWrap} style={reduce ? undefined : { y }}>
        <Image
          src={wedding.heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.heroImg}
        />
        <div className={styles.heroScrim} />
      </motion.div>

      <div className={`${styles.wrap} ${styles.heroContent}`}>
        <motion.p
          className={styles.heroIssue}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          The Wedding Issue
        </motion.p>

        <motion.h1
          className={styles.heroNames}
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          {splitCouple(wedding.coupleNames).map((part, i) => (
            <span key={i} className={styles.heroNameLine}>
              {i === 1 ? <em className={styles.heroAmp}>&</em> : null}
              {part}
            </span>
          ))}
        </motion.h1>

        <motion.div
          className={styles.heroPlate}
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
        >
          <span className={styles.heroPlateItem}>
            <span className={styles.heroPlateK}>Data</span>
            {wedding.weddingDateLabel}
          </span>
          <span className={styles.heroPlateDivider} aria-hidden />
          <span className={styles.heroPlateItem}>
            <span className={styles.heroPlateK}>Local</span>
            {location?.venue ?? location?.city ?? "Em breve"}
          </span>
        </motion.div>
      </div>

      <a href="#convite" className={styles.heroScroll} aria-label="Rolar para o convite">
        <span aria-hidden>Role</span>
        <span className={styles.heroScrollLine} aria-hidden />
      </a>
    </section>
  );
}

/* ------------------------------------------------------------ Countdown */

function Countdown({ wedding, year }: Props & { year: string | number }) {
  const c = useCountdown(wedding.weddingDate);
  const units: Array<[number, string]> = [
    [c.days, "Dias"],
    [c.hours, "Horas"],
    [c.minutes, "Min"],
    [c.seconds, "Seg"]
  ];

  return (
    <section className={styles.count} aria-label="Contagem regressiva">
      <div className={styles.wrap}>
        <Reveal className={styles.countHead}>
          <p className={`${styles.eyebrow} ${styles.eyebrowGold}`}>Contagem regressiva</p>
          <h2 className={styles.countTitle}>
            {c.isPast ? "Hoje é o grande dia" : "Faltam"}
          </h2>
        </Reveal>
        {!c.isPast ? (
          <Reveal className={styles.countGrid} delay={0.08}>
            {units.map(([value, label]) => (
              <div key={label} className={styles.countCell}>
                <span className={styles.countNum} aria-hidden>
                  {c.ready ? pad(value) : "—"}
                </span>
                <span className={styles.countLabel}>{label}</span>
              </div>
            ))}
          </Reveal>
        ) : null}
        <Reveal className={styles.countFoot} delay={0.12}>
          <span className={styles.countDate}>
            {wedding.weddingDateLabel}
            {year ? ` · ${wedding.weddingTime}` : ""}
          </span>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Location */

function LocationBlock({ wedding }: Props) {
  const location = wedding.locations[0];
  const query = encodeURIComponent(
    [location.venue, location.address, location.city].filter(Boolean).join(", ")
  );
  const embed = `https://www.google.com/maps?q=${query}&z=14&output=embed`;

  return (
    <section id="local" className={styles.location} aria-labelledby="location-title">
      <div className={`${styles.wrap} ${styles.locationGrid}`}>
        <Reveal className={styles.locationInfo}>
          <p className={styles.eyebrow}>O Local</p>
          <h2 id="location-title" className={styles.h1}>
            {location.venue}
          </h2>
          <p className={styles.locationCity}>{location.city}</p>
          {location.address ? <p className={styles.body}>{location.address}</p> : null}
          <p className={styles.body}>{location.note}</p>
          <a className={styles.btnGhost} href={location.mapUrl} target="_blank" rel="noreferrer">
            Abrir no Google Maps
          </a>
        </Reveal>
        <Reveal className={styles.locationMap} delay={0.08} y={24}>
          <iframe
            className={styles.mapFrame}
            src={embed}
            title={`Mapa — ${location.venue}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- RSVP */

function RsvpBlock({ wedding }: Props) {
  const { rsvp } = wedding;
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(status: "confirmed" | "declined", form: HTMLFormElement) {
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (!name) {
      setError("Diga o seu nome para confirmarmos.");
      return;
    }

    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: wedding.slug, name, status })
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Não foi possível confirmar agora.");
        setState("idle");
        return;
      }
      setDeclined(status === "declined");
      setState("done");
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setState("idle");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit("confirmed", event.currentTarget);
  }

  if (!rsvp.enabled) return null;

  return (
    <section id="rsvp" className={styles.rsvp} aria-labelledby="rsvp-title">
      <div className={`${styles.wrap} ${styles.rsvpGrid}`}>
        <Reveal className={styles.rsvpIntro}>
          <p className={`${styles.eyebrow} ${styles.eyebrowGold}`}>{rsvp.subtitle}</p>
          <h2 id="rsvp-title" className={styles.rsvpTitle}>
            {rsvp.title}
          </h2>
          <p className={styles.rsvpLead}>
            Sua presença é o presente. Confirme abaixo — guardaremos um lugar à altura.
          </p>
        </Reveal>

        <Reveal className={styles.rsvpCard} delay={0.08} y={24}>
          {state === "done" ? (
            <div className={styles.rsvpDone} role="status">
              <p className={styles.kicker}>{declined ? "Resposta registrada" : "Confirmado"}</p>
              <p className={styles.rsvpDoneText}>
                {declined ? "Sentiremos sua falta — obrigado por avisar." : rsvp.successMessage}
              </p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <label className={styles.field}>
                <span>Nome completo</span>
                <GuestNameField slug={wedding.slug} placeholder="Digite para buscar seu nome" required />
              </label>
              {error ? (
                <p className={styles.formError} role="alert">
                  {error}
                </p>
              ) : null}
              <button className={styles.btnSolid} type="submit" disabled={state === "loading"}>
                {state === "loading" ? "Enviando…" : "Confirmar presença"}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  const form = event.currentTarget.form;
                  if (form) void submit("declined", form);
                }}
                disabled={state === "loading"}
                style={{
                  marginTop: 4,
                  background: "none",
                  border: "none",
                  color: "inherit",
                  opacity: 0.72,
                  fontWeight: 700,
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                  cursor: "pointer"
                }}
              >
                Não poderei ir
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Gallery */

function Gallery({ wedding }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const images = wedding.gallery;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active !== null && !dialog.open) dialog.showModal();
    if (active === null && dialog.open) dialog.close();
  }, [active]);

  const current = active !== null ? images[active] : null;

  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="gallery-title">
      <div className={styles.wrap}>
        <header className={styles.galleryHead}>
          <Reveal>
            <p className={styles.eyebrow}>Galeria</p>
            <h2 id="gallery-title" className={styles.h1}>
              Retratos do casal
            </h2>
          </Reveal>
        </header>
      </div>

      <div className={styles.galleryGrid}>
        {images.map((image, i) => (
          <Reveal key={image.id} className={styles.galleryItem} delay={(i % 4) * 0.05} y={16}>
            <button
              type="button"
              className={styles.galleryBtn}
              onClick={() => setActive(i)}
              aria-label={`Abrir foto: ${image.alt}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={900}
                height={1200}
                loading="lazy"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className={styles.galleryImg}
              />
            </button>
          </Reveal>
        ))}
      </div>

      <dialog ref={dialogRef} className={styles.lightbox} onClose={() => setActive(null)}>
        <button
          type="button"
          className={styles.lightboxClose}
          onClick={() => setActive(null)}
          aria-label="Fechar"
        >
          ×
        </button>
        {current ? (
          <figure className={styles.lightboxFig}>
            <Image
              src={current.src}
              alt={current.alt}
              width={1600}
              height={2000}
              className={styles.lightboxImg}
            />
            {current.caption ? <figcaption>{current.caption}</figcaption> : null}
          </figure>
        ) : null}
      </dialog>
    </section>
  );
}

/* --------------------------------------------------------------- Footer */

function Footer({ wedding }: Props) {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.wrap} ${styles.footerInner}`}>
        <p className={styles.footerMono}>{wedding.monogram}</p>
        <p className={styles.footerNames}>{wedding.coupleNames}</p>
        <p className={styles.footerText}>{wedding.footerText}</p>
        <p className={styles.footerMeta}>
          {wedding.weddingDateLabel}
          {wedding.locations[0]?.city ? ` · ${wedding.locations[0].city}` : ""}
        </p>
        <p className={styles.footerCredit}>Feito com Noivar</p>
      </div>
    </footer>
  );
}

/* --------------------------------------------------------------- utils */

function splitCouple(names: string): [string, string] {
  const parts = names.split(/\s*&\s*| e /i);
  if (parts.length >= 2) {
    return [parts[0].trim(), parts.slice(1).join(" & ").trim()];
  }
  return [names.trim(), ""];
}
