"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Marca um presente em dinheiro como recebido. Não há PSP nos presentes (vão
 * direto pra chave do casal), então a confirmação é manual. A RLS de cash_gifts
 * (owns_wedding) garante que só o dono do casamento atualiza seus presentes.
 */
export async function markGiftReceivedAction(formData: FormData) {
  await requireUser();
  const giftId = String(formData.get("giftId") ?? "");
  if (!giftId) return;

  const supabase = await createClient();
  await supabase
    .from("cash_gifts")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", giftId)
    .eq("status", "pending");

  revalidatePath("/checkout");
  revalidatePath("/presentes");
  revalidatePath("/dashboard");
}
