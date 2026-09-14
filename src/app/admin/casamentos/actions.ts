"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Libera a publicação de um site cortesia (sem a taxa): normalmente `publish_paid_at`
 * é gravado só pelo webhook da AbacatePay e o próprio casal aperta "Publicar". Aqui,
 * atrás de requireAdmin() e via service-role, o admin dispensa a taxa E coloca o site
 * no ar de uma vez. Preserva um `publish_paid_at` real já existente (não sobrescreve
 * o carimbo de um pagamento verdadeiro), só o preenche quando está em aberto.
 */
export async function releasePublicationAction(formData: FormData) {
  await requireAdmin();
  const weddingId = String(formData.get("weddingId") ?? "");
  if (!weddingId) return;

  const supabase = createAdminClient();

  const { data: wedding } = await supabase
    .from("weddings")
    .select("publish_paid_at")
    .eq("id", weddingId)
    .maybeSingle();
  if (!wedding) return;

  await supabase
    .from("weddings")
    .update({
      status: "published",
      publish_paid_at: wedding.publish_paid_at ?? new Date().toISOString()
    })
    .eq("id", weddingId);

  revalidatePath("/admin/casamentos");
}
