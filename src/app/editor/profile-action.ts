"use server";

import { getActingContext, guardSupportWrite } from "@/lib/acting";
import { logServerError } from "@/lib/funnel";
import { toBrazilE164 } from "@/lib/phone";

export type SaveWhatsappResult = { ok?: boolean; error?: string };

/**
 * Salva o WhatsApp opcional na CONTA (profiles.whatsapp, migration 0012) — nunca no
 * conteúdo do site. RLS profiles_update_self limita ao próprio perfil. Privacidade:
 * o número não vai para funnel_events (o log de erro leva só mensagem e código).
 */
export async function saveWhatsappAction(input: string): Promise<SaveWhatsappResult> {
  const ctx = await getActingContext();
  const guard = await guardSupportWrite(ctx, "profile_whatsapp");
  if (!guard.ok) return { error: guard.message };

  const whatsapp = toBrazilE164(String(input ?? ""));
  if (!whatsapp) {
    return { error: "Confira o número: DDD + telefone, como (11) 91234-5678." };
  }

  const { data, error } = await ctx.db.from("profiles").update({ whatsapp }).eq("id", ctx.ownerId).select("id");
  // Sem a migration 0012 aplicada a coluna não existe: cai aqui, com log e mensagem amigável.
  if (error || !data?.length) {
    await logServerError("editor.whatsapp", error ?? new Error("Perfil não encontrado."), {
      userId: ctx.ownerId,
      path: "/editor"
    });
    return { error: "Não foi possível salvar o número agora. Tente de novo mais tarde." };
  }
  return { ok: true };
}
