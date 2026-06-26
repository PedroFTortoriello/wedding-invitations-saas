import crypto from "node:crypto";
import { PUBLISH_FEE_BRL } from "@/lib/platform-data";

const ABACATEPAY_BASE_URL = process.env.ABACATEPAY_BASE_URL || "https://api.abacatepay.com/v1";

/** The single publishing fee in centavos — AbacatePay expects integer cents (R$149,90 -> 14990). */
export const PUBLISH_FEE_CENTS = Math.round(PUBLISH_FEE_BRL * 100);

/** AbacatePay events that mean "the customer paid" (v1 + v2 hosted/transparent). */
const PAID_EVENTS = new Set(["billing.paid", "checkout.completed", "transparent.completed"]);

export type CreatePublishChargeInput = {
  weddingId: string;
  appUrl: string;
  customer?: { name?: string; email?: string };
};

export type PublishCharge = {
  id: string;
  url: string;
  status: string;
  amountCents: number;
  devMode?: boolean;
};

type BillingResponse = {
  data?: { id?: string; url?: string; status?: string; amount?: number; devMode?: boolean };
  id?: string;
  url?: string;
  status?: string;
  amount?: number;
  devMode?: boolean;
};

/** Create the one-time R$149,90 hosted checkout (PIX + card) for a wedding's publish fee. */
export async function createPublishCharge(input: CreatePublishChargeInput): Promise<PublishCharge> {
  const apiKey = process.env.ABACATEPAY_API_KEY;
  if (!apiKey) {
    throw new Error("AbacatePay não configurado: defina ABACATEPAY_API_KEY no .env.");
  }

  const response = await fetch(`${ABACATEPAY_BASE_URL}/billing/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      frequency: "ONE_TIME",
      methods: ["PIX", "CARD"],
      externalId: input.weddingId,
      products: [
        {
          externalId: `publish-${input.weddingId}`,
          name: "Publicação do site de casamento",
          quantity: 1,
          price: PUBLISH_FEE_CENTS
        }
      ],
      returnUrl: `${input.appUrl}/dashboard`,
      completionUrl: `${input.appUrl}/dashboard?publicacao=paga`,
      ...(input.customer ? { customer: input.customer } : {})
    })
  });

  const json = (await response.json().catch(() => null)) as BillingResponse | null;
  const data = (json?.data ?? json ?? {}) as NonNullable<BillingResponse["data"]>;

  if (!response.ok || !data.url || !data.id) {
    throw new Error(`AbacatePay não retornou uma cobrança válida (HTTP ${response.status}).`);
  }

  return {
    id: data.id,
    url: data.url,
    status: data.status ?? "PENDING",
    amountCents: typeof data.amount === "number" ? data.amount : PUBLISH_FEE_CENTS,
    devMode: data.devMode
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
 * Normalize an AbacatePay webhook payload across API generations:
 *  - v1: { event:'billing.paid', data:{ externalId, status, id, amount } }
 *  - v2: { event:'checkout.completed'|'transparent.completed', data:{ checkout|transparent:{ externalId, status, id, amount } } }
 * Returns paid=true only on a confirmed-paid event AND status === 'PAID'.
 */
export function parseAbacatePayWebhook(payload: unknown): AbacatePayWebhookResult {
  const root = asRecord(payload);
  if (!root) return { paid: false };

  const event = typeof root.event === "string" ? root.event : "";
  const eventId = typeof root.id === "string" ? root.id : undefined;
  const devMode = typeof root.devMode === "boolean" ? root.devMode : undefined;

  const data = asRecord(root.data) ?? {};
  const charge = asRecord(data.checkout) ?? asRecord(data.transparent) ?? data;

  const status = typeof charge.status === "string" ? charge.status.toUpperCase() : "";
  const weddingId = typeof charge.externalId === "string" ? charge.externalId : undefined;
  const chargeId = typeof charge.id === "string" ? charge.id : undefined;
  const amountCents = typeof charge.amount === "number" ? charge.amount : undefined;

  return {
    paid: PAID_EVENTS.has(event) && status === "PAID",
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
