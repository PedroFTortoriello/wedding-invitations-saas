import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

/**
 * Funil e erros persistidos em `funnel_events` (migration 0011). Só servidor: usa a
 * service role. Nunca lança — medir não pode derrubar a ação do usuário — e, se a
 * tabela ainda não existir, só registra no console.
 *
 * Regra de privacidade: `detail` nunca leva e-mail, chave Pix, documento, telefone
 * ou mensagem de convidado. Ids, status, códigos e UTMs, sim.
 */

export type FunnelEventName =
  | "signup_completed"
  | "signup_failed"
  | "wedding_created"
  | "wedding_create_failed"
  | "editor_opened"
  | "autosave_failed"
  | "publish_page_viewed"
  | "publish_checkout_started"
  | "publish_checkout_failed"
  | "publish_paid"
  | "site_published"
  | "publish_failed"
  | "action_failed"
  // Admin: modo suporte ("Ver conta") e exclusão de conta. Sempre com detail.adminId.
  | "support_session_started"
  | "support_session_ended"
  | "support_action"
  | "support_blocked"
  | "account_deleted"
  | "account_payments_archived"
  | "role_changed";

export type FunnelEventInput = {
  event: FunnelEventName;
  level?: "info" | "error";
  userId?: string | null;
  weddingId?: string | null;
  path?: string | null;
  detail?: Record<string, unknown>;
};

const MAX_KEYS = 30;
const MAX_STRING = 500;

/** Mantém `detail` pequeno e serializável (strings cortadas, sem objetos profundos). */
function sanitize(detail: Record<string, unknown> | undefined): Json {
  const out: Record<string, Json> = {};
  if (!detail) return out;
  for (const [key, value] of Object.entries(detail).slice(0, MAX_KEYS)) {
    if (value === undefined) continue;
    if (value === null || typeof value === "number" || typeof value === "boolean") out[key] = value;
    else if (typeof value === "string") out[key] = value.slice(0, MAX_STRING);
    else out[key] = JSON.stringify(value).slice(0, MAX_STRING);
  }
  return out;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return String(error);
}

/** Grava um evento do funil. Aguarde quando a resposta pode esperar ~50ms; senão use `recordFunnelEventAfter`. */
export async function recordFunnelEvent(input: FunnelEventInput): Promise<void> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    const { error } = await createAdminClient()
      .from("funnel_events")
      .insert({
        event: input.event,
        level: input.level ?? "info",
        user_id: input.userId ?? null,
        wedding_id: input.weddingId ?? null,
        path: input.path ? input.path.slice(0, 300) : null,
        detail: sanitize(input.detail)
      });
    if (error) {
      console.error(JSON.stringify({ at: "funnel_events.insert", event: input.event, error: error.message, code: error.code }));
    }
  } catch (err) {
    console.error(JSON.stringify({ at: "funnel_events.insert", event: input.event, error: errorMessage(err) }));
  }
}

/** Grava depois que a resposta sai (não atrasa a ação). Só dentro de request/action. */
export function recordFunnelEventAfter(input: FunnelEventInput): void {
  after(() => recordFunnelEvent(input));
}

/**
 * Falha de ação/rota: console estruturado (Vercel) + evento `level: error` persistido.
 * Use no lugar de engolir erros ou só devolver mensagem para a tela.
 */
export async function logServerError(
  scope: string,
  error: unknown,
  ctx: Omit<FunnelEventInput, "level" | "event"> & { event?: FunnelEventName } = {}
): Promise<void> {
  const message = errorMessage(error);
  const code = error && typeof error === "object" && "code" in error ? String((error as { code: unknown }).code) : undefined;
  console.error(
    JSON.stringify({ level: "error", scope, message, code, userId: ctx.userId, weddingId: ctx.weddingId, path: ctx.path })
  );
  await recordFunnelEvent({
    event: ctx.event ?? "action_failed",
    level: "error",
    userId: ctx.userId,
    weddingId: ctx.weddingId,
    path: ctx.path,
    detail: { ...ctx.detail, scope, message, code }
  });
}
