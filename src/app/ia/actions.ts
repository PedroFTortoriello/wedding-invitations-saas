"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AI_MODEL,
  AiSiteError,
  applyAiDraft,
  generateAiDraft,
  type AiBriefing
} from "@/lib/ai-site";
import { getActingContext, guardSupportWrite } from "@/lib/acting";
import { claimAiAttempt } from "@/lib/ai-rate-limit";
import { logServerError, recordFunnelEvent } from "@/lib/funnel";
import { MAX_AI_GENERATIONS, MAX_AI_PHOTOS } from "@/lib/platform-data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { contentToJson, extractContent, isOwnerPhotoUrl, rowToWeddingSite } from "@/lib/wedding";
import { createWeddingForUser } from "@/lib/wedding-create";
import { getOwnedWeddingRow } from "@/lib/wedding-server";

export type AiGenerateState = { error?: string };

const PATH = "/ia";

/**
 * Monta o site com a IA a partir do briefing: chama o Claude, registra a geração (é ela
 * que muda o preço da publicação) e só então grava o conteúdo. Sem casamento ainda,
 * cria um com os dados do briefing.
 */
export async function generateAiSiteAction(_prev: AiGenerateState, formData: FormData): Promise<AiGenerateState> {
  const ctx = await getActingContext();
  const guard = await guardSupportWrite(ctx, "ai_generate");
  if (!guard.ok) return { error: guard.message };

  const field = (name: string, max = 2000) => String(formData.get(name) ?? "").trim().slice(0, max);
  const briefing: AiBriefing = {
    coupleNames: field("coupleNames", 120),
    weddingDate: field("weddingDate", 10),
    weddingTime: field("weddingTime", 5),
    venue: field("venue", 160),
    city: field("city", 120),
    address: field("address", 240),
    story: field("story", 4000),
    style: field("style", 600),
    schedule: field("schedule", 1500),
    extras: field("extras", 2000),
    // Só fotos do storage do próprio dono: a URL vai para a IA e para o site.
    photos: [...new Set(formData.getAll("photos").map(String))]
      .filter((url) => isOwnerPhotoUrl(url, ctx.ownerId))
      .slice(0, MAX_AI_PHOTOS)
  };
  if (briefing.coupleNames.length < 3) return { error: "Informe o nome do casal." };

  let row = await getOwnedWeddingRow(ctx);
  if (!row) {
    const created = await createWeddingForUser(ctx.db, ctx.ownerId, {
      coupleNames: briefing.coupleNames,
      weddingDate: briefing.weddingDate,
      weddingTime: briefing.weddingTime,
      city: briefing.city,
      venue: briefing.venue
    });
    if (!created.ok) return { error: created.message };
    row = await getOwnedWeddingRow(ctx);
    if (!row) return { error: "Não foi possível criar o casamento. Tente novamente." };
  }
  const weddingId = row.id;

  // Taxa padrão já paga: gerar agora publicaria um site com IA pelo preço padrão.
  if (row.publish_paid_at) {
    return { error: "Este site já foi publicado pela taxa padrão. Para a IA montar o site, fale com o suporte." };
  }

  const admin = createAdminClient();
  const { count, error: countError } = await admin
    .from("ai_generations")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", weddingId);
  if (countError) {
    await logServerError("ia.count", countError, { userId: ctx.ownerId, weddingId, path: PATH });
    return { error: "Não foi possível iniciar a IA. Tente novamente." };
  }
  if ((count ?? 0) >= MAX_AI_GENERATIONS) {
    return { error: `Vocês já usaram as ${MAX_AI_GENERATIONS} gerações. Ajustem o site no editor.` };
  }

  // Por IP e por dia (migration 0017): conta a tentativa antes da IA, porque falha também custa.
  const claim = await claimAiAttempt(admin, ctx.ownerId);
  if (claim === "ip") {
    return {
      error:
        "Muitas gerações foram pedidas desta rede nas últimas 24 horas (contando as que falharam). Tentem mais tarde, em outra rede, ou ajustem o site no editor."
    };
  }
  if (claim === "daily") {
    return { error: "A IA chegou ao limite de gerações das últimas 24 horas. Tentem mais tarde ou montem o site no editor." };
  }

  let result: Awaited<ReturnType<typeof generateAiDraft>>;
  try {
    result = await generateAiDraft(briefing);
  } catch (error) {
    await logServerError("ia.generate", error, { userId: ctx.ownerId, weddingId, path: PATH });
    return { error: error instanceof AiSiteError ? error.message : "A IA não respondeu agora. Tente de novo em instantes." };
  }

  // Registra antes de gravar: sem este registro o site da IA sairia pela taxa padrão.
  const { error: insertError } = await admin.from("ai_generations").insert({
    wedding_id: weddingId,
    model: AI_MODEL,
    briefing: briefing as unknown as Json,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens
  });
  if (insertError) {
    await logServerError("ia.record", insertError, { userId: ctx.ownerId, weddingId, path: PATH });
    return { error: "Não foi possível salvar o site gerado. Tente novamente." };
  }

  const content = applyAiDraft(extractContent(rowToWeddingSite(row)), result.draft, briefing);
  const { error: updateError } = await ctx.db
    .from("weddings")
    .update({ couple_names: briefing.coupleNames, content: contentToJson(content) })
    .eq("id", weddingId);
  if (updateError) {
    await logServerError("ia.save", updateError, { userId: ctx.ownerId, weddingId, path: PATH });
    return { error: "Não foi possível salvar o site gerado. Tente novamente." };
  }

  await recordFunnelEvent({
    event: "ai_site_generated",
    userId: ctx.ownerId,
    weddingId,
    path: PATH,
    detail: { template: content.templateId, photos: briefing.photos.length, attempt: (count ?? 0) + 1 }
  });
  revalidatePath("/dashboard");
  revalidatePath(`/casamento/${row.slug}`);
  redirect("/editor?bemvindo=ia");
}
