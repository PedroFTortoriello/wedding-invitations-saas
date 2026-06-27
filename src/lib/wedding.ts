import { demoWedding } from "@/lib/demo-wedding";
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

/** Conteúdo-base (do demo) sem as colunas — usado como fallback e como semente. */
function baseContent(): WeddingContent {
  const content: Record<string, unknown> = { ...demoWedding };
  for (const key of COLUMN_KEYS) {
    delete content[key];
  }
  return content as WeddingContent;
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
