"use server";

import { getActingContext, guardSupportWrite } from "@/lib/acting";
import { logServerError } from "@/lib/funnel";

export type SaveWhatsappResult = { ok?: boolean; error?: string };

/**
 * Telefone brasileiro → E.164 só com dígitos (55 + DDD + número), ou null.
 * Aceita 10–11 dígitos locais (DDD + fixo/celular) ou os mesmos com o 55 na frente;
 * pontuação, espaços e "+" são ignorados.
 */
function toBrazilE164(input: string): string | null {
  let digits = input.slice(0, 40).replace(/\D/g, "");
  if (digits.length === 12 || digits.length === 13) {
    if (!digits.startsWith("55")) return null;
    digits = digits.slice(2);
  }
  // DDD sem zero; celular com 9 dígitos começando em 9, fixo com 8 começando em 2–8.
  return /^[1-9]{2}(9\d{8}|[2-8]\d{7})$/.test(digits) ? `55${digits}` : null;
}

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
