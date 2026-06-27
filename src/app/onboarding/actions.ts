"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidSlug, slugify } from "@/lib/slug";
import { contentToJson, defaultWeddingContent, isTemplateId } from "@/lib/wedding";

export type CreateWeddingState = { error?: string };

/** Monta data ISO (-03:00) e rótulo pt-BR a partir do <input type=date/time>. */
function buildDate(date: string, time: string): { iso?: string; label?: string } {
  if (!date) return {};
  const parsed = new Date(`${date}T${time || "16:00"}:00-03:00`);
  if (Number.isNaN(parsed.getTime())) return {};
  return {
    iso: parsed.toISOString(),
    label: parsed.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
  };
}

export async function createWeddingAction(
  _prev: CreateWeddingState,
  formData: FormData
): Promise<CreateWeddingState> {
  const user = await requireUser();
  const supabase = await createClient();

  const coupleNames = String(formData.get("coupleNames") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "classico-romantico");
  const weddingDate = String(formData.get("weddingDate") ?? "").trim();
  const weddingTime = String(formData.get("weddingTime") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();

  if (coupleNames.length < 3) return { error: "Informe o nome do casal." };
  if (!isTemplateId(templateId)) return { error: "Modelo inválido." };

  const slug = slugInput ? slugify(slugInput) : slugify(coupleNames);
  if (!isValidSlug(slug)) {
    return { error: "Escolha uma URL válida (letras, números e hífens, sem acento)." };
  }

  const { iso, label } = buildDate(weddingDate, weddingTime);
  const content = defaultWeddingContent({
    coupleNames,
    templateId,
    weddingDate: iso,
    weddingDateLabel: label,
    weddingTime: weddingTime || undefined,
    city: city || undefined,
    venue: venue || undefined
  });
  const payloadContent = contentToJson(content);

  // Slug é único globalmente; outro draft com o mesmo slug pode ser invisível por
  // RLS, então tentamos inserir e, em colisão (23505), acrescentamos sufixo.
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
    const { error } = await supabase.from("weddings").insert({
      owner_id: user.id,
      slug: candidate,
      couple_names: coupleNames,
      status: "draft",
      content: payloadContent
    });

    if (!error) {
      redirect("/editor");
    }
    if (error.code !== "23505") {
      return { error: "Não foi possível criar o casamento. Tente novamente." };
    }
  }

  return { error: "Essa URL já está em uso. Tente outra." };
}
