import type { createClient } from "@/lib/supabase/server";
import { isValidSlug, slugify } from "@/lib/slug";
import { contentToJson, defaultWeddingContent, isTemplateId } from "@/lib/wedding";
import type { WeddingSite } from "@/types/wedding";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export type CreateWeddingInput = {
  coupleNames: string;
  /** Vazio: gerado a partir dos nomes. */
  slug?: string;
  templateId?: string;
  /** "YYYY-MM-DD" (input type=date). */
  weddingDate?: string;
  /** "HH:MM" (input type=time). */
  weddingTime?: string;
  city?: string;
  venue?: string;
};

export type CreateWeddingResult =
  | { ok: true; weddingId: string; slug: string; alreadyExisted: boolean }
  | {
      ok: false;
      reason: "invalid_names" | "invalid_template" | "invalid_slug" | "slug_taken" | "db_error";
      /** Mensagem para a tela, em pt-BR. */
      message: string;
      /** Erro original (para log), quando houver. */
      error?: unknown;
    };

// ponytail: volta a classico-romantico depois que os bugs mobile do Clássico forem corrigidos
export const DEFAULT_TEMPLATE: WeddingSite["templateId"] = "jardim-romantico";

/** Monta data ISO (-03:00) e rótulo pt-BR a partir do <input type=date/time>. */
export function buildDate(date: string, time: string): { iso?: string; label?: string } {
  if (!date) return {};
  const parsed = new Date(`${date}T${time || "16:00"}:00-03:00`);
  if (Number.isNaN(parsed.getTime())) return {};
  return {
    iso: parsed.toISOString(),
    label: parsed.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })
  };
}

async function existingWedding(supabase: ServerSupabase, ownerId: string) {
  const { data } = await supabase
    .from("weddings")
    .select("id, slug")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

/**
 * Cria o casamento (rascunho) do usuário logado, um por conta. Idempotente: se já
 * existir, devolve o existente com `alreadyExisted`. O slug é único globalmente e
 * outro rascunho com o mesmo slug pode estar invisível por RLS, então tentamos
 * inserir e, em colisão (23505), acrescentamos sufixo. Com a migration 0011, o
 * índice único de owner_id também barra corrida (duas abas/dois cliques).
 */
export async function createWeddingForUser(
  supabase: ServerSupabase,
  ownerId: string,
  input: CreateWeddingInput
): Promise<CreateWeddingResult> {
  const existing = await existingWedding(supabase, ownerId);
  if (existing) return { ok: true, weddingId: existing.id, slug: existing.slug, alreadyExisted: true };

  const coupleNames = input.coupleNames.trim();
  const templateId = input.templateId || DEFAULT_TEMPLATE;
  if (coupleNames.length < 3) return { ok: false, reason: "invalid_names", message: "Informe o nome do casal." };
  if (!isTemplateId(templateId)) return { ok: false, reason: "invalid_template", message: "Modelo inválido." };

  const explicitSlug = Boolean(input.slug?.trim());
  const slug = explicitSlug ? slugify(input.slug ?? "") : slugify(coupleNames);
  // Slug vindo do nome do casal que cai numa palavra reservada (ex.: "Helena & Lucas",
  // o casal da demo) começa no sufixo "-2" em vez de falhar a criação automática.
  const firstAttempt = !explicitSlug && !isValidSlug(slug) && isValidSlug(`${slug}-2`) ? 1 : 0;
  if (firstAttempt === 0 && !isValidSlug(slug)) {
    return { ok: false, reason: "invalid_slug", message: "Escolha uma URL válida (letras, números e hífens, sem acento)." };
  }

  const weddingTime = input.weddingTime?.trim() ?? "";
  const { iso, label } = buildDate(input.weddingDate?.trim() ?? "", weddingTime);
  const content = contentToJson(
    defaultWeddingContent({
      coupleNames,
      templateId,
      weddingDate: iso,
      weddingDateLabel: label,
      weddingTime: weddingTime || undefined,
      city: input.city?.trim() || undefined,
      venue: input.venue?.trim() || undefined
    })
  );

  for (let attempt = firstAttempt; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("weddings")
      .insert({ owner_id: ownerId, slug: candidate, couple_names: coupleNames, status: "draft", content })
      .select("id, slug")
      .single();

    if (!error && data) return { ok: true, weddingId: data.id, slug: data.slug, alreadyExisted: false };

    if (error?.code === "23505") {
      // Corrida: outra requisição criou o casamento desta conta (índice owner_id).
      if (error.message.includes("owner_id")) {
        const raced = await existingWedding(supabase, ownerId);
        if (raced) return { ok: true, weddingId: raced.id, slug: raced.slug, alreadyExisted: true };
      }
      continue; // slug em uso: tenta o próximo sufixo
    }

    return { ok: false, reason: "db_error", message: "Não foi possível criar o casamento. Tente novamente.", error };
  }

  return { ok: false, reason: "slug_taken", message: "Essa URL já está em uso. Tente outra." };
}
