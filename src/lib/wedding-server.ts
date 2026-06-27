import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { WEDDING_RENDER_COLUMNS, type WeddingRenderRow, type WeddingRow } from "@/lib/wedding";

/**
 * Linha `weddings` do usuário logado, ou null se ele ainda não criou um.
 * Redireciona a /login quando não há sessão (via requireUser).
 * MVP: um casamento por usuário.
 */
export async function getOwnedWeddingRow(): Promise<WeddingRow | null> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/**
 * Casamento por slug para o site público. RLS devolve sites publicados a
 * qualquer visitante e o próprio rascunho ao dono (prévia). Seleciona só as
 * colunas de renderização — nunca o documento Pix (PII server-only).
 */
export async function getWeddingBySlug(slug: string): Promise<WeddingRenderRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weddings")
    .select(WEDDING_RENDER_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}
