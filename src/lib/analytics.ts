"use client";

import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_KEYS,
  CONSENT_COOKIE,
  META_EVENT_NAME,
  parseAttribution,
  type Attribution,
  type GaOnlyEvent,
  type TrackEvent
} from "@/lib/tracking-shared";

/**
 * Medição no navegador: consentimento (LGPD), atribuição de campanha e `track()`
 * para Meta Pixel + GA4. Os scripts só carregam depois do "Aceitar" (ver
 * components/analytics/Analytics.tsx); antes disso `track()` é no-op.
 */

type Fbq = (...args: unknown[]) => void;
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

export type Consent = "granted" | "denied";
export const CONSENT_EVENT = "noivar:consent";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : undefined;
}

function writeCookie(name: string, value: string, days: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Max-Age=${days * 86400}; Path=/; SameSite=Lax${secure}`;
}

export function getConsent(): Consent | null {
  const value = readCookie(CONSENT_COOKIE);
  return value === "granted" || value === "denied" ? value : null;
}

const AD_COOKIE_RE = /^(_fbp|_fbc|_ga(_.+)?|_gid|_gat.*)$/;

/** Apaga _fbp/_fbc/_ga* em todos os níveis de domínio (GA e Pixel gravam no domínio raiz). */
function clearAdCookies() {
  const names = document.cookie.split("; ").map((part) => part.split("=")[0]).filter((name) => AD_COOKIE_RE.test(name));
  const labels = location.hostname.split(".");
  const domains = ["", ...labels.map((_, i) => `; Domain=.${labels.slice(i).join(".")}`)];
  for (const name of names) for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
}

export function setConsent(value: Consent) {
  writeCookie(CONSENT_COOKIE, value, 180);
  if (value === "denied") {
    clearAdCookies();
    // Pixel/GA já carregados não descarregam: recarrega para pararem de vez.
    if (window.fbq || window.gtag) {
      location.reload();
      return;
    }
  }
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: value }));
}

/** "Preferências de cookies": esquece a escolha e o aviso volta (LGPD: revogar a qualquer momento). */
export function resetConsent() {
  writeCookie(CONSENT_COOKIE, "", 0);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
}

/**
 * Guarda o PRIMEIRO toque de campanha. UTMs não identificam ninguém e são salvas
 * sempre; fbclid/gclid (identificadores de anúncio) só com consentimento. Se o
 * aceite chega depois (cookie já gravado sem click id), mescla os da URL atual.
 * ponytail: se o aceite vier depois de sair da URL do anúncio, o click id se perde;
 * o Pixel grava _fbc sozinho quando carrega numa URL com fbclid.
 */
export function captureAttribution() {
  const params = new URLSearchParams(location.search);
  const consent = getConsent() === "granted";
  const found: Attribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (!value) continue;
    if ((key === "fbclid" || key === "gclid") && !consent) continue;
    found[key] = value.slice(0, 200);
  }
  if (!Object.keys(found).length) return;
  const existing = readCookie(ATTRIBUTION_COOKIE);
  if (existing) {
    const saved = parseAttribution(existing);
    if (!saved || saved.fbclid || saved.gclid || !(found.fbclid || found.gclid)) return;
    const merged: Attribution = { ...saved, fbclid: found.fbclid, gclid: found.gclid };
    writeCookie(ATTRIBUTION_COOKIE, encodeURIComponent(JSON.stringify(merged)), 90);
    return;
  }
  let referrer: string | undefined;
  try {
    referrer = document.referrer ? new URL(document.referrer).host : undefined;
  } catch {
    referrer = undefined;
  }
  const value: Attribution = { ...found, landing: location.pathname, referrer, at: new Date().toISOString() };
  writeCookie(ATTRIBUTION_COOKIE, encodeURIComponent(JSON.stringify(value)), 90);
}

export function newEventId(prefix: string) {
  // randomUUID só existe em contexto seguro e em Safari/WebView iOS >= 15.4 (inclui in-app do Instagram).
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${id}`;
}

/**
 * Dispara um evento no Pixel e no GA4 (se carregados). Eventos só-GA4 não vão ao
 * Pixel. Passe `eventId` quando o servidor também enviar o mesmo evento pela
 * Conversions API.
 */
export function track(
  event: TrackEvent | GaOnlyEvent,
  params: {
    value?: number;
    currency?: "BRL";
    template?: string;
    method?: string;
    location?: string;
    variant?: string;
  } = {},
  options: { eventId?: string } = {}
) {
  if (typeof window === "undefined") return;
  const meta = event in META_EVENT_NAME ? META_EVENT_NAME[event as TrackEvent] : null;
  const metaParams: Record<string, unknown> = {};
  if (params.value != null) {
    metaParams.value = params.value;
    metaParams.currency = params.currency ?? "BRL";
  }
  if (params.template) metaParams.content_name = params.template;

  try {
    if (meta) {
      window.fbq?.(meta.custom ? "trackCustom" : "track", meta.name, metaParams, options.eventId ? { eventID: options.eventId } : undefined);
    }
    window.gtag?.("event", event, {
      ...params,
      currency: params.value != null ? params.currency ?? "BRL" : undefined,
      transaction_id: event === "purchase" ? options.eventId : undefined
    });
  } catch {
    // Medição nunca quebra a interface.
  }
}
