import type { CSSProperties } from "react";
import type { WeddingGift, WeddingSite } from "@/types/wedding";

/**
 * Enquadramento da foto de uma cota de presente — não destrutivo (a imagem original
 * fica intacta no storage; só muda como ela é mostrada no cartão do site).
 *   contain  "Foto inteira" (padrão, inclusive para cotas antigas sem ajuste)
 *   cover    "Preencher o quadro"
 * Foco em % (0–100) e zoom de 1 a 3 (100–300%).
 */
export type GiftImageFit = NonNullable<WeddingGift["imageFit"]>;
export type GiftImageFraming = {
  imageFit: GiftImageFit;
  imageFocus: { x: number; y: number };
  imageZoom: number;
};

export const DEFAULT_GIFT_FRAMING: GiftImageFraming = {
  imageFit: "contain",
  imageFocus: { x: 50, y: 50 },
  imageZoom: 1
};

export const GIFT_ZOOM_MIN = 1;
export const GIFT_ZOOM_MAX = 3;

/**
 * Proporção do quadro da foto no cartão de presente de cada modelo (--g-aspect do
 * GiftRegistry). A prévia do painel usa a mesma, para o casal ver o corte real.
 * olive-burgundy não tem lista de presentes: fica no 4 / 3 neutro.
 */
export const GIFT_ASPECT_BY_TEMPLATE: Record<WeddingSite["templateId"], string> = {
  "classico-romantico": "4 / 3",
  "civil-minimalista": "1.2 / 1",
  "garden-classico": "0.82 / 1",
  "olive-burgundy": "4 / 3",
  "editorial-luxury": "3 / 4",
  "jardim-romantico": "0.85 / 1",
  "pe-na-areia": "4 / 3",
  "cinema-noir": "3 / 4"
};

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const isFocus = (value: unknown): value is { x: number; y: number } =>
  typeof value === "object" && value !== null && finite((value as { x?: unknown }).x) && finite((value as { y?: unknown }).y);

type FramingInput = { imageFit?: unknown; imageFocus?: unknown; imageZoom?: unknown };

/** Enquadramento completo e válido a partir de qualquer entrada (JSON do banco, formulário, cliente). */
export function normalizeGiftImage(gift: FramingInput): GiftImageFraming {
  const focus = isFocus(gift.imageFocus) ? gift.imageFocus : DEFAULT_GIFT_FRAMING.imageFocus;
  return {
    imageFit: gift.imageFit === "cover" ? "cover" : "contain",
    imageFocus: {
      x: Math.round(clamp(focus.x, 0, 100) * 10) / 10,
      y: Math.round(clamp(focus.y, 0, 100) * 10) / 10
    },
    imageZoom: finite(gift.imageZoom) ? Math.round(clamp(gift.imageZoom, GIFT_ZOOM_MIN, GIFT_ZOOM_MAX) * 100) / 100 : 1
  };
}

/** Mantém só os campos de enquadramento válidos (limitados) e descarta os inválidos. */
export function sanitizeGiftFraming(gift: WeddingGift): WeddingGift {
  const { imageFit, imageFocus, imageZoom, ...rest } = gift;
  const framing = normalizeGiftImage(gift);
  return {
    ...rest,
    ...(imageFit === "contain" || imageFit === "cover" ? { imageFit } : {}),
    ...(isFocus(imageFocus) ? { imageFocus: framing.imageFocus } : {}),
    ...(finite(imageZoom) ? { imageZoom: framing.imageZoom } : {})
  };
}

/**
 * Fundo da "Foto inteira": a mesma foto, ampliada e desfocada, atrás da principal. Sem
 * isso, foto horizontal num quadro vertical (Editorial, Cinema Noir…) deixava faixas
 * vazias. Foto de produto em fundo branco continua com fundo branco.
 */
export const GIFT_BACKDROP_STYLE: CSSProperties = {
  objectFit: "cover",
  filter: "blur(16px)",
  // Ampliada o bastante para a borda do desfoque (que fica transparente) sair do quadro.
  transform: "scale(1.4)"
};

/**
 * Estilo do <Image fill> da foto da cota — o MESMO no cartão público e na prévia do
 * painel. Em "Foto inteira" a imagem ganha um respiro interno (padding em % da
 * largura do quadro) para logos não encostarem na borda.
 */
export function giftImageStyle(gift: FramingInput): CSSProperties {
  const { imageFit, imageFocus, imageZoom } = normalizeGiftImage(gift);
  const position = `${imageFocus.x}% ${imageFocus.y}%`;
  return {
    objectFit: imageFit,
    objectPosition: position,
    padding: imageFit === "contain" ? "6%" : 0,
    transform: imageZoom === 1 ? undefined : `scale(${imageZoom})`,
    transformOrigin: position
  };
}
