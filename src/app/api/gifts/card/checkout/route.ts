import { NextResponse } from "next/server";
import {
  cardFeeRateFromEnv,
  cardMaxInstallmentsFromEnv,
  computeCardCharge,
  validateCardAmount
} from "@/lib/card-pricing";
import { MercadoPagoApiError, createGiftPreference } from "@/lib/mercadopago";
import { flagConnectionError, getChargeContext } from "@/lib/mercadopago-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WEDDING_RENDER_COLUMNS, rowToWeddingSite } from "@/lib/wedding";

export const runtime = "nodejs";

/**
 * Presente no cartão: cria a cobrança NA CONTA DO CASAL (token OAuth dele) e
 * devolve a URL do Checkout Pro. O dinheiro nunca passa pela plataforma.
 *
 * Ordem importa: grava o presente pendente ANTES, porque o id dele é o
 * external_reference — o identificador que o webhook usa para reconciliar.
 */
export async function POST(request: Request) {
  type CardCheckoutBody = Partial<{
    weddingSiteId: string;
    guestName: string;
    amount: number;
    message: string;
    giftId: string;
  }>;

  let body: CardCheckoutBody;
  try {
    body = (await request.json()) as CardCheckoutBody;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  try {
    const weddingId = String(body.weddingSiteId || "");
    if (!weddingId) {
      return NextResponse.json({ error: "Site inválido." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: row } = await admin
      .from("weddings")
      .select(WEDDING_RENDER_COLUMNS)
      .eq("id", weddingId)
      .maybeSingle();

    if (!row || row.status !== "published") {
      return NextResponse.json({ error: "Site não disponível para presentes." }, { status: 404 });
    }

    const context = await getChargeContext(weddingId);
    if (!context) {
      return NextResponse.json(
        { error: "O casal ainda não ativou os presentes no cartão. Use o Pix." },
        { status: 409 }
      );
    }

    const amount = Number(body.amount);
    const amountError = validateCardAmount(amount);
    if (amountError) {
      return NextResponse.json({ error: amountError }, { status: 400 });
    }

    const wedding = rowToWeddingSite(row);
    const guestName = String(body.guestName || "").trim().slice(0, 120) || "Convidado";
    const message = body.message ? String(body.message).trim().slice(0, 500) : null;
    const gift = body.giftId ? wedding.gifts.find((item) => item.id === body.giftId && item.active) : undefined;

    const charge = computeCardCharge(
      amount,
      context.feePayer,
      cardFeeRateFromEnv(process.env.MERCADOPAGO_CARD_FEE_PERCENT)
    );

    // 1) Presente pendente — o id vira o external_reference da preferência.
    const { data: inserted, error: insertError } = await admin
      .from("cash_gifts")
      .insert({
        wedding_id: weddingId,
        guest_name: guestName,
        message,
        gross_amount: charge.giftAmount,
        currency: "BRL",
        status: "pending",
        payment_method: "card",
        provider: "mercadopago",
        charged_amount: charge.chargeAmount,
        gift_id: gift?.id ?? null
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("cash_gifts insert (cartão) falhou", insertError);
      return NextResponse.json({ error: "Não foi possível iniciar o pagamento. Tente de novo." }, { status: 500 });
    }

    // 2) Preferência do Checkout Pro na conta do casal.
    const appUrl = (process.env.APP_URL || new URL(request.url).origin).replace(/\/+$/, "");
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const notificationUrl =
      `${appUrl}/api/webhooks/mercadopago?w=${weddingId}` + (webhookSecret ? `&t=${encodeURIComponent(webhookSecret)}` : "");

    try {
      const preference = await createGiftPreference({
        accessToken: context.accessToken,
        giftId: gift?.id,
        title: gift ? `Presente: ${gift.title}` : `Presente para ${wedding.coupleNames}`,
        description: gift?.description || undefined,
        amount: charge.chargeAmount,
        externalReference: inserted.id,
        notificationUrl,
        backUrl: `${appUrl}/api/mercadopago/return?w=${weddingId}`,
        maxInstallments: cardMaxInstallmentsFromEnv(process.env.MERCADOPAGO_MAX_INSTALLMENTS),
        metadata: { cash_gift_id: inserted.id, wedding_id: weddingId }
      });

      return NextResponse.json({ url: preference.initPoint });
    } catch (err) {
      // Sem cobrança, o presente pendente vira lixo: apaga.
      await admin.from("cash_gifts").delete().eq("id", inserted.id);

      if (err instanceof MercadoPagoApiError && err.code === "collector_does_not_comply_with_current_regulation") {
        await flagConnectionError(
          weddingId,
          "o Mercado Pago pede a verificação de identidade da conta antes de aceitar cobranças"
        );
        return NextResponse.json(
          { error: "A conta do casal no Mercado Pago ainda está em verificação. Use o Pix por enquanto." },
          { status: 409 }
        );
      }

      throw err;
    }
  } catch (err) {
    console.error("checkout do cartão falhou", err instanceof MercadoPagoApiError ? err.code : err);
    return NextResponse.json(
      { error: "Não foi possível abrir o pagamento no cartão agora. Tente de novo ou use o Pix." },
      { status: 502 }
    );
  }
}
