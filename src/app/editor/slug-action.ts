"use server";

import { revalidatePath } from "next/cache";
import { getActingContext, guardSupportWrite } from "@/lib/acting";
import { logServerError } from "@/lib/funnel";
import { isValidSlug, slugify } from "@/lib/slug";

export type UpdateSlugResult = { ok?: boolean; slug?: string; error?: string };

/**
 * Muda o endereço público (/casamento/[slug]) do casamento do dono. Fora do
 * auto-save de propósito: o slug é único, quebra links antigos e precisa de
 * validação/feedback explícitos — não é um patch de conteúdo silencioso.
 *
 * RLS (weddings_update_own) permite o dono atualizar a própria linha, e o trigger
 * guard_wedding_publish (0005) só congela publish_paid_at/status — não o slug. A
 * unicidade é garantida pelo índice único da coluna: colisão volta 23505.
 */
export async function updateSlugAction(input: string): Promise<UpdateSlugResult> {
  const ctx = await getActingContext();
  const supabase = ctx.db;

  const { data: row, error: loadError } = await supabase
    .from("weddings")
    .select("id, slug")
    .eq("owner_id", ctx.ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!row) {
    if (loadError) await logServerError("editor.slug.load", loadError, { userId: ctx.ownerId, path: "/editor" });
    return { error: "Casamento não encontrado." };
  }

  const guard = await guardSupportWrite(ctx, "slug_change", row.id);
  if (!guard.ok) return { error: guard.message };

  const slug = slugify(String(input ?? ""));
  if (!isValidSlug(slug)) {
    return {
      error: "Escolha uma URL válida: letras, números e hífens, sem acento (3 a 60 caracteres)."
    };
  }
  if (slug === row.slug) return { ok: true, slug };

  const { error } = await supabase.from("weddings").update({ slug }).eq("id", row.id);
  if (error) {
    if (error.code === "23505") return { error: "Essa URL já está em uso. Tente outra." };
    await logServerError("editor.slug", error, { userId: ctx.ownerId, weddingId: row.id, path: "/editor" });
    return { error: "Não foi possível salvar a URL. Tente novamente." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/editor");
  revalidatePath(`/casamento/${row.slug}`); // endereço antigo passa a 404
  revalidatePath(`/casamento/${slug}`); // novo endereço
  return { ok: true, slug };
}
