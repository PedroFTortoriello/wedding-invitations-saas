import { NextResponse } from "next/server";
import { isWebhookSecretValid, isWebhookSignatureValid, parseAbacatePayWebhook } from "@/lib/abacatepay";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * AbacatePay payment webhook — the ONLY thing that marks a wedding's publish fee
 * paid (a DB trigger forbids any client from setting publish_paid_at). It
 * validates the ?webhookSecret query param (and the optional HMAC), then defers
 * the actual stamp to mark_publish_paid() (migration 0005), which is atomic,
 * bound to a real pending charge, amount-checked and idempotent.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);

  if (!isWebhookSecretValid(url.searchParams.get("webhookSecret"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Read the RAW body before parsing — required for byte-exact HMAC verification.
  const raw = await request.text();

  if (!isWebhookSignatureValid(raw, request.headers.get("x-webhook-signature"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const result = parseAbacatePayWebhook(payload);

  // Only act on a confirmed payment bound to a charge id and wedding we created.
  if (!result.paid || !result.weddingId || !result.chargeId) {
    return NextResponse.json({ received: true });
  }

  // In production, never honor a sandbox/devMode payment.
  if (result.devMode && process.env.NODE_ENV === "production") {
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();
  const { data: recognized, error } = await supabase.rpc("mark_publish_paid", {
    p_charge_id: result.chargeId,
    p_wedding_id: result.weddingId,
    p_amount_cents: result.amountCents ?? null
  });

  if (error) {
    // A genuine payment we failed to persist — return 5xx so AbacatePay retries.
    return NextResponse.json({ error: "could not record payment" }, { status: 500 });
  }

  // recognized === false: the charge/wedding/amount matched nothing we created
  // (foreign or forged event) — ack so retries stop without changing any state.
  if (recognized !== true) {
    // Pagamento confirmado que não casou com nenhuma cobrança nossa: pode ser
    // evento externo OU um descasamento de formato/valor — vale investigar.
    console.error(
      "AbacatePay webhook: pagamento não reconhecido",
      JSON.stringify({ event: (payload as { event?: string })?.event, chargeId: result.chargeId, weddingId: result.weddingId, amountCents: result.amountCents })
    );
  }

  return NextResponse.json({ received: true, recognized: recognized === true });
}
