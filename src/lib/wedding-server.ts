import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { WEDDING_RENDER_COLUMNS, type WeddingRenderRow, type WeddingRow } from "@/lib/wedding";
import type { WeddingSiteStatus } from "@/types/wedding";

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
    .order("created_at", { ascending: true })
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

/**
 * A RLS esconde rascunhos do visitante, então getWeddingBySlug devolve null tanto
 * para rascunho quanto para slug inexistente. Aqui, via admin (fora da RLS),
 * distinguimos: {status, coupleNames} se o slug existe, senão null. Chamado só no
 * ramo 404 da rota pública — nunca no caminho feliz.
 */
export async function getWeddingStatusBySlug(
  slug: string
): Promise<{ status: WeddingSiteStatus; coupleNames: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("weddings")
    .select("status, couple_names")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  return { status: data.status as WeddingSiteStatus, coupleNames: data.couple_names ?? "" };
}
