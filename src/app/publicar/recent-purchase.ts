import { createClient } from "@/lib/supabase/server";

/** Janela do Purchase no navegador: a mesma em que a Meta deduplica com o da Conversions API. */
const PURCHASE_WINDOW_MS = 48 * 3600_000;

/**
 * Regra única do <PurchaseTracker> (painel e /publicar): só pagamento real e recente.
 * Cortesia do admin e pagamentos antigos também têm publish_paid_at, mas não são
 * conversão da campanha.
 */
export async function hasRecentPurchase(weddingId: string, publishPaidAt: string | null): Promise<boolean> {
  if (!publishPaidAt) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("publish_payments")
    .select("id")
    .eq("wedding_id", weddingId)
    .eq("status", "paid")
    .gte("paid_at", new Date(Date.now() - PURCHASE_WINDOW_MS).toISOString())
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}
