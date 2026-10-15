"use server";

import { revalidatePath } from "next/cache";
import { getActingContext, guardSupportWrite } from "@/lib/acting";
import { logServerError } from "@/lib/funnel";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnedWeddingRow } from "@/lib/wedding-server";

/**
 * Ajustes da conexão Mercado Pago do casal. mp_connections é service-role (RLS sem
 * policy), então usamos o admin client — sempre depois de getOwnedWeddingRow(), que
 * prova a posse do casamento pela sessão (ou pelo modo suporte). Dinheiro: bloqueado no modo suporte.
 */
async function ownedWeddingForMercadoPago() {
  const ctx = await getActingContext();
  const row = await getOwnedWeddingRow(ctx);
  if (!row || !(await guardSupportWrite(ctx, "mercadopago", row.id)).ok) return null;
  return { ownerId: ctx.ownerId, row };
}

/** Quem paga a taxa do cartão: 'guest' (padrão, casal recebe 100%) ou 'couple'. */
export async function setCardFeePayerAction(formData: FormData) {
  const owned = await ownedWeddingForMercadoPago();
  if (!owned) return;
  const { ownerId, row } = owned;

  const feePayer = formData.get("feePayer") === "couple" ? "couple" : "guest";
  const { error } = await createAdminClient()
    .from("mp_connections")
    .update({ fee_payer: feePayer })
    .eq("wedding_id", row.id);
  if (error) {
    await logServerError("mercadopago.setFeePayer", error, { userId: ownerId, weddingId: row.id, path: "/dashboard" });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/casamento/${row.slug}`);
}

/** Desconecta e APAGA a linha — o token sai do banco junto. O Pix continua ativo. */
export async function disconnectMercadoPagoAction() {
  const owned = await ownedWeddingForMercadoPago();
  if (!owned) return;
  const { ownerId, row } = owned;

  const { error } = await createAdminClient().from("mp_connections").delete().eq("wedding_id", row.id);
  if (error) {
    await logServerError("mercadopago.disconnect", error, { userId: ownerId, weddingId: row.id, path: "/dashboard" });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/casamento/${row.slug}`);
}
