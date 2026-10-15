"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getActingContext, guardSupportWrite } from "@/lib/acting";
import { logServerError } from "@/lib/funnel";
import { getOwnedWeddingRow } from "@/lib/wedding-server";

/** Casamento do dono + trava do modo suporte (link público da cerimonialista é bloqueado). */
async function ownedWeddingForCoordinator() {
  const ctx = await getActingContext();
  const row = await getOwnedWeddingRow(ctx);
  if (!row || !(await guardSupportWrite(ctx, "coordinator_link", row.id)).ok) return null;
  return { ctx, row };
}

/** Gera (ou renova) o token do link só-leitura da cerimonialista. */
export async function generateCoordinatorLinkAction() {
  const owned = await ownedWeddingForCoordinator();
  if (!owned) return;
  const { ctx, row } = owned;
  // RLS (weddings_update_own) garante que o casal só altera o próprio casamento.
  const { error } = await ctx.db
    .from("weddings")
    .update({ coordinator_token: randomBytes(18).toString("base64url") })
    .eq("id", row.id);
  if (error) {
    await logServerError("coordinator.generate", error, { userId: ctx.ownerId, weddingId: row.id, path: "/dashboard" });
  }
  revalidatePath("/dashboard");
}

/** Desativa o acesso da cerimonialista (invalida o link atual). */
export async function revokeCoordinatorLinkAction() {
  const owned = await ownedWeddingForCoordinator();
  if (!owned) return;
  const { ctx, row } = owned;
  const { error } = await ctx.db.from("weddings").update({ coordinator_token: null }).eq("id", row.id);
  if (error) {
    await logServerError("coordinator.revoke", error, { userId: ctx.ownerId, weddingId: row.id, path: "/dashboard" });
  }
  revalidatePath("/dashboard");
}
