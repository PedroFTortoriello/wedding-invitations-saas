"use client";

import { useMemo, useState } from "react";
import type { GiftExtractionResponse } from "@/types/gift-extraction";

type ExtractedGift = {
  title: string;
  price: string | null;
  image: string;
  link: string;
  source: string;
  description?: string | null;
};

function toGift(response: GiftExtractionResponse): ExtractedGift {
  return {
    title: response.title,
    price: response.price,
    image: response.image ?? "/assets/images/details-registry.jpg",
    link: response.url,
    source: response.source,
    description: response.description
  };
}

function normalizeProductUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

const copy = {
  eyebrow: "Lista de presentes",
  title: "Adicionar por link",
  description:
    "Cole o link de um produto para buscar nome, valor e imagem diretamente na loja. Se a loja bloquear rob\u00f4s, voc\u00ea ainda pode ajustar os campos manualmente.",
  emptyUrl: "Cole o link de um produto para iniciar a extra\u00e7\u00e3o.",
  invalidUrl: "Esse link n\u00e3o parece v\u00e1lido. Verifique o endere\u00e7o e tente novamente.",
  extractError: "N\u00e3o foi poss\u00edvel extrair os dados do produto.",
  placeholder: "amazon.com.br/produto/jogo-de-jantar ou https://loja.com/produto",
  extracting: "Extraindo...",
  extractButton: "Extrair dados reais",
  invalidHint: "O link ainda est\u00e1 incompleto ou inv\u00e1lido.",
  preview: "Pr\u00e9via do presente",
  extracted: "Dados extra\u00eddos",
  name: "Nome",
  displayedValue: "Valor exibido",
  image: "Imagem",
  source: "Fonte:"
} as const;

export function GiftLinkImporter() {
  const [link, setLink] = useState("");
  const [gift, setGift] = useState<ExtractedGift | null>(null);
  const [error, setError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const normalizedLink = useMemo(() => normalizeProductUrl(link), [link]);
  const hasLink = normalizedLink.length > 0;

  const isValidUrl = useMemo(() => {
    try {
      return Boolean(new URL(normalizedLink));
    } catch {
      return false;
    }
  }, [normalizedLink]);

  async function extractGift() {
    if (!hasLink) {
      setError(copy.emptyUrl);
      return;
    }

    if (!isValidUrl) {
      setError(copy.invalidUrl);
      return;
    }

    setError("");
    setIsExtracting(true);

    try {
      const response = await fetch("/api/gifts/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: normalizedLink })
      });
      const payload = (await response.json()) as GiftExtractionResponse | { error?: string };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : copy.extractError);
      }

      setGift(toGift(payload as GiftExtractionResponse));
      setLink(normalizedLink);
    } catch (caughtError) {
      setGift(null);
      setError(caughtError instanceof Error ? caughtError.message : copy.extractError);
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <section className="card p-6">
      <p className="t-eyebrow text-ink-soft">{copy.eyebrow}</p>
      <h2 className="mt-3 t-h1">{copy.title}</h2>
      <p className="mt-3 text-sm leading-6 text-ink-soft">{copy.description}</p>

      <form
        className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          void extractGift();
        }}
      >
        <input
          className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4 text-sm text-ink outline-none focus:border-[#5b6842]/45"
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder={copy.placeholder}
        />

        <button
          className="btn btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={!hasLink || isExtracting}
        >
          {isExtracting ? copy.extracting : copy.extractButton}
        </button>
      </form>

      {hasLink && !isValidUrl ? (
        <p className="mt-3 text-sm font-bold text-[#8b2f2f]">{copy.invalidHint}</p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-2xl border border-[#8b2f2f]/15 bg-[#fff4f1] px-4 py-3 text-sm font-bold text-[#8b2f2f]">
          {error}
        </p>
      ) : null}

      {gift ? (
        <article className="mt-5 grid gap-4 rounded-[1.2rem] border border-[#5b6842]/12 bg-white p-4 md:grid-cols-[8rem_1fr]">
          <img src={gift.image} alt="" className="aspect-square w-full rounded-2xl object-cover" />
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className="t-eyebrow text-ink-soft">{copy.preview}</p>
              <span className="rounded-full bg-[#5b6842]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-forest">
                {copy.extracted}
              </span>
            </div>
            <label className="grid gap-1 t-eyebrow text-ink-soft">
              {copy.name}
              <input
                className="min-h-11 rounded-2xl border border-[#5b6842]/14 bg-[#fffaf1] px-3 text-base font-bold normal-case tracking-normal text-ink"
                value={gift.title}
                onChange={(event) => setGift({ ...gift, title: event.target.value })}
              />
            </label>
            <label className="grid gap-1 t-eyebrow text-ink-soft">
              {copy.displayedValue}
              <input
                className="min-h-11 rounded-2xl border border-[#5b6842]/14 bg-[#fffaf1] px-3 text-base font-bold normal-case tracking-normal text-forest"
                value={gift.price ?? ""}
                onChange={(event) => setGift({ ...gift, price: event.target.value })}
                placeholder="Ex.: R$ 299,90"
              />
            </label>
            <label className="grid gap-1 t-eyebrow text-ink-soft">
              {copy.image}
              <input
                className="min-h-11 rounded-2xl border border-[#5b6842]/14 bg-[#fffaf1] px-3 text-sm normal-case tracking-normal text-ink"
                value={gift.image}
                onChange={(event) => setGift({ ...gift, image: event.target.value })}
              />
            </label>
            {gift.description ? <p className="text-sm leading-6 text-ink-soft">{gift.description}</p> : null}
            <p className="t-eyebrow text-ink-soft">
              {copy.source} {gift.source}
            </p>
            <a className="block break-all text-sm text-ink-soft underline" href={gift.link} target="_blank" rel="noreferrer">
              {gift.link}
            </a>
          </div>
        </article>
      ) : null}
    </section>
  );
}
