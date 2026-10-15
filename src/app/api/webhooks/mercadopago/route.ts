import { NextResponse } from "next/server";
import { timingSafeEqualStr } from "@/lib/abacatepay";
import { logServerError } from "@/lib/funnel";
import { isMercadoPagoSignatureValid } from "@/lib/mercadopago";
import { syncMercadoPagoPayment } from "@/lib/mercadopago-server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type MpNotification = {
  action?: string;
  type?: string;
  data?: { id?: string | number };
  user_id?: string | number;
};

/**
 * Webhook do Mercado Pago. A notificação é só um GATILHO: o estado do presente vem
 * sempre de uma consulta ao pagamento na API do MP, com o token do casal — nada do
 * corpo da requisição é gravado.
 *
 * Autenticação: assinatura x-signature (notificações configuradas no painel) OU o
 * segredo que vai na notification_url da preferência (a doc do MP não garante
 * assinatura nesse segundo caminho). 5xx só quando um pagamento real não pôde ser
 * gravado — aí o MP reenvia.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const raw = await request.text();

  let payload: MpNotification | null = null;
  try {
    payload = JSON.parse(raw) as MpNotification;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const queryDataId = url.searchParams.get("data.id");
  const signatureOk = isMercadoPagoSignatureValid({
    signatureHeader: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId: queryDataId
  });

  const token = url.searchParams.get("t");
  const expected = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const tokenOk = Boolean(expected && token && timingSafeEqualStr(token, expected));

  if (!signatureOk && !tokenOk) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const type = url.searchParams.get("type") ?? payload?.type ?? "";
  const dataId = queryDataId ?? (payload?.data?.id != null ? String(payload.data.id) : null);
  const mpUserId = payload?.user_id != null ? String(payload.user_id) : undefined;

  // Vínculo/desvínculo de conta. O MP não documenta o corpo do mp-connect: registra
  // o que chegou e, se falar em desautorização, marca a conexão como revogada.
  if (type === "mp-connect") {
    const action = String(payload?.action ?? "").toLowerCase();
    console.warn("Mercado Pago mp-connect:", raw.slice(0, 500));
    if (mpUserId && (action.includes("deauthor") || action.includes("unlink") || action.includes("revoke"))) {
      const { error } = await createAdminClient()
        .from("mp_connections")
        .update({ status: "revoked", last_error: action })
        .eq("mp_user_id", mpUserId);
      if (error) {
        await logServerError("webhook.mercadopago.revoke", error, {
          path: "/api/webhooks/mercadopago",
          detail: { mpUserId }
        });
      }
    }
    return NextResponse.json({ received: true });
  }

  if (type !== "payment" || !dataId) {
    return NextResponse.json({ received: true });
  }

  const weddingId = url.searchParams.get("w") ?? undefined;
  try {
    const result = await syncMercadoPagoPayment({ paymentId: dataId, weddingId, mpUserId });
    return NextResponse.json({ received: true, matched: result.matched });
  } catch (err) {
    // `w` vem da notification_url que nós montamos, mas não é verificado: vai no detail
    // (a FK de funnel_events.wedding_id recusaria um id inexistente e perderia o evento).
    await logServerError("webhook.mercadopago", err, {
      path: "/api/webhooks/mercadopago",
      detail: { weddingId, paymentId: dataId }
    });
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }
}
