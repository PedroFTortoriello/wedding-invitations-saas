"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnedWeddingRow } from "@/lib/wedding-server";

/** Gera (ou renova) o token do link só-leitura da cerimonialista. */
export async function generateCoordinatorLinkAction() {
  const row = await getOwnedWeddingRow();
  if (!row) return;
  const supabase = await createClient();
  // RLS (weddings_update_own) garante que o casal só altera o próprio casamento.
  await supabase
    .from("weddings")
    .update({ coordinator_token: randomBytes(18).toString("base64url") })
    .eq("id", row.id);
  revalidatePath("/dashboard");
}

/** Desativa o acesso da cerimonialista (invalida o link atual). */
export async function revokeCoordinatorLinkAction() {
  const row = await getOwnedWeddingRow();
  if (!row) return;
  const supabase = await createClient();
  await supabase.from("weddings").update({ coordinator_token: null }).eq("id", row.id);
  revalidatePath("/dashboard");
}
