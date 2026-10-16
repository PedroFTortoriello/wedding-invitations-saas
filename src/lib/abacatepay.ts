import crypto from "node:crypto";
import { AI_SITE_FEE_BRL, PUBLISH_FEE_BRL } from "@/lib/platform-data";

const ABACATEPAY_BASE_URL = process.env.ABACATEPAY_BASE_URL || "https://api.abacatepay.com/v2";

/** The publishing fee in centavos — AbacatePay expects integer cents (R$89,90 -> 8990). */
export const PUBLISH_FEE_CENTS = Math.round(PUBLISH_FEE_BRL * 100);
/** The "Site feito pela IA" publishing fee in centavos. */
export const AI_SITE_FEE_CENTS = Math.round(AI_SITE_FEE_BRL * 100);

/** AbacatePay events that mean "the customer paid" (v1 + v2 hosted/transparent). */
const PAID_EVENTS = new Set(["billing.paid", "checkout.completed", "transparent.completed"]);

/**
 * Nested `status` values that mean the payment did NOT complete. The completion
 * events above already imply payment, so we treat a completion event as paid
 * UNLESS its status is explicitly one of these — accepting COMPLETED/APPROVED/
 * absent (v2 varies) instead of demanding a literal "PAID" (which silently
 * dropped real payments).
 */
const UNPAID_STATUSES = new Set([
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "CANCELED",
  "REFUNDED",
  "PENDING",
  "REJECTED",
  "DECLINED"
]);

export type CreatePublishChargeInput = {
  weddingId: string;
  appUrl: string;
  /** Site gerado pela IA: cobra a taxa do plano com IA (outro produto e preço). */
  ai?: boolean;
};

export type PublishCharge = {
  id: string;
  url: string;
  status: string;
  amountCents: number;
  devMode?: boolean;
};

type V2CheckoutResponse = {
  success?: boolean;
  error?: unknown;
  devMode?: boolean;
  data?: {
    id?: string;
    url?: string;
    status?: string;
    amount?: number;
    externalId?: string;
    devMode?: boolean;
  };
};

type V2ProductResponse = {
  success?: boolean;
  error?: unknown;
  data?: { id?: string; externalId?: string };
};

/** Os dois produtos da taxa. O externalId leva o preço: mudar o preço cria um produto novo. */
const PRODUCTS = {
  standard: {
    env: "ABACATEPAY_PUBLISH_PRODUCT_ID",
    cents: PUBLISH_FEE_CENTS,
    name: "Publicação do site de casamento",
    description: "Taxa única para publicar o site de casamento."
  },
  ai: {
    env: "ABACATEPAY_AI_PRODUCT_ID",
    cents: AI_SITE_FEE_CENTS,
    name: "Site de casamento feito pela IA",
    description: "Taxa única para publicar o site de casamento montado pela IA."
  }
} as const;
type ProductKind = keyof typeof PRODUCTS;

// Cache do id de cada produto por instância — evita recriar a cada checkout.
const cachedProductIds: Partial<Record<ProductKind, string>> = {};

/** Mensagem de erro que a AbacatePay devolve em `error` (string ou objeto). */
function abacatePayError(json: unknown): string {
  const err = asRecord(json)?.error;
  if (!err) return "";
  return typeof err === "string" ? err : JSON.stringify(err);
}

/**
 * Resolve o id do produto da taxa (padrão ou IA). Ordem:
 *  1) env (ABACATEPAY_PUBLISH_PRODUCT_ID / ABACATEPAY_AI_PRODUCT_ID) — recomendado;
 *  2) cache em memória da instância;
 *  3) cria o produto na v2 e cacheia (fallback de conveniência).
 * Obs.: sem endpoint público de "buscar produto", o fallback pode criar um
 * produto novo a cada cold start se a AbacatePay não deduplicar por externalId;
 * por isso logamos o id para você fixar em env.
 */
