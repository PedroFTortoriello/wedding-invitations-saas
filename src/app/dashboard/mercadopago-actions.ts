"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnedWeddingRow } from "@/lib/wedding-server";

/**
 * Ajustes da conexão Mercado Pago do casal. mp_connections é service-role (RLS sem
 * policy), então usamos o admin client — sempre depois de getOwnedWeddingRow(), que
 * prova a posse do casamento pela sessão.
 */

/** Quem paga a taxa do cartão: 'guest' (padrão, casal recebe 100%) ou 'couple'. */
export async function setCardFeePayerAction(formData: FormData) {
  const row = await getOwnedWeddingRow();
  if (!row) return;

  const feePayer = formData.get("feePayer") === "couple" ? "couple" : "guest";
  await createAdminClient().from("mp_connections").update({ fee_payer: feePayer }).eq("wedding_id", row.id);

  revalidatePath("/dashboard");
  revalidatePath(`/casamento/${row.slug}`);
}

/** Desconecta e APAGA a linha — o token sai do banco junto. O Pix continua ativo. */
export async function disconnectMercadoPagoAction() {
  const row = await getOwnedWeddingRow();
  if (!row) return;

  await createAdminClient().from("mp_connections").delete().eq("wedding_id", row.id);

  revalidatePath("/dashboard");
  revalidatePath(`/casamento/${row.slug}`);
}
