"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WeddingSite } from "@/types/wedding";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import styles from "./olive-burgundy.module.css";

export type OliveBurgundyContent = {
  /** Foto do envelope fechado (cena 1) exportada do Canva */
  coverImage: string;
  /** Foto do envelope aberto + cartão + flores (save the date) exportada do Canva */
  cardImage: string;
  /** Textura de mármore do rodapé exportada do Canva */
  marbleImage: string;

  loveLetterEyebrow: string;
  openLabel: string;
  meetEyebrow: string;
  place: string;
  dateLong: string;
  timeText: string;
  followText: string;
  addressLabel: string;
  closingText: string;
  withLove: string;
  /** Se true, sobrepõe os nomes/“A Love Letter From” na capa (textos do vídeo eram overlays) */
  overlayCoverText: boolean;
};

type OliveBurgundyTemplateProps = {
  wedding: WeddingSite;
  content?: Partial<OliveBurgundyContent>;
};

const MS = { day: 86400000, hour: 3600000, minute: 60000, second: 1000 };

function splitCouple(coupleNames: string) {
  const parts = coupleNames.split(/&|\be\b|\band\b/i).map((p) => p.trim()).filter(Boolean);
  const full = parts.length >= 2 ? [parts[0], parts[1]] : [coupleNames, ""];
  const first = full.map((p) => p.split(/\s+/)[0]).filter(Boolean);
  return { full, first };
}

