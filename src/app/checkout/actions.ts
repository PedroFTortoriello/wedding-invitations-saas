"use server";

import { revalidatePath } from "next/cache";
import { getActingContext, guardSupportWrite } from "@/lib/acting";
import { logServerError } from "@/lib/funnel";

/**
 * Marca um presente Pix como recebido. O Pix vai direto pra chave do casal (sem
 * PSP), então a confirmação é manual. A RLS de cash_gifts (owns_wedding) garante
 * que só o dono do casamento atualiza seus presentes (o filtro por wedding_id repete
 * isso fora da RLS). Presentes no cartão ficam de fora: quem confirma é o webhook do
 * Mercado Pago (e o banco barra — 0010). Bloqueado no modo suporte.
 */
export async function markGiftReceivedAction(formData: FormData) {
  const ctx = await getActingContext();
  const giftId = String(formData.get("giftId") ?? "");
  if (!giftId) return;

  const supabase = ctx.db;
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("owner_id", ctx.ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!wedding) return;
  if (!(await guardSupportWrite(ctx, "cash_gift_mark_received", wedding.id)).ok) return;

  const { error } = await supabase
    .from("cash_gifts")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", giftId)
    .eq("wedding_id", wedding.id)
    .eq("status", "pending")
    .eq("payment_method", "pix");
  if (error) {
    await logServerError("checkout.markGiftReceived", error, {
      userId: ctx.ownerId,
      path: "/checkout",
      detail: { giftId }
    });
  }

  revalidatePath("/checkout");
  revalidatePath("/presentes");
  revalidatePath("/dashboard");
}