async function resolveProductId(apiKey: string, kind: ProductKind): Promise<string> {
  const product = PRODUCTS[kind];
  const envId = process.env[product.env];
  if (envId) return envId;
  const cached = cachedProductIds[kind];
  if (cached) return cached;

  const response = await fetch(`${ABACATEPAY_BASE_URL}/products/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      externalId: `${kind === "ai" ? "ai-site-fee" : "publish-fee"}-${product.cents}`,
      name: product.name,
      description: product.description,
      price: product.cents,
      currency: "BRL"
    })
  });

  const json = (await response.json().catch(() => null)) as V2ProductResponse | null;
  const id = json?.data?.id;
  if (!response.ok || json?.success === false || !id) {
    const detail = abacatePayError(json);
    console.error("AbacatePay products/create falhou", response.status, JSON.stringify(json));
    throw new Error(
      `Não foi possível preparar o produto da taxa de publicação (HTTP ${response.status})${detail ? `: ${detail}` : ""}.`
    );
  }

  cachedProductIds[kind] = id;
  console.warn(`AbacatePay: produto da taxa criado automaticamente (${id}). Fixe ${product.env}=${id} no .env para evitar recriação.`);
  return id;
}

/**
 * Cria o checkout hospedado (somente PIX) da taxa única de publicação na API v2
 * (POST /v2/checkouts/create). Os itens da v2 referenciam um PRODUTO; o id vem do
 * env do produto (recomendado) ou é criado automaticamente. O site feito pela IA
 * usa outro produto e outro externalId: a AbacatePay deduplica por externalId e
 * devolveria o checkout do preço padrão aberto antes da geração.
 */
export async function createPublishCharge(input: CreatePublishChargeInput): Promise<PublishCharge> {
  const apiKey = process.env.ABACATEPAY_API_KEY;
  if (!apiKey) {
    throw new Error("AbacatePay não configurado: defina ABACATEPAY_API_KEY no .env.");
  }

  const kind: ProductKind = input.ai ? "ai" : "standard";
  const expectedCents = PRODUCTS[kind].cents;
  const productId = await resolveProductId(apiKey, kind);

  const response = await fetch(`${ABACATEPAY_BASE_URL}/checkouts/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      items: [{ id: productId, quantity: 1 }],
      methods: ["PIX"],
      // Volta para /publicar, que acompanha a confirmação do Pix e mostra o site no ar.
      returnUrl: `${input.appUrl}/publicar`,
      completionUrl: `${input.appUrl}/publicar?pagamento=concluido`,
      externalId: input.ai ? `ia-${input.weddingId}` : input.weddingId,
      metadata: { weddingId: input.weddingId }
    })
  });

  const json = (await response.json().catch(() => null)) as V2CheckoutResponse | null;
  const data = json?.data;

  if (!response.ok || json?.success === false || !data?.url || !data?.id) {
    const detail = abacatePayError(json);
    console.error("AbacatePay checkouts/create falhou", response.status, JSON.stringify(json));
    throw new Error(
      `AbacatePay não retornou uma cobrança válida (HTTP ${response.status})${detail ? `: ${detail}` : ""}.`
    );
  }

  // Recusa um checkout com valor diferente da taxa canônica (produto mal-precificado
  // no painel do provedor publicaria o site pelo valor errado).
  const amountCents = typeof data.amount === "number" ? data.amount : expectedCents;
  if (amountCents !== expectedCents) {
    console.error(
      `AbacatePay: valor do checkout (${amountCents}) difere da taxa esperada (${expectedCents}). Corrija o preço do produto em ${PRODUCTS[kind].env}.`
    );
    throw new Error("A taxa de publicação está com valor incorreto no provedor. Contate o suporte.");
  }

  return {
    id: data.id,
    url: data.url,
    status: data.status ?? "PENDING",
    amountCents,
    devMode: data.devMode ?? json?.devMode
  };
}

export type AbacatePayWebhookResult = {
  paid: boolean;
  weddingId?: string;
  chargeId?: string;
  amountCents?: number;
  eventId?: string;
  devMode?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

/**
 * Normaliza o payload do webhook entre gerações da API:
 *  - v1: { event:'billing.paid', data:{ externalId, status, id, amount } }
 *  - v2: { event:'checkout.completed'|'transparent.completed', apiVersion:2,
 *         data:{ ...checkout } } — o objeto do checkout pode vir direto em `data`
 *         ou aninhado (checkout/transparent/billing/payment).
 * Os eventos de conclusão já significam pagamento confirmado; aceitamos status
 * ausente e, se vier, exigimos 'PAID' (evita falso positivo). A validação final
 * (charge real, valor, idempotência) é feita por mark_publish_paid no banco.
 */
export function parseAbacatePayWebhook(payload: unknown): AbacatePayWebhookResult {
  const root = asRecord(payload);
  if (!root) return { paid: false };

  const event = typeof root.event === "string" ? root.event : "";
  const eventId = typeof root.id === "string" ? root.id : undefined;
  const devMode = typeof root.devMode === "boolean" ? root.devMode : undefined;

  const data = asRecord(root.data) ?? {};
  const charge =
    asRecord(data.checkout) ??
    asRecord(data.transparent) ??
    asRecord(data.billing) ??
    asRecord(data.payment) ??
    data;

  const chargeMeta = asRecord(charge.metadata) ?? asRecord(data.metadata) ?? {};
  const status = typeof charge.status === "string" ? charge.status.toUpperCase() : "";
  // externalId é o principal ("<uuid>" ou "ia-<uuid>"); a v2 pode carregar o id só em metadata.weddingId.
  const weddingId =
    (typeof charge.externalId === "string" && charge.externalId.replace(/^ia-/, "")) ||
    (typeof chargeMeta.weddingId === "string" ? chargeMeta.weddingId : undefined) ||
    undefined;
  const chargeId = typeof charge.id === "string" ? charge.id : undefined;
  const amountCents = typeof charge.amount === "number" ? charge.amount : undefined;

  return {
    paid: PAID_EVENTS.has(event) && !UNPAID_STATUSES.has(status),
    weddingId,
    chargeId,
    amountCents,
    eventId,
    devMode
  };
}

/** Constant-time string comparison (length-safe). */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Primary webhook gate: the secret AbacatePay appends to the webhook URL
 * (?webhookSecret=...) must match ABACATEPAY_WEBHOOK_SECRET. Rejects if either
 * is missing — a webhook is never trusted without a configured, matching secret.
 */
export function isWebhookSecretValid(provided: string | null): boolean {
  const expected = process.env.ABACATEPAY_WEBHOOK_SECRET;
  if (!expected || !provided) return false;
  return timingSafeEqualStr(provided, expected);
}

/**
 * Optional HMAC layer (X-Webhook-Signature over the raw body). Disabled until
 * ABACATEPAY_WEBHOOK_SIGNING_SECRET is set — the exact key and digest encoding
 * (base64 vs hex) must be confirmed on AbacatePay's security docs first, so a
 * wrong recipe can't silently reject real payments; the query-secret gate stays
 * mandatory regardless.
 */
export function isWebhookSignatureValid(rawBody: string, signatureHeader: string | null): boolean {
  const key = process.env.ABACATEPAY_WEBHOOK_SIGNING_SECRET;
  if (!key) return true;
  if (!signatureHeader) return false;
  const expected = crypto.createHmac("sha256", key).update(Buffer.from(rawBody, "utf8")).digest("base64");
  return timingSafeEqualStr(expected, signatureHeader);
}
