import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Sessão de suporte do admin ("Ver conta" de um cliente). O admin continua logado com a
 * própria conta; este cookie httpOnly, assinado com HMAC e com validade curta, só diz
 * QUAL conta ele está vendo. Nunca confiar só no cookie: getActingContext() confere a
 * cada requisição que o usuário da sessão é o mesmo admin e que o papel ainda é admin.
 */

export const SUPPORT_COOKIE = "noivar_support";
export const SUPPORT_TTL_SECONDS = 2 * 60 * 60;

export type SupportPayload = {
  /** id do admin que abriu a sessão */
  adminId: string;
  /** id da conta do cliente */
  targetUserId: string;
  /** expiração (epoch em segundos) */
  exp: number;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID_RE.test(value);

function key(): Buffer {
  // ponytail: sem env novo; deriva do service role (nunca sai do servidor). Trocar a
  // chave (SUPPORT_SESSION_SECRET) invalida todas as sessões de suporte abertas.
  const base = process.env.SUPPORT_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("Sessão de suporte indisponível: defina SUPPORT_SESSION_SECRET ou SUPABASE_SERVICE_ROLE_KEY.");
  return createHmac("sha256", base).update("noivar-support-session-v1").digest();
}

const b64url = (buf: Buffer) => buf.toString("base64url");

export function signSupport(payload: SupportPayload): string {
  const body = b64url(Buffer.from(JSON.stringify({ a: payload.adminId, t: payload.targetUserId, e: payload.exp })));
  const mac = b64url(createHmac("sha256", key()).update(body).digest());
  return `${body}.${mac}`;
}

export function verifySupport(raw: string | undefined | null, nowSeconds = Math.floor(Date.now() / 1000)): SupportPayload | null {
  if (!raw || raw.length > 512) return null;
  const [body, mac, extra] = raw.split(".");
  if (!body || !mac || extra !== undefined) return null;
  const expected = createHmac("sha256", key()).update(body).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { a?: unknown; t?: unknown; e?: unknown };
    if (!isUuid(parsed.a) || !isUuid(parsed.t) || typeof parsed.e !== "number") return null;
    if (parsed.e <= nowSeconds || parsed.a === parsed.t) return null;
    return { adminId: parsed.a, targetUserId: parsed.t, exp: parsed.e };
  } catch {
    return null;
  }
}

export async function readSupportCookie(): Promise<SupportPayload | null> {
  const store = await cookies();
  return verifySupport(store.get(SUPPORT_COOKIE)?.value);
}

/** Só em Server Action / Route Handler (onde cookies() pode escrever). */
export async function setSupportCookie(adminId: string, targetUserId: string): Promise<SupportPayload> {
  const payload: SupportPayload = { adminId, targetUserId, exp: Math.floor(Date.now() / 1000) + SUPPORT_TTL_SECONDS };
  const store = await cookies();
  store.set(SUPPORT_COOKIE, signSupport(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SUPPORT_TTL_SECONDS
  });
  return payload;
}

/** Só em Server Action / Route Handler. */
export async function clearSupportCookie(): Promise<void> {
  const store = await cookies();
  // Sem cookie, nada a apagar (delete numa action força re-render da rota à toa).
  if (store.has(SUPPORT_COOKIE)) store.delete(SUPPORT_COOKIE);
}
