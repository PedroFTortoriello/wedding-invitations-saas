"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import type { WeddingGift, WeddingSite } from "@/types/wedding";
import type { PixChargeResponse } from "@/types/pix";
import { formatBRL, parseGiftPrice } from "@/lib/gift-price";
import styles from "./gift-registry.module.css";

export type GiftVariant = "classico" | "civil" | "jardim";

/**
 * Per-template skin. Shared layout + Pix logic; each template provides its own
 * palette / radius / image grade through these CSS variables, so the registry
 * keeps each identity instead of looking generic.
 */
const SKINS: Record<GiftVariant, CSSProperties> = {
  classico: {
    "--g-card": "#fffaf1",
    "--g-dialog-bg": "#fffaf1",
    "--g-border": "rgba(91, 104, 66, 0.2)",
    "--g-ink": "#23301a",
    "--g-muted": "#4a4f40",
    "--g-accent": "#2c3a24",
    "--g-on-accent": "#f3efe4",
    "--g-price": "#23301a",
    "--g-radius": "18px",
    "--g-img-radius": "12px",
    "--g-aspect": "4 / 3",
    "--g-img-filter": "saturate(0.96) contrast(1.02)",
    "--g-scrim": "rgba(28, 32, 20, 0.5)",
    "--g-error": "#8d3d33"
  } as CSSProperties,
  civil: {
    "--g-card": "rgba(238, 237, 231, 0.06)",
    "--g-dialog-bg": "#101010",
    "--g-border": "rgba(238, 237, 231, 0.2)",
    "--g-ink": "#eeede7",
    "--g-muted": "rgba(238, 237, 231, 0.82)",
    "--g-accent": "#eeede7",
    "--g-on-accent": "#020202",
    "--g-price": "#eeede7",
    "--g-radius": "2px",
    "--g-img-radius": "0px",
    "--g-aspect": "1.2 / 1",
    "--g-img-filter": "grayscale(1) contrast(1.04)",
    "--g-scrim": "rgba(2, 2, 2, 0.72)",
    "--g-error": "#f3a99f"
  } as CSSProperties,
  jardim: {
    "--g-card": "#faf1e1",
    "--g-dialog-bg": "#f7f2e8",
    "--g-border": "rgba(45, 43, 37, 0.18)",
    "--g-ink": "#2d2b25",
    "--g-muted": "#514c3f",
    "--g-accent": "#304254",
    "--g-on-accent": "#faf1e1",
    "--g-price": "#304254",
    "--g-radius": "16px",
    "--g-img-radius": "999px 999px 12px 12px",
    "--g-aspect": "0.82 / 1",
    "--g-img-filter": "sepia(0.18) saturate(0.82) contrast(0.96)",
    "--g-scrim": "rgba(45, 43, 37, 0.6)",
    "--g-error": "#8d3d33"
  } as CSSProperties
};

/** Gifts shown before the in-place "Ver todos" expansion. */
const VISIBLE_GIFTS = 6;

type GiftRegistryProps = {
  wedding: WeddingSite;
  variant: GiftVariant;
  /** Section anchor scrolled back into view when collapsing. */
  sectionId?: string;
};

