import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { WeddingRow } from "@/lib/wedding";

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
