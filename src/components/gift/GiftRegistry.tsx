"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import type { WeddingGift, WeddingSite } from "@/types/wedding";
import type { PixChargeResponse } from "@/types/pix";
import { formatBRL, parseGiftPrice } from "@/lib/gift-price";
import { computeCardCharge, validateCardAmount } from "@/lib/card-pricing";
import { isDemoWedding } from "@/lib/demo-id";
import { GIFT_ASPECT_BY_TEMPLATE, giftImageStyle, normalizeGiftImage } from "@/lib/gift-image";
import { useCardGiftConfig } from "./CardGiftContext";
import styles from "./gift-registry.module.css";

export type GiftVariant = "classico" | "civil" | "jardim" | "editorial" | "romantic-garden" | "praia" | "cinema";

/**
 * Per-template skin. Shared layout + Pix logic; each template provides its own
 * palette / radius / image grade through these CSS variables, so the registry
 * keeps each identity instead of looking generic.
 *
 * Contrato com o root do modelo (.template), lido também pelo GuestForms:
 * - --font-serif / --font-sans: remapear p/ as fontes do modelo (padrão: Instrument
 *   Serif/Sans do app). Títulos usam a serif em peso 400; UI usa a sans em 500–600.
 * - --widget-btn-radius, --widget-card-radius, --widget-btn-case, --widget-btn-tracking:
 *   opcionais, vencem a skin (padrão: o que a skin abaixo define).
 */
const SKINS: Record<GiftVariant, CSSProperties> = {
  classico: {
    "--g-card": "#fffaf1",
    "--g-dialog-bg": "#fffaf1",
    "--g-border": "rgba(160, 86, 57, 0.2)",
    "--g-ink": "#33231b",
    "--g-muted": "#6f5d54",
    "--g-accent": "#8f4a30",
    "--g-on-accent": "#f7efe6",
    "--g-price": "#8f4a30",
    "--g-radius": "18px",
    "--g-img-radius": "12px",
    "--g-aspect": GIFT_ASPECT_BY_TEMPLATE["classico-romantico"],
    "--g-img-filter": "saturate(0.98) contrast(1.02)",
    "--g-scrim": "rgba(46, 28, 20, 0.5)",
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
    "--g-aspect": GIFT_ASPECT_BY_TEMPLATE["civil-minimalista"],
    // Fundo da "Foto inteira": claro, derivado da tinta marfim (o cartão aqui é translúcido no preto).
    "--g-backdrop": "color-mix(in srgb, var(--g-ink) 20%, #fff)",
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
    "--g-aspect": GIFT_ASPECT_BY_TEMPLATE["garden-classico"],
    "--g-img-filter": "sepia(0.18) saturate(0.82) contrast(0.96)",
    "--g-scrim": "rgba(45, 43, 37, 0.6)",
    "--g-error": "#8d3d33",
    "--g-btn-case": "uppercase",
    "--g-btn-tracking": "0.14em"
  } as CSSProperties,
  editorial: {
    "--g-card": "#f6f4ef",
    "--g-dialog-bg": "#f6f4ef",
    "--g-border": "rgba(22, 21, 26, 0.14)",
    "--g-ink": "#16151a",
    "--g-muted": "#585249",
    "--g-accent": "#16151a",
    "--g-on-accent": "#f6f4ef",
    "--g-price": "#16151a",
    "--g-radius": "2px",
    "--g-img-radius": "0px",
    "--g-aspect": GIFT_ASPECT_BY_TEMPLATE["editorial-luxury"],
    "--g-img-filter": "grayscale(1) contrast(1.04)",
    "--g-scrim": "rgba(16, 15, 18, 0.6)",
    "--g-error": "#9a3b30",
    "--g-btn-radius": "0px",
    "--g-btn-case": "uppercase",
    "--g-btn-tracking": "0.16em"
  } as CSSProperties,
  "romantic-garden": {
    "--g-card": "#fbf6ec",
    "--g-dialog-bg": "#f7f1e6",
    "--g-border": "rgba(58, 74, 46, 0.18)",
    "--g-ink": "#2a2e22",
    "--g-muted": "#555a47",
    "--g-accent": "#3e5230",
    "--g-on-accent": "#f6f1e4",
    "--g-price": "#3e5230",
    "--g-radius": "18px",
    "--g-img-radius": "999px 999px 16px 16px",
    "--g-aspect": GIFT_ASPECT_BY_TEMPLATE["jardim-romantico"],
    "--g-img-filter": "saturate(1.03) contrast(1)",
    "--g-scrim": "rgba(42, 46, 34, 0.55)",
    "--g-error": "#8d3d33",
    "--g-btn-case": "uppercase",
    "--g-btn-tracking": "0.14em"
  } as CSSProperties,
  praia: {
    "--g-card": "#fbf8f2",
    "--g-dialog-bg": "#fbf8f2",
    "--g-border": "rgba(22, 36, 42, 0.16)",
    "--g-ink": "#16242a",
    "--g-muted": "#445157",
    "--g-accent": "#1c3a47",
    "--g-on-accent": "#f4ede0",
    "--g-price": "#2e5a6b",
    "--g-radius": "18px",
    "--g-img-radius": "14px",
    "--g-aspect": GIFT_ASPECT_BY_TEMPLATE["pe-na-areia"],
    "--g-img-filter": "saturate(1.06) contrast(1.02) brightness(1.02)",
    "--g-scrim": "rgba(20, 42, 52, 0.5)",
    "--g-error": "#b0492f"
  } as CSSProperties,
  // Cinema Noir — warm espresso surfaces, champagne accents, ivory ink on dark.
  cinema: {
    "--g-card": "#1c150e",
    "--g-dialog-bg": "#17120d",
    "--g-border": "rgba(201, 168, 106, 0.24)",
    "--g-ink": "#f4ece0",
    "--g-muted": "#b7a892",
    "--g-accent": "#c9a86a",
    "--g-on-accent": "#14100b",
    "--g-price": "#ddc389",
    "--g-radius": "6px",
    "--g-img-radius": "2px",
    "--g-aspect": GIFT_ASPECT_BY_TEMPLATE["cinema-noir"],
    "--g-backdrop": "color-mix(in srgb, var(--g-ink) 20%, #fff)",
    "--g-img-filter": "saturate(0.9) contrast(1.05) brightness(0.88)",
    "--g-scrim": "rgba(8, 6, 4, 0.72)",
    "--g-error": "#e6a99f",
    "--g-btn-case": "uppercase",
    "--g-btn-tracking": "0.1em"
  } as CSSProperties
};