function useReveal() {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

function useCountdown(target: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  if (now === null || !Number.isFinite(target)) return null;
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / MS.day),
    hours: Math.floor((diff % MS.day) / MS.hour),
    minutes: Math.floor((diff % MS.hour) / MS.minute),
    seconds: Math.floor((diff % MS.minute) / MS.second)
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function OliveBurgundyTemplate({ wedding, content }: OliveBurgundyTemplateProps) {
  const { full, first } = useMemo(() => splitCouple(wedding.coupleNames), [wedding.coupleNames]);

  const dateShort = useMemo(() => {
    const d = new Date(wedding.weddingDate);
    if (Number.isNaN(d.getTime())) return wedding.weddingDateLabel;
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  }, [wedding.weddingDate, wedding.weddingDateLabel]);

  const photo =
    wedding.floatingImages?.[1]?.src ??
    wedding.gallery?.[0]?.src ??
    wedding.heroImage;

  const longDate = useMemo(() => {
    const d = new Date(wedding.weddingDate);
    if (Number.isNaN(d.getTime())) return wedding.weddingDateLabel;
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(d);
  }, [wedding.weddingDate, wedding.weddingDateLabel]);

  const monogram = (wedding.monogram || `${first[0]?.[0] ?? ""}&${first[1]?.[0] ?? ""}`).replace(/\s/g, "");
  const sealMono = `${(first[0]?.[0] ?? "").toUpperCase()} & ${(first[1]?.[0] ?? "").toUpperCase()}`;
  const targetTime = useMemo(() => new Date(wedding.weddingDate).getTime(), [wedding.weddingDate]);
  const countdown = useCountdown(targetTime);

  const c: OliveBurgundyContent = {
    coverImage: content?.coverImage ?? "/assets/olive-burgundy/canva/envelope.png",
    cardImage: content?.cardImage ?? "/assets/olive-burgundy/save-the-date.jpg",
    marbleImage: content?.marbleImage ?? "/assets/olive-burgundy/marble.jpg",
    loveLetterEyebrow: content?.loveLetterEyebrow ?? "A Love Letter From",
    openLabel: content?.openLabel ?? "Open the invitation",
    meetEyebrow: content?.meetEyebrow ?? "Meet us in",
    place: content?.place ?? wedding.locations[0]?.city ?? "Occitanie, France",
    dateLong: content?.dateLong ?? `On ${longDate}`,
    timeText: content?.timeText ?? wedding.weddingTime,
    followText: content?.followText ?? "Formal invitation to follow",
    addressLabel: content?.addressLabel ?? "Kindly share your address here",
    closingText: content?.closingText ?? "We look forward to celebrating together",
    withLove: content?.withLove ?? "With love",
    overlayCoverText: content?.overlayCoverText ?? false
  };

  const stageRef = useRef<HTMLDivElement | null>(null);
  const { ref: ref2, shown: shown2 } = useReveal();
  const { ref: ref3, shown: shown3 } = useReveal();
  const { ref: ref4, shown: shown4 } = useReveal();

  const [coverOk, setCoverOk] = useState(true);
  const [cardOk, setCardOk] = useState(true);
  const [marbleOk, setMarbleOk] = useState(true);

  const scrollToCard = () => {
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className={styles.template}>
      {/* ============ Cena 1 — Envelope fechado ============ */}
      <button
        type="button"
        className={`${styles.cover} ${coverOk ? "" : styles.coverFallback}`}
        aria-label={`Abrir o convite de ${wedding.coupleNames}`}
        onClick={scrollToCard}
      >
        <div className={styles.coverStage}>
          <img
            className={`${styles.plate} ${styles.coverPlate}`}
            src={c.coverImage}
            alt={`Convite de ${wedding.coupleNames}`}
            onError={() => setCoverOk(false)}
          />

          <span className={styles.seal}>
            <img src="/assets/olive-burgundy/canva/seal.png" alt="" aria-hidden />
            <span className={styles.sealMono}>{sealMono}</span>
          </span>
        </div>

        <div className={styles.coverText}>
          <p className={styles.coverEyebrow}>{c.loveLetterEyebrow}</p>
          <p className={styles.coverNames}>
            {first[0]} &amp; {first[1]}
          </p>
        </div>

        <span className={styles.openText}>{c.openLabel}</span>
        <span className={styles.scrollCue} aria-hidden />
      </button>

      {/* ============ Cena 2 — Save the date ============ */}
      <section className={styles.stage} ref={stageRef} aria-label="Save the Date">
        <div
          ref={ref2 as React.RefObject<HTMLDivElement>}
          className={`${styles.composition} ${styles.reveal} ${shown2 ? styles.revealIn : ""}`}
        >
          {content?.cardImage && cardOk ? (
            <img className={styles.cardImage} src={c.cardImage} alt="Save the Date" onError={() => setCardOk(false)} />
          ) : (
            <article className={styles.card}>
              <span className={styles.cardStripes} aria-hidden />
              <div className={styles.cardGrid}>
                <div className={styles.cardPhoto}>
                  <img src={photo} alt={wedding.coupleNames} onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
                <div className={styles.cardText}>
                  <p className={styles.cardEyebrow}>Save the Date</p>
                  <h1 className={styles.cardNames}>
                    <span className={styles.cardLine}>{full[0]}</span>
                    <span className={styles.cardAmp}>&amp;</span>
                    <span className={styles.cardLine}>{full[1]}</span>
                  </h1>
                </div>
              </div>
              <span className={styles.cardDate}>{dateShort}</span>
            </article>
          )}
        </div>
      </section>

      {/* ============ Cena 3 — Local + contagem regressiva ============ */}
      <section className={styles.invite} aria-label="Detalhes da celebração">
        <div
          ref={ref3 as React.RefObject<HTMLDivElement>}
          className={`${styles.reveal} ${shown3 ? styles.revealIn : ""}`}
        >
          <p className={styles.inviteEyebrow}>{c.meetEyebrow}</p>
          <p className={styles.place}>{c.place}</p>

          <p className={styles.inviteMeta}>
            {c.dateLong}
            <br />
            {c.timeText}
          </p>
          <p className={styles.inviteFollow}>{c.followText}</p>

          <div className={styles.countdown} aria-live="polite">
            {[
              ["Days", countdown?.days],
              ["Hours", countdown?.hours],
              ["Minutes", countdown?.minutes],
              ["Seconds", countdown?.seconds]
            ].map(([label, value], i) => (
              <UnitGroup key={label as string} label={label as string} value={value as number | undefined} sep={i < 3} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ Cena 4 — Rodapé mármore ============ */}
      <GuestForms wedding={wedding} variant="olive" mode="both" sectionId="rsvp" />

      <section className={styles.closing}>
        <p className={styles.closingText}>{c.closingText}</p>
      </section>

      <footer className={`${styles.footer} ${marbleOk ? "" : styles.footerFallback}`}>
        <img
          className={styles.plate}
          src={c.marbleImage}
          alt=""
          aria-hidden
          onError={() => setMarbleOk(false)}
        />
        <div className={styles.footerShade} aria-hidden />
        <div
          ref={ref4 as React.RefObject<HTMLDivElement>}
          className={`${styles.footerInner} ${styles.reveal} ${shown4 ? styles.revealIn : ""}`}
        >
          <p className={styles.footerEyebrow}>{c.withLove}</p>
          <div className={styles.footerSeal} aria-hidden>
            <span className={styles.ring}>
              <span className={styles.footerMono}>{monogram}</span>
            </span>
          </div>
        </div>
        <p className={styles.footerCredit}>{wedding.coupleNames}</p>
      </footer>
    </main>
  );
}

function UnitGroup({ label, value, sep }: { label: string; value: number | undefined; sep: boolean }) {
  return (
    <>
      <div className={styles.countUnit}>
        <span className={styles.countNum}>{value === undefined ? "—" : pad(value)}</span>
        <span className={styles.countLabel}>{label}</span>
      </div>
      {sep ? <span className={styles.countSep}>:</span> : null}
    </>
  );
}