export function GiftRegistry({ wedding, variant, sectionId = "presentes" }: GiftRegistryProps) {
  const gifts = wedding.gifts.filter((gift) => gift.active);
  const [selected, setSelected] = useState<WeddingGift | null>(null);
  const [expanded, setExpanded] = useState(false);
  const gridId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const hasMore = gifts.length > VISIBLE_GIFTS;
  const visible = expanded || !hasMore ? gifts : gifts.slice(0, VISIBLE_GIFTS);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (!next) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const target = document.getElementById(sectionId) ?? rootRef.current;
      target?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }

  return (
    <div className={styles.root} style={SKINS[variant]} ref={rootRef}>
      <ul className={styles.grid} id={gridId}>
        {visible.map((gift, index) => {
          const price = parseGiftPrice(gift.price);
          const isExtra = index >= VISIBLE_GIFTS;
          return (
            <li
              key={gift.id}
              className={isExtra ? `${styles.card} ${styles.cardEnter}` : styles.card}
              data-reveal={isExtra ? undefined : ""}
              style={
                isExtra
                  ? { animationDelay: `${(index - VISIBLE_GIFTS) * 50}ms` }
                  : { transitionDelay: `${index * 70}ms` }
              }
            >
              <div className={styles.media}>
                {gift.image ? (
                  <Image
                    src={gift.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    loading="lazy"
                    className={styles.image}
                  />
                ) : (
                  <span className={styles.placeholder} aria-hidden>
                    {wedding.monogram}
                  </span>
                )}
              </div>
              <div className={styles.body}>
                <h3 className={styles.name}>{gift.title}</h3>
                <p className={styles.desc}>{gift.description}</p>
                <div className={styles.foot}>
                  <span className={styles.price}>{price.label}</span>
                  <button type="button" className={styles.cta} onClick={() => setSelected(gift)}>
                    Presentear
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {hasMore ? (
        <div className={styles.toggleRow}>
          <button
            type="button"
            className={styles.toggle}
            onClick={toggle}
            aria-expanded={expanded}
            aria-controls={gridId}
          >
            {expanded ? "Ver menos" : `Ver todos os ${gifts.length} presentes`}
          </button>
        </div>
      ) : null}

      {selected ? (
        <GiftPixDialog wedding={wedding} gift={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

type GiftPixDialogProps = {
  wedding: WeddingSite;
  gift: WeddingGift;
  onClose: () => void;
};

function GiftPixDialog({ wedding, gift, onClose }: GiftPixDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const parsed = parseGiftPrice(gift.price);
  const [amount, setAmount] = useState<number>(parsed.isFree ? 150 : parsed.amount);
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");
  const [charge, setCharge] = useState<PixChargeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  async function generate() {
    setError("");
    setCopied(false);
    setLoading(true);
    try {
      const response = await fetch("/api/pix/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingSiteId: wedding.id,
          guestName: guestName.trim() || "Convidado",
          amount,
          message: message.trim() || undefined,
          giftId: gift.id
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setCharge(null);
        setError(data.error ?? "Não foi possível gerar o Pix agora.");
        return;
      }
      setCharge(data as PixChargeResponse);
    } catch {
      setError("Não foi possível gerar o Pix agora.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!charge) return;
    try {
      await navigator.clipboard.writeText(charge.payload);
      setCopied(true);
    } catch {
      setError("Não foi possível copiar. Selecione o código manualmente.");
    }
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-label={`Presentear: ${gift.title}`} onClose={onClose}>
      <div className={styles.dialogPanel}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <p className={styles.eyebrow}>Presente em dinheiro</p>
        <h3 className={styles.dialogTitle}>{gift.title}</h3>
        <p className={styles.badge}>0% de taxa · 100% para o casal</p>

        {!charge ? (
          <div className={styles.form}>
            <label className={styles.field}>
              <span>Valor</span>
              <div className={styles.amountRow}>
                <span className={styles.currency}>R$</span>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                />
              </div>
            </label>
            <label className={styles.field}>
              <span>Seu nome (opcional)</span>
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Quem está presenteando"
              />
            </label>
            <label className={styles.field}>
              <span>Mensagem (opcional)</span>
              <textarea
                rows={2}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Um recado carinhoso para o casal"
              />
            </label>
            {error ? <p className={styles.error}>{error}</p> : null}
            <button
              type="button"
              className={styles.generate}
              onClick={generate}
              disabled={loading || !Number.isFinite(amount) || amount < 1}
            >
              {loading ? "Gerando Pix…" : "Gerar Pix"}
            </button>
          </div>
        ) : (
          <div className={styles.result}>
            <div className={styles.qr} dangerouslySetInnerHTML={{ __html: charge.qrCodeSvg }} />
            <p className={styles.amountPaid}>
              {formatBRL(charge.grossAmount)} · para {wedding.pixHolderName || wedding.coupleNames}
            </p>
            <label className={styles.codeLabel}>
              <span>Pix copia-e-cola</span>
              <textarea
                readOnly
                className={styles.code}
                value={charge.payload}
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
            <button type="button" className={styles.copy} onClick={copyCode}>
              {copied ? "Código copiado!" : "Copiar código"}
            </button>
            {error ? <p className={styles.error}>{error}</p> : null}
            <p className={styles.note}>
              Abra o app do seu banco, escolha Pix Copia-e-Cola e cole o código — o valor vai 100% para o casal,
              sem intermediação.
            </p>
          </div>
        )}
      </div>
    </dialog>
  );
}
