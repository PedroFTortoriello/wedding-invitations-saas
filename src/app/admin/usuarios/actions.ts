"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/supabase/types";

// Promove/rebaixa um usuário. RLS impede o cliente de tocar em `role` (0007),
// então usamos o service-role — sempre atrás de requireAdmin().
export async function setUserRoleAction(formData: FormData) {
  const me = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!userId || (role !== "admin" && role !== "client")) return;
  if (userId === me.id) return; // não altera o próprio papel (evita se trancar fora)

  const supabase = createAdminClient();
  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/admin/usuarios");
}
