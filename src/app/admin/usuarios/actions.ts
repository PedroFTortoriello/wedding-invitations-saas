"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { accountActionBlock, chunk, emailConfirmationMatches } from "@/components/admin/account-deletion";
import { PHOTOS_BUCKET, fetchAll, loadDeletionImpact } from "@/components/admin/data";
import { requireAdmin } from "@/lib/auth";
import { logServerError, recordFunnelEvent } from "@/lib/funnel";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/supabase/types";
import { clearSupportCookie, isUuid, readSupportCookie } from "@/lib/support-session";

// Promove/rebaixa um usuário. RLS impede o cliente de tocar em `role` (0007),
// então usamos o service-role — sempre atrás de requireAdmin().
export async function setUserRoleAction(formData: FormData) {
  const me = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!userId || (role !== "admin" && role !== "client")) return;
  if (userId === me.id) return; // não altera o próprio papel (evita se trancar fora)

  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (!error) {
    // Auditoria: rebaixar um admin libera "Ver conta" e "Apagar conta" para ele.
    await recordFunnelEvent({ event: "role_changed", userId, path: "/admin/usuarios", detail: { adminId: me.id, targetUserId: userId, role } });
  }
  revalidatePath("/admin/usuarios");
}

export type DeleteAccountState = { error?: string } | null;

/**
 * Apaga uma conta de CLIENTE e tudo dela. Só admin; nunca a própria conta nem outro admin
 * (conferido de novo aqui com service role, não no que a tela mostrou). Exige o e-mail da
 * conta digitado + a caixa "Entendi". Ordem: fotos do storage primeiro (o Auth recusa
 * apagar usuário dono de objetos), depois auth.admin.deleteUser, que cascateia
 * profiles → weddings → convidados/recados/presentes/pagamentos/Mercado Pago.
 * Pagamentos viram um ledger em funnel_events antes. A auditoria não leva e-mail, nomes,
 * slug nem telefone.
 */
export async function deleteAccountAction(_prev: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const me = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!isUuid(userId)) return { error: "Conta inválida." };
  if (userId === me.id) return { error: "Você não pode apagar a própria conta." };
  if (formData.get("understood") !== "on") return { error: "Marque “Entendi que não dá para desfazer” para continuar." };

  let impact;
  try {
    impact = await loadDeletionImpact(userId);
  } catch (error) {
    await logServerError("admin.delete_account.load", error, { path: "/admin/usuarios", detail: { adminId: me.id, targetUserId: userId } });
    return { error: "Não foi possível conferir a conta agora. Nada foi apagado; tente de novo." };
  }
  if (!impact) return { error: "Conta não encontrada. Ela pode já ter sido apagada." };

  const block = accountActionBlock({ adminId: me.id, targetId: userId, targetRole: impact.role });
  if (block === "admin") return { error: "Contas de administrador não podem ser apagadas." };
  if (block === "self") return { error: "Você não pode apagar a própria conta." };
  if (!emailConfirmationMatches(formData.get("email"), impact.email)) {
    return { error: "O e-mail digitado não confere com o da conta. Nada foi apagado." };
  }

  const admin = createAdminClient();

  // Ledger mínimo ANTES do cascade (auth.users → weddings → publish_payments/cash_gifts):
  // ids do provedor, valores e status para conciliar estorno, chargeback ou um Pix da taxa
  // pago depois. Sem nome de convidado nem mensagem. Se não gravar, nada é apagado.
  // ponytail: fica em funnel_events; migration com ON DELETE SET NULL se virar rotina.
  if (impact.wedding) {
    const weddingId = impact.wedding.id;
    let publishPayments, cardGifts;
    try {
      [publishPayments, cardGifts] = await Promise.all([
        fetchAll((from, to) =>
          admin
            .from("publish_payments")
            .select("id, provider, provider_charge_id, amount_cents, status, paid_at, created_at")
            .eq("wedding_id", weddingId)
            .order("id")
            .range(from, to)
        ),
        fetchAll((from, to) =>
          admin
            .from("cash_gifts")
            .select("id, provider, provider_payment_id, provider_status, payment_method, status, gross_amount, charged_amount, net_amount, installments, paid_at, created_at")
            .eq("wedding_id", weddingId)
            .not("provider_payment_id", "is", null)
            .order("id")
            .range(from, to)
        )
      ]);
    } catch (error) {
      await logServerError("admin.delete_account.ledger_load", error, { path: "/admin/usuarios", detail: { adminId: me.id, targetUserId: userId } });
      return { error: "Não foi possível guardar o histórico de pagamentos. Nada foi apagado; tente de novo." };
    }
    if (publishPayments.length || cardGifts.length) {
      const { error } = await admin.from("funnel_events").insert({
        event: "account_payments_archived",
        path: "/admin/usuarios",
        detail: { adminId: me.id, targetUserId: userId, weddingId, publishPayments, cardGifts }
      });
      if (error) {
        await logServerError("admin.delete_account.ledger", error, { path: "/admin/usuarios", detail: { adminId: me.id, targetUserId: userId } });
        return { error: "Não foi possível guardar o histórico de pagamentos. Nada foi apagado; tente de novo." };
      }
    }
  }

  let photosFailed = impact.photosListFailed;
  for (const batch of chunk(impact.photoPaths, 100)) {
    const { error } = await admin.storage.from(PHOTOS_BUCKET).remove(batch);
    if (error) {
      photosFailed = true;
      await logServerError("admin.delete_account.storage", error, { path: "/admin/usuarios", detail: { adminId: me.id, targetUserId: userId, batch: batch.length } });
    }
  }
  if (impact.photosListFailed) {
    await logServerError("admin.delete_account.storage_list", new Error("storage list failed"), { path: "/admin/usuarios", detail: { adminId: me.id, targetUserId: userId } });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    await logServerError("admin.delete_account.auth", deleteError, { path: "/admin/usuarios", detail: { adminId: me.id, targetUserId: userId } });
    return {
      error:
        impact.photoPaths.length > 0
          ? "Não foi possível apagar a conta. A conta e os dados continuam, mas as fotos do storage já foram removidas. Tente de novo."
          : "Não foi possível apagar a conta. Nada foi apagado; tente de novo."
    };
  }

  // O cookie de suporte é deste navegador: se ele apontava para a conta apagada, some.
  const support = await readSupportCookie();
  if (support?.targetUserId === userId) await clearSupportCookie();

  await recordFunnelEvent({
    event: "account_deleted",
    userId: null,
    path: "/admin/usuarios",
    detail: {
      adminId: me.id,
      deletedUserId: userId,
      weddingId: impact.wedding?.id ?? null,
      weddingStatus: impact.wedding?.status ?? null,
      feePaidAt: impact.wedding?.publishPaidAt ?? null,
      paymentsPaidCents: impact.paymentsPaidCents,
      guests: impact.guests,
      messages: impact.messages,
      cashGifts: impact.cashGifts,
      cashGiftsPaid: impact.cashGiftsPaid,
      giftCotas: impact.giftCotas,
      photos: impact.photoPaths.length,
      photosFailed,
      mpConnected: impact.mpConnected
    }
  });

  revalidatePath("/admin", "layout");
  if (impact.wedding) revalidatePath(`/casamento/${impact.wedding.slug}`);
  redirect(`/admin/usuarios?apagada=1${photosFailed ? "&fotos=falha" : ""}`);
}
