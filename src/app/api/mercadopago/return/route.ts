import { NextResponse } from "next/server";
import { syncMercadoPagoPayment } from "@/lib/mercadopago-server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Volta do convidado depois do Checkout Pro (back_urls). Aproveita para conciliar
 * na hora — assim o presente aparece pago mesmo se o webhook demorar. O status
 * vem SEMPRE da consulta ao Mercado Pago, nunca da query string, que é do usuário.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = (process.env.APP_URL || url.origin).replace(/\/+$/, "");
  const weddingId = url.searchParams.get("w") ?? "";
  const paymentId = url.searchParams.get("payment_id") ?? url.searchParams.get("collection_id");

  let flag = "recusado";

  if (paymentId && weddingId) {
    try {
      const result = await syncMercadoPagoPayment({ paymentId, weddingId });
      if (result.giftStatus === "paid") flag = "aprovado";
      else if (result.giftStatus === "pending") flag = "pendente";
    } catch (err) {
      // Falhou aqui, o webhook ainda vai reconciliar: manda o convidado para "em análise".
      console.error("Mercado Pago: conciliação na volta falhou", err);
      flag = "pendente";
    }
  }

  if (!weddingId) {
    return NextResponse.redirect(`${origin}/`);
  }

  const admin = createAdminClient();
  const { data } = await admin.from("weddings").select("slug").eq("id", weddingId).maybeSingle();

  return NextResponse.redirect(
    data?.slug ? `${origin}/casamento/${data.slug}?presente=${flag}` : `${origin}/?presente=${flag}`
  );
}
