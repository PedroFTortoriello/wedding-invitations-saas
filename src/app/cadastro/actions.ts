"use server";

import { cookies } from "next/headers";
import { after } from "next/server";
import { getActingContext } from "@/lib/acting";
import { logServerError, recordFunnelEvent, recordFunnelEventAfter } from "@/lib/funnel";
import { getTrackingContext, sendMetaServerEvent } from "@/lib/meta-capi";
import { isTemplateId } from "@/lib/wedding";
import { createWeddingForUser, DEFAULT_TEMPLATE } from "@/lib/wedding-create";

export type CompleteSignupResult = { weddingCreated: boolean; alreadyExisted?: boolean; template?: string };

/** Só conta como cadastro (funil + Conversions API) a conta criada há menos que isto. */
const SIGNUP_WINDOW_MS = 60 * 60_000;

/** Braço do teste A/B do CTA fixo da landing ("on" | "off"); não identifica ninguém. */
const STICKY_AB_COOKIE = "noivar_ab_sticky";

/**
 * Fecha o cadastro: marco do funil (com a campanha de origem), Conversions
 * API e o casamento inicial no modelo escolhido na landing (ou o padrão), para o
 * casal cair direto no editor.
 *
 * Chamada de /onboarding?cadastro=<eventId>, não de /cadastro: com sessão, o
 * middleware redireciona toda request de /cadastro para /dashboard — inclusive o
 * POST da server action, que quebraria. Nunca lança: falhar aqui só leva ao formulário.
 */
export async function completeSignupAction(input: { eventId: string }): Promise<CompleteSignupResult> {
  const acting = await getActingContext(); // fora do try: o redirect do Next não pode ser engolido
  // Modo suporte: o admin nunca fecha cadastro nem cria casamento pelo cliente.
  if (acting.support) return { weddingCreated: false };
  const user = acting.sessionUser;
  try {
    // O perfil já foi garantido pelo /onboarding (ensureProfile a cada render).
    const supabase = acting.db;
    const [ctx, cookieStore] = await Promise.all([getTrackingContext(), cookies()]);
    const eventId = String(input?.eventId ?? "").slice(0, 100);

    const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
    const coupleNames = profile?.name?.trim() || String(user.user_metadata?.name ?? "").trim();
    // user_metadata vem do navegador (signUp): id inválido cai no padrão em vez de falhar.
    const metaTemplate = String(user.user_metadata?.template ?? "");
    const templateId = isTemplateId(metaTemplate) ? metaTemplate : undefined;
    const template = templateId ?? DEFAULT_TEMPLATE;

    const result = await createWeddingForUser(supabase, user.id, { coupleNames, templateId });

    // Um cadastro por conta: recarregar ?cadastro= ou chamar a action de novo (com
    // outro eventId) não gera outro marco nem CompleteRegistration falso na Meta.
    const isNewSignup =
      Date.now() - Date.parse(user.created_at) < SIGNUP_WINDOW_MS && !(result.ok && result.alreadyExisted);
    if (isNewSignup) {
      // Sem consentimento, só a campanha (utm): nada de página de entrada, origem ou fbclid/gclid.
      const attribution = ctx.consent
        ? ctx.attribution
        : {
            utm_source: ctx.attribution?.utm_source,
            utm_medium: ctx.attribution?.utm_medium,
            utm_campaign: ctx.attribution?.utm_campaign
          };
      const sticky = cookieStore.get(STICKY_AB_COOKIE)?.value;
      await recordFunnelEvent({
        event: "signup_completed",
        userId: user.id,
        path: "/cadastro",
        // undefined some no detail (sanitize do funil).
        detail: { ...attribution, consent: ctx.consent, template, sticky: sticky === "on" || sticky === "off" ? sticky : undefined }
      });
      if (eventId) {
        // Não segura a navegação: a Conversions API espera até ~3s.
        after(() => sendMetaServerEvent({ event: "sign_up", eventId, userId: user.id, email: user.email, context: ctx }));
      }
    }

    if (result.ok) {
      if (!result.alreadyExisted) {
        recordFunnelEventAfter({
          event: "wedding_created",
          userId: user.id,
          weddingId: result.weddingId,
          path: "/onboarding",
          detail: { source: "signup", template }
        });
      }
      return { weddingCreated: true, alreadyExisted: result.alreadyExisted, template };
    }

    // Validação (ex.: sem nome) não é erro: o casal completa no formulário.
    if (result.reason === "db_error") {
      await logServerError("signup.createWedding", result.error, {
        event: "wedding_create_failed",
        userId: user.id,
        path: "/onboarding"
      });
    }
    return { weddingCreated: false };
  } catch (error) {
    await logServerError("signup.complete", error, { userId: user.id, path: "/onboarding" });
    return { weddingCreated: false };
  }
}

/**
 * Falha do supabase.auth.signUp no navegador (não passa pelo servidor sem isto).
 * Só aceita o código do Supabase Auth (snake_case): texto livre poderia trazer dados pessoais.
 */
// ponytail: insert sem autenticação (qualquer um pode chamar); teto de abuso = linhas
// em funnel_events. Se for spammado, rate limit por IP aqui.
export async function reportSignupFailureAction(code: string): Promise<void> {
  const clean = /^[a-z0-9_]{1,64}$/.test(String(code)) ? code : "unknown";
  await logServerError("signup", new Error(clean), { event: "signup_failed", path: "/cadastro" });
}
