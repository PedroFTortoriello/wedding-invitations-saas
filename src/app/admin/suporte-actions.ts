"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { recordFunnelEvent } from "@/lib/funnel";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearSupportCookie, isUuid, readSupportCookie, setSupportCookie, type SupportPayload } from "@/lib/support-session";

/**
 * "Ver conta" (modo suporte): o admin passa a ver e editar o painel de um cliente com a
 * própria sessão. Só para contas de cliente (nunca outro admin nem a própria conta).
 * Toda abertura e saída fica em funnel_events (user_id = cliente, detail.adminId e
 * detail.targetUserId — este sobrevive se a conta for apagada e user_id virar null).
 */
export async function startSupportSessionAction(formData: FormData) {
  const admin = await requireAdmin();
  const targetUserId = String(formData.get("userId") ?? "");
  if (!isUuid(targetUserId) || targetUserId === admin.id) redirect("/admin/usuarios");

  const { data: target } = await createAdminClient()
    .from("profiles")
    .select("id, role")
    .eq("id", targetUserId)
    .maybeSingle();
  if (!target || target.role === "admin") redirect("/admin/usuarios");

  // Trocar de conta com uma sessão aberta encerra a anterior (e registra).
  const previous = await readSupportCookie();
  if (previous && previous.targetUserId !== target.id) await recordEnded(previous);

  await setSupportCookie(admin.id, target.id);
  await recordFunnelEvent({
    event: "support_session_started",
    userId: target.id,
    path: "/admin/usuarios",
    detail: { adminId: admin.id, targetUserId: target.id }
  });
  redirect("/dashboard");
}

/** "Voltar ao admin": encerra a sessão de suporte e volta para a jornada do cliente. */
export async function endSupportSessionAction() {
  const current = await endSupport();
  redirect(current ? `/admin/usuarios?usuario=${current.targetUserId}` : "/admin/usuarios");
}

/** Chamado pelo "Sair": sem isso o mesmo admin voltaria ao modo suporte ao logar de novo. */
export async function endSupportOnSignOutAction() {
  await endSupport();
}

async function endSupport() {
  const current = await readSupportCookie();
  await clearSupportCookie();
  if (current) await recordEnded(current);
  return current;
}

function recordEnded(session: SupportPayload) {
  return recordFunnelEvent({
    event: "support_session_ended",
    userId: session.targetUserId,
    detail: { adminId: session.adminId, targetUserId: session.targetUserId }
  });
}
