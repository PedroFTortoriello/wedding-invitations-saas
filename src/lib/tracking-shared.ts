/**
 * Contratos de medição compartilhados entre cliente e servidor (sem APIs de nenhum
 * dos dois lados, para poder ser importado dos dois).
 */

/** Consentimento LGPD para cookies de marketing/medição: "granted" | "denied". */
export const CONSENT_COOKIE = "noivar_consent";

/** Primeiro toque de campanha (UTM, e fbclid/gclid só com consentimento), 90 dias. */
export const ATTRIBUTION_COOKIE = "noivar_attr";

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid"
] as const;

export type Attribution = Partial<Record<(typeof ATTRIBUTION_KEYS)[number], string>> & {
  /** Caminho da primeira página vista com a campanha. */
  landing?: string;
  /** Host de origem (document.referrer), sem path. */
  referrer?: string;
  /** ISO da captura. */
  at?: string;
};

/** Lê o cookie de atribuição (JSON url-encoded); tolera valor corrompido. */
export function parseAttribution(raw: string | undefined | null): Attribution | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as unknown;
    if (!value || typeof value !== "object") return null;
    const out: Attribution = {};
    for (const [key, v] of Object.entries(value)) {
      if (typeof v === "string" && v.length <= 300) (out as Record<string, string>)[key] = v;
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Eventos do funil com equivalente no Meta (GA4 usa estes nomes; o Pixel e a
 * Conversions API recebem o nome do Meta). `eventId` compartilhado entre Pixel
 * (navegador) e Conversions API (servidor) deduplica o mesmo evento nos dois canais.
 */
export type TrackEvent =
  | "view_template" // abriu a demo de um modelo
  | "sign_up" // conta criada
  | "wedding_created" // casamento criado (automático ou formulário)
  | "begin_checkout" // abriu o pagamento da taxa
  | "purchase"; // taxa paga

/** Diagnóstico da landing, só GA4: nunca vão ao Pixel nem à CAPI (não são evento de otimização). */
export type GaOnlyEvent =
  | "cta_click" // clique num link de cadastro ([data-cta])
  | "select_template" // troca de modelo no hero ou em Modelos
  | "view_pricing"; // #preco entrou na tela (uma vez por página)

/** Nome no Meta por evento. Eventos só-GA4 ficam fora do mapa e, por isso, fora do tipo que a CAPI aceita. */
export const META_EVENT_NAME: Record<TrackEvent, { name: string; custom?: boolean }> = {
  view_template: { name: "ViewContent" },
  sign_up: { name: "CompleteRegistration" },
  wedding_created: { name: "WeddingCreated", custom: true },
  begin_checkout: { name: "InitiateCheckout" },
  purchase: { name: "Purchase" }
};

/** event_id estável da compra da taxa: um pagamento por casamento. */
export const purchaseEventId = (weddingId: string) => `publish_${weddingId}`;
