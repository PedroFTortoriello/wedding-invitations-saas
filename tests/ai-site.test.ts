import { describe, expect, it } from "vitest";
import { applyAiDraft, type AiBriefing, type AiDraft } from "@/lib/ai-site";
import { defaultWeddingContent } from "@/lib/wedding";

const base = defaultWeddingContent({ coupleNames: "Ana & Pedro", templateId: "jardim-romantico" });

const briefing: AiBriefing = {
  coupleNames: "Ana & Pedro",
  weddingDate: "2027-05-22",
  weddingTime: "17:00",
  venue: "Fazenda Santa Maria",
  city: "Porto Feliz, SP",
  address: "Estrada do Sol, 100",
  story: "",
  style: "",
  schedule: "",
  extras: "",
  photos: ["https://x/a.jpg", "https://x/b.jpg", "https://x/c.jpg"]
};

const draft: AiDraft = {
  templateId: "cinema-noir",
  welcomeText: "Bem-vindos.",
  invitationWords: ["uma", "noite", "para", "celebrar"],
  storyEyebrow: "nossa história",
  storyTitle: "um amor que virou casa",
  storyMoments: [
    { title: "O encontro", headline: "a\nb", description: "d1" },
    { title: "A escolha", headline: "c\nd", description: "d2" },
    { title: "A festa", headline: "e\nf", description: "d3" },
    { title: "Extra", headline: "x", description: "ignorado" }
  ],
  detailsTitle: "Detalhes",
  detailsSubtitle: "Sub",
  schedule: [
    { time: "16:30", title: "Recepção", note: "" },
    { time: "às 5", title: "Cerimônia", note: "" }
  ],
  locationNote: "Estacionamento no local.",
  finalText: "Até lá.",
  footerText: "com amor, ana e pedro.",
  rsvpTitle: "Confirme",
  rsvpSubtitle: "Até abril",
  rsvpSuccessMessage: "Obrigado",
  seoDescription: "O casamento de Ana e Pedro.",
  heroPhoto: 2,
  footerPhoto: 99, // fora da faixa: cai na última foto
  galleryOrder: [2, 2, 7, 0], // repetido e inválido: some; a foto 1 esquecida vai para o fim
  photoAlts: ["A", "B", "C"]
};

describe("applyAiDraft", () => {
  const out = applyAiDraft(base, draft, briefing);

  it("usa o modelo, os textos e só 3 capítulos numerados", () => {
    expect(out.templateId).toBe("cinema-noir");
    expect(out.templateName).toBe("Cinema Noir");
    expect(out.storyMoments.map((m) => m.number)).toEqual(["I", "II", "III"]);
    expect(out.rsvp.enabled).toBe(true);
  });

  it("organiza as fotos com índices validados", () => {
    expect(out.heroImage).toBe("https://x/c.jpg");
    expect(out.footerImage).toBe("https://x/c.jpg");
    expect(out.gallery.map((g) => g.src)).toEqual(["https://x/c.jpg", "https://x/a.jpg", "https://x/b.jpg"]);
    expect(out.gallery[0].alt).toBe("C");
  });

  it("data, local e mapa vêm do briefing; horário inválido fica vazio", () => {
    expect(out.weddingDate).toBe("2027-05-22T20:00:00.000Z");
    expect(out.locations[0].venue).toBe("Fazenda Santa Maria");
    expect(out.locations[0].mapUrl).toContain(encodeURIComponent("Fazenda Santa Maria, Estrada do Sol, 100"));
    expect(out.schedule[1].time).toBe("");
  });

  it("sem fotos mantém as imagens atuais", () => {
    const noPhotos = applyAiDraft(base, draft, { ...briefing, photos: [] });
    expect(noPhotos.heroImage).toBe(base.heroImage);
    expect(noPhotos.gallery).toEqual(base.gallery);
  });
});
