import { romanticImages } from "@/lib/demo-wedding";
import type { Database, Json } from "@/lib/supabase/types";
import type { PixKeyType, WeddingSite } from "@/types/wedding";

export type WeddingRow = Database["public"]["Tables"]["weddings"]["Row"];

// Colunas necessárias para renderizar um site — exclui PII server-only
// (pix_holder_document) para nunca expô-la no site público.
export type WeddingRenderRow = Pick<
  WeddingRow,
  | "id"
  | "owner_id"
  | "slug"
  | "status"
  | "couple_names"
  | "pix_key"
  | "pix_key_type"
  | "pix_holder_name"
  | "content"
>;

export const WEDDING_RENDER_COLUMNS =
  "id, owner_id, slug, status, couple_names, pix_key, pix_key_type, pix_holder_name, content";

// Campos do WeddingSite promovidos a colunas consultáveis em `weddings`.
// Todo o resto vive em `content` (JSONB).
const COLUMN_KEYS = [
  "id",
  "ownerId",
  "slug",
  "status",
  "coupleNames",
  "pixKey",
  "pixKeyType",
  "pixHolderName"
] as const;

type WeddingColumnKey = (typeof COLUMN_KEYS)[number];

export type WeddingContent = Omit<WeddingSite, WeddingColumnKey>;

export const TEMPLATE_NAMES: Record<WeddingSite["templateId"], string> = {
  "classico-romantico": "Clássico Romântico",
  "civil-minimalista": "Civil Minimalista",
  "garden-classico": "Jardim Clássico",
  "olive-burgundy": "Olive Burgundy — Save the Date"
};

export const TEMPLATE_IDS = Object.keys(TEMPLATE_NAMES) as WeddingSite["templateId"][];

export function isTemplateId(value: string): value is WeddingSite["templateId"] {
  return (TEMPLATE_IDS as string[]).includes(value);
}

/**
 * Conteúdo inicial NEUTRO de um casamento novo — sem dados do casal-demo.
 * Copy genérica e editável, imagens de placeholder e zero cotas de presente.
 * O casal preenche tudo no editor / na gestão de presentes.
 */
const STARTER_CONTENT: WeddingContent = {
  templateId: "classico-romantico",
  templateName: "Clássico Romântico",
  monogram: "♥",
  weddingDate: "",
  weddingDateLabel: "Em breve",
  weddingTime: "",
  heroImage: romanticImages.luxuryVenue,
  floatingImages: [],
  invitationWords: ["um", "convite", "para", "celebrar", "o", "amor"],
  welcomeText:
    "Estamos felizes em compartilhar este momento com vocês. Em breve, todos os detalhes da nossa celebração estarão aqui.",
  storyEyebrow: "nossa história",
  storyTitle: "Como tudo começou",
  storyMoments: [
    { id: "encontro", number: "I", title: "O encontro", headline: "", description: "Onde dois caminhos viraram um só." },
    { id: "escolha", number: "II", title: "A escolha", headline: "", description: "O sim que nasce dos dias comuns." },
    {
      id: "celebracao",
      number: "III",
      title: "A celebração",
      headline: "",
      description: "O convite para celebrar ao lado de quem amamos."
    }
  ],
  detailsTitle: "Detalhes do grande dia",
  detailsSubtitle: "Local, horário e tudo o que seus convidados precisam saber.",
  locations: [{ id: "principal", title: "Local", venue: "", city: "", note: "", mapUrl: "", image: romanticImages.reception }],
  detailCards: [],
  gifts: [],
  gallery: [],
  finalText: "Mal podemos esperar para celebrar esse dia com você.",
  footerImage: romanticImages.ceremonyAisle,
  footerText: "com amor, os noivos.",
  rsvp: {
    enabled: true,
    title: "Confirme sua presença",
    subtitle: "RSVP",
    allowCompanions: true,
    successMessage: "Presença confirmada. Será uma alegria ter você com a gente."
  },
  theme: {
    background: "#f8f3ea",
    surface: "#fffaf4",
    text: "#2e2722",
    muted: "#73685f",
    primary: "#7b8063",
    primaryDark: "#3e4230",
    primarySoft: "#e6e2d5"
  },
  seo: { title: "Nosso casamento", description: "Site do nosso casamento." }
};

/** Cópia profunda do conteúdo inicial neutro — fallback e semente. */
function baseContent(): WeddingContent {
  return JSON.parse(JSON.stringify(STARTER_CONTENT)) as WeddingContent;
}

/** Iniciais do casal -> monograma "P&R". */
export function monogramFromNames(coupleNames: string): string {
  const parts = coupleNames
    .split(/&| e /i)
    .map((part) => part.trim())
    .filter(Boolean);
  const initials = parts.map((part) => part[0]?.toUpperCase()).filter(Boolean);
  return initials.length ? initials.slice(0, 2).join("&") : "♥";
}

export type NewWeddingInput = {
  coupleNames: string;
  templateId: WeddingSite["templateId"];
  weddingDate?: string;
  weddingDateLabel?: string;
  weddingTime?: string;
  city?: string;
  venue?: string;
};

/** Conteúdo inicial de um casamento novo: parte do demo e aplica os dados do casal. */
export function defaultWeddingContent(input: NewWeddingInput): WeddingContent {
  const base = baseContent();
  const primary = base.locations[0];
  return {
    ...base,
    templateId: input.templateId,
    templateName: TEMPLATE_NAMES[input.templateId],
    monogram: monogramFromNames(input.coupleNames),
    weddingDate: input.weddingDate || base.weddingDate,
    weddingDateLabel: input.weddingDateLabel || base.weddingDateLabel,
    weddingTime: input.weddingTime || base.weddingTime,
    locations: primary
      ? [
          { ...primary, venue: input.venue || primary.venue, city: input.city || primary.city },
          ...base.locations.slice(1)
        ]
      : base.locations,
    seo: {
      title: input.coupleNames,
      description: `Site de casamento de ${input.coupleNames}.`
    }
  };
}

/** Serializa o conteúdo para gravar na coluna JSONB. */
export function contentToJson(content: WeddingContent): Json {
  return content as unknown as Json;
}

/** Extrai a parte de conteúdo (JSONB) de um WeddingSite completo, sem as colunas. */
export function extractContent(site: WeddingSite): WeddingContent {
  const content: Record<string, unknown> = { ...site };
  for (const key of COLUMN_KEYS) {
    delete content[key];
  }
  return content as WeddingContent;
}

/** Reconstrói um WeddingSite completo a partir de uma linha do banco. */
export function rowToWeddingSite(row: WeddingRenderRow): WeddingSite {
  const stored = (row.content ?? {}) as Partial<WeddingContent>;
  return {
    ...baseContent(),
    ...stored,
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    status: row.status,
    coupleNames: row.couple_names,
    pixKey: row.pix_key ?? "",
    pixKeyType: (row.pix_key_type as PixKeyType | null) ?? "random",
    pixHolderName: row.pix_holder_name ?? ""
  };
}
