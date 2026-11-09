import { createClient } from "@/lib/supabase/server";

/** Janela do Purchase no navegador: a mesma em que a Meta deduplica com o da Conversions API. */
const PURCHASE_WINDOW_MS = 48 * 3600_000;

/**
 * Regra única do <PurchaseTracker> (painel e /publicar): só pagamento real e recente.
 * Devolve o valor pago em centavos, ou null. O Purchase do navegador reporta o que foi
 * cobrado, não a taxa vigente: um checkout aberto antes de uma troca de preço paga o valor
 * antigo, e a Conversions API já manda esse valor com o mesmo event_id.
 * Cortesia do admin e pagamentos antigos também têm publish_paid_at, mas não são
 * conversão da campanha.
 */
export async function recentPurchaseCents(weddingId: string, publishPaidAt: string | null): Promise<number | null> {
  if (!publishPaidAt) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("publish_payments")
    .select("amount_cents")
    .eq("wedding_id", weddingId)
    .eq("status", "paid")
    .gte("paid_at", new Date(Date.now() - PURCHASE_WINDOW_MS).toISOString())
    .order("paid_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? Number(data.amount_cents) : null;
}
