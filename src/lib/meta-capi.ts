import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import {
  ATTRIBUTION_COOKIE,
  CONSENT_COOKIE,
  META_EVENT_NAME,
  parseAttribution,
  type Attribution,
  type TrackEvent
} from "@/lib/tracking-shared";

/**
 * Meta Conversions API (servidor). Complementa o Pixel do navegador — bloqueadores e
 * iOS perdem eventos no cliente — e deduplica com ele pelo mesmo `eventId`.
 * No-op sem NEXT_PUBLIC_META_PIXEL_ID + META_CAPI_ACCESS_TOKEN, e sem consentimento.
 */

const GRAPH_VERSION = "v21.0";
const TIMEOUT_MS = 3000;

const sha256 = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

export type TrackingContext = {
  consent: boolean;
  attribution: Attribution | null;
  fbp?: string;
  fbc?: string;
  userAgent?: string;
  ip?: string;
  /** URL da página que originou a ação (Referer). */
  sourceUrl?: string;
};

/** Consentimento, atribuição e identificadores de anúncio da requisição atual (action/route). */
export async function getTrackingContext(): Promise<TrackingContext> {
  const [cookieStore, hdrs] = await Promise.all([cookies(), headers()]);
  const consent = cookieStore.get(CONSENT_COOKIE)?.value === "granted";
  return {
    consent,
    attribution: parseAttribution(cookieStore.get(ATTRIBUTION_COOKIE)?.value),
    // Identificadores de anúncio só com consentimento.
    fbp: consent ? cookieStore.get("_fbp")?.value : undefined,
    fbc: consent ? cookieStore.get("_fbc")?.value : undefined,
    userAgent: consent ? hdrs.get("user-agent") ?? undefined : undefined,
    ip: consent ? hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined : undefined,
    sourceUrl: hdrs.get("referer") ?? undefined
  };
}

export type MetaServerEvent = {
  event: TrackEvent;
  eventId: string;
  /** Quem fez: vira external_id (hash). */
  userId?: string | null;
  /** Vira `em` (hash). Nunca é enviado em claro. */
  email?: string | null;
  value?: number;
  currency?: "BRL";
  /** Contexto já capturado; se o evento vem de um webhook, passe o salvo no checkout. */
  context: Pick<TrackingContext, "consent" | "fbp" | "fbc" | "userAgent" | "ip" | "sourceUrl">;
};

/** Envia um evento à Conversions API. Nunca lança; espera no máximo ~3s. */
export async function sendMetaServerEvent(input: MetaServerEvent): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token || !input.context.consent) return;

  const { name } = META_EVENT_NAME[input.event];
  const userData: Record<string, unknown> = {};
  if (input.email) userData.em = [sha256(input.email)];
  if (input.userId) userData.external_id = [sha256(input.userId)];
  if (input.context.fbp) userData.fbp = input.context.fbp;
  if (input.context.fbc) userData.fbc = input.context.fbc;
  if (input.context.userAgent) userData.client_user_agent = input.context.userAgent;
  if (input.context.ip) userData.client_ip_address = input.context.ip;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.context.sourceUrl,
        user_data: userData,
        custom_data: input.value != null ? { value: input.value, currency: input.currency ?? "BRL" } : undefined
      }
    ]
  };
  if (process.env.META_CAPI_TEST_EVENT_CODE) payload.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store"
    });
    if (!res.ok) {
      console.error(JSON.stringify({ at: "meta-capi", event: name, status: res.status, body: (await res.text()).slice(0, 300) }));
    }
  } catch (err) {
    console.error(JSON.stringify({ at: "meta-capi", event: name, error: err instanceof Error ? err.message : String(err) }));
  }
}
