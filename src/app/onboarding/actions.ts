"use server";

import { redirect } from "next/navigation";
import { getActingContext, guardSupportWrite } from "@/lib/acting";
import { logServerError, recordFunnelEvent, recordFunnelEventAfter } from "@/lib/funnel";
import { isTemplateId } from "@/lib/wedding";
import { createWeddingForUser, DEFAULT_TEMPLATE } from "@/lib/wedding-create";

export type CreateWeddingState = { error?: string };
export type StarterWeddingResult = { ok: boolean; alreadyExisted?: boolean; message?: string; template?: string };

/**
 * Cria o casamento sem formulário (conta sem casamento): nome do perfil + modelo
 * escolhido no cadastro (user_metadata.template) ou o padrão.
 */
export async function createStarterWeddingAction(): Promise<StarterWeddingResult> {
  const ctx = await getActingContext(); // fora do try: o redirect do Next não pode ser engolido
  const guard = await guardSupportWrite(ctx, "wedding_create");
  if (!guard.ok) return { ok: false, message: guard.message };
  const user = ctx.sessionUser; // modo normal: o próprio dono
  try {
    const supabase = ctx.db;
    const { data: profile } = await supabase.from("profiles").select("name").eq("id", ctx.ownerId).maybeSingle();
    const coupleNames = profile?.name?.trim() || String(user.user_metadata?.name ?? "").trim();
    // user_metadata vem do navegador (signUp): id inválido cai no padrão em vez de falhar.
    const metaTemplate = String(user.user_metadata?.template ?? "");
    const templateId = isTemplateId(metaTemplate) ? metaTemplate : undefined;
    const template = templateId ?? DEFAULT_TEMPLATE;

    const result = await createWeddingForUser(supabase, ctx.ownerId, { coupleNames, templateId });
    if (result.ok) {
      if (!result.alreadyExisted) {
        recordFunnelEventAfter({
          event: "wedding_created",
          userId: ctx.ownerId,
          weddingId: result.weddingId,
          path: "/onboarding",
          detail: { source: "onboarding_auto", template }
        });
      }
      return { ok: true, alreadyExisted: result.alreadyExisted, template };
    }

    if (result.reason === "db_error") {
      await logServerError("onboarding.autoCreate", result.error, {
        event: "wedding_create_failed",
        userId: ctx.ownerId,
        path: "/onboarding"
      });
    }
    return { ok: false, message: result.message };
  } catch (error) {
    await logServerError("onboarding.autoCreate", error, { event: "wedding_create_failed", userId: ctx.ownerId, path: "/onboarding" });
    return { ok: false };
  }
}

export async function createWeddingAction(
  _prev: CreateWeddingState,
  formData: FormData
): Promise<CreateWeddingState> {
  const ctx = await getActingContext();
  const guard = await guardSupportWrite(ctx, "wedding_create");
  if (!guard.ok) return { error: guard.message };
  const supabase = ctx.db;
  const field = (name: string) => String(formData.get(name) ?? "");
  const templateId = field("templateId") || DEFAULT_TEMPLATE;

  const result = await createWeddingForUser(supabase, ctx.ownerId, {
    coupleNames: field("coupleNames"),
    slug: field("slug"),
    templateId,
    weddingDate: field("weddingDate"),
    weddingTime: field("weddingTime"),
    city: field("city"),
    venue: field("venue")
  });

  if (!result.ok) {
    if (result.reason === "db_error") {
      await logServerError("onboarding.createWedding", result.error, {
        event: "wedding_create_failed",
        userId: ctx.ownerId,
        path: "/onboarding"
      });
    }
    return { error: result.message };
  }

  if (!result.alreadyExisted) {
    // Aguardado: o redirect renderiza o /editor na mesma resposta, e o editor_opened
    // de lá não pode ficar antes do wedding_created na jornada.
    await recordFunnelEvent({
      event: "wedding_created",
      userId: ctx.ownerId,
      weddingId: result.weddingId,
      path: "/onboarding",
      detail: { source: "form", template: templateId }
    });
  }
  // Fora de try/catch: redirect() lança de propósito.
  redirect("/editor?bemvindo=1");
}
