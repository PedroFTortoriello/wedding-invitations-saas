import { describe, expect, it } from "vitest";
import { giftImageStyle, normalizeGiftImage, sanitizeGiftFraming } from "@/lib/gift-image";
import type { WeddingGift } from "@/types/wedding";

const gift: WeddingGift = { id: "g", title: "Cota", description: "", price: "R$ 1", link: "#", image: "x", active: true };

describe("enquadramento da foto da cota", () => {
  it("cota antiga sem ajuste = foto inteira, centralizada, sem zoom", () => {
    expect(normalizeGiftImage(gift)).toEqual({ imageFit: "contain", imageFocus: { x: 50, y: 50 }, imageZoom: 1 });
    expect(giftImageStyle(gift)).toMatchObject({ objectFit: "contain", objectPosition: "50% 50%", transform: undefined });
  });

  it("limita foco e zoom e ignora lixo vindo do cliente/JSON", () => {
    expect(normalizeGiftImage({ imageFit: "fill", imageFocus: { x: -20, y: 140 }, imageZoom: 9 })).toEqual({
      imageFit: "contain",
      imageFocus: { x: 0, y: 100 },
      imageZoom: 3
    });
    expect(normalizeGiftImage({ imageFocus: { x: "10", y: 5 }, imageZoom: Number.NaN }).imageZoom).toBe(1);
  });

  it("sanitize mantém só campos válidos (limitados) e descarta os inválidos", () => {
    const dirty = { ...gift, imageFit: "zoom", imageFocus: { x: 33.333, y: 101 }, imageZoom: "2" } as unknown as WeddingGift;
    const clean = sanitizeGiftFraming(dirty);
    expect(clean).not.toHaveProperty("imageFit");
    expect(clean).not.toHaveProperty("imageZoom");
    expect(clean.imageFocus).toEqual({ x: 33.3, y: 100 });
    expect(sanitizeGiftFraming({ ...gift, imageFit: "cover", imageZoom: 0.5 })).toMatchObject({ imageFit: "cover", imageZoom: 1 });
  });
});