/** Gifts shown before the in-place "Ver todos" expansion. */
const VISIBLE_GIFTS = 6;

type ReturnNotice = { tone: "ok" | "warn"; text: string };

/** Avisos da volta do checkout do cartão (?presente=... no back_url do Mercado Pago). */
const RETURN_NOTICES: Record<string, ReturnNotice | undefined> = {
  aprovado: { tone: "ok", text: "Presente confirmado. Obrigado por celebrar com o casal." },
  pendente: {
    tone: "warn",
    text: "Pagamento em análise pelo Mercado Pago. Assim que for aprovado, ele aparece para o casal."
  },
  recusado: { tone: "warn", text: "O pagamento não foi concluído. Você pode tentar de novo quando quiser." }
};

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
  const [notice, setNotice] = useState<ReturnNotice | null>(null);

  // Volta do checkout do cartão: mostra o aviso, limpa a query e traz a seção para a
  // tela. O estado do presente vem SEMPRE do webhook, nunca da query string.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const found = RETURN_NOTICES[params.get("presente") ?? ""];
    if (!found) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setNotice(found);
    /* eslint-enable react-hooks/set-state-in-effect */
    params.delete("presente");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rootRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, []);

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
      {notice ? (
        <p role="status" className={notice.tone === "ok" ? styles.notice : `${styles.notice} ${styles.noticeWarn}`}>
          {notice.text}
        </p>
      ) : null}
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
              <div className={styles.media} data-fit={gift.image ? normalizeGiftImage(gift).imageFit : undefined}>
                {gift.image ? (
                  <Image
                    src={gift.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 380px, 50vw"
                    loading="lazy"
                    style={giftImageStyle(gift)}
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
        <GiftPaymentDialog wedding={wedding} gift={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

type GiftPaymentDialogProps = {
  wedding: WeddingSite;
  gift: WeddingGift;
  onClose: () => void;
};

function GiftPaymentDialog({ wedding, gift, onClose }: GiftPaymentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // null quando o casal não conectou o Mercado Pago (e nas prévias /modelo e do editor).
  const card = useCardGiftConfig();
  const pixEnabled = Boolean(wedding.pixKey);
  const parsed = parseGiftPrice(gift.price);
  const [method, setMethod] = useState<"pix" | "card">(pixEnabled || !card ? "pix" : "card");
  const [amount, setAmount] = useState<number>(parsed.isFree ? 150 : parsed.amount);
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");
  const [charge, setCharge] = useState<PixChargeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  // Demo (/modelo/...): nunca chama a API nem gera Pix pagável — só explica o que aparece aqui.
  const demo = isDemoWedding(wedding.id);
  const [demoPix, setDemoPix] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  async function generate() {
    if (demo) {
      setDemoPix(true);
      return;
    }
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

  // Cria a preferência na conta do casal e manda o convidado para o Checkout Pro.
  async function payWithCard() {
    if (demo) {
      setDemoPix(true);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/gifts/card/checkout", {
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
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Não foi possível abrir o pagamento no cartão agora.");
        setLoading(false);
        return;
      }
      // Sai da página: o loading fica ligado de propósito até a navegação.
      window.location.assign(data.url);
    } catch {
      setError("Não foi possível abrir o pagamento no cartão agora.");
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

  const cardCharge = card && Number.isFinite(amount) ? computeCardCharge(amount, card.feePayer, card.feeRate) : null;
  const cardError = method === "card" ? validateCardAmount(amount) : null;

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-label={`Presentear: ${gift.title}`} onClose={onClose}>
      <div className={styles.dialogPanel}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <p className={styles.eyebrow}>Presente em dinheiro</p>
        <h3 className={styles.dialogTitle}>{gift.title}</h3>
        <p className={styles.badge}>
          {method === "pix"
            ? "0% de taxa · 100% para o casal"
            : card && card.feePayer === "guest"
              ? `Até ${card.maxInstallments}x no cartão · 100% para o casal`
              : `Até ${card?.maxInstallments ?? 12}x no cartão`}
        </p>

        {!charge && card && pixEnabled ? (
          <fieldset className={styles.method}>
            <legend className={styles.methodLegend}>Como você quer presentear</legend>
            <label className={styles.methodOption}>
              <input
                type="radio"
                name="gift-method"
                value="pix"
                checked={method === "pix"}
                onChange={() => {
                  setMethod("pix");
                  setError("");
                }}
              />
              <span>Pix</span>
            </label>
            <label className={styles.methodOption}>
              <input
                type="radio"
                name="gift-method"
                value="card"
                checked={method === "card"}
                onChange={() => {
                  setMethod("card");
                  setError("");
                }}
              />
              <span>Cartão</span>
            </label>
          </fieldset>
        ) : null}

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
            {method === "card" && cardCharge && !cardError ? (
              <dl className={styles.breakdown}>
                {cardCharge.feeAmount > 0 ? (
                  <>
                    <div>
                      <dt>Presente</dt>
                      <dd>{formatBRL(cardCharge.giftAmount)}</dd>
                    </div>
                    <div>
                      <dt>Taxa do cartão</dt>
                      <dd>{formatBRL(cardCharge.feeAmount)}</dd>
                    </div>
                  </>
                ) : null}
                <div className={styles.breakdownTotal}>
                  <dt>Total no cartão</dt>
                  <dd>{formatBRL(cardCharge.chargeAmount)}</dd>
                </div>
              </dl>
            ) : null}
            {error || cardError ? (
              <p role="alert" className={styles.error}>
                {error || cardError}
              </p>
            ) : null}
            {method === "card" && card ? (
              <>
                <button
                  type="button"
                  className={styles.generate}
                  onClick={payWithCard}
                  disabled={loading || Boolean(cardError)}
                >
                  {loading ? "Abrindo pagamento…" : "Pagar com cartão"}
                </button>
                <p className={styles.note}>
                  O pagamento é feito no Mercado Pago, em até {card.maxInstallments}x — as parcelas podem ter juros
                  cobrados por ele. O valor do presente cai direto na conta do casal.
                  {card.testMode ? " Conta em modo de teste: nenhuma cobrança real." : ""}
                </p>
              </>
            ) : (
              <button
                type="button"
                className={styles.generate}
                onClick={generate}
                disabled={loading || !Number.isFinite(amount) || amount < 1}
              >
                {loading ? "Gerando Pix…" : "Gerar Pix"}
              </button>
            )}
            {demoPix ? (
              <p role="status" className={`${styles.notice} ${styles.demoPix}`}>
                Na demonstração o Pix não é gerado. No site de vocês, aqui aparece o QR Code com a chave Pix de vocês.
              </p>
            ) : null}
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
