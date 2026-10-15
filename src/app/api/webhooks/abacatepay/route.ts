import { after, NextResponse } from "next/server";
import {
  isWebhookSecretValid,
  isWebhookSignatureValid,
  parseAbacatePayWebhook,
  PUBLISH_FEE_CENTS
} from "@/lib/abacatepay";
import { errorMessage, logServerError, recordFunnelEvent } from "@/lib/funnel";
import { sendMetaServerEvent } from "@/lib/meta-capi";
import { createAdminClient } from "@/lib/supabase/admin";
import { purchaseEventId } from "@/lib/tracking-shared";

export const runtime = "nodejs";

const PATH = "/api/webhooks/abacatepay";
const str = (value: unknown) => (typeof value === "string" ? value : undefined);

/**
 * Marco `publish_paid` + Purchase na Conversions API, uma vez por casamento. Roda em
 * after(): nunca muda a resposta do webhook nem provoca reenvio. Os identificadores
 * de anúncio vêm do `publish_checkout_started` (o webhook não tem cookies do casal).
 */
async function recordPurchase(weddingId: string, chargeId: string, amountCents: number) {
  try {
    const admin = createAdminClient();
    // Reentrega: mark_publish_paid é idempotente e devolve true de novo. Erro de consulta
    // (tabela ainda não criada) segue em frente — a Meta deduplica pelo event_id.
    // ponytail: duas entregas simultâneas podem gravar dois publish_paid; raro e inofensivo.
    const { data: already } = await admin
      .from("funnel_events")
      .select("id")
      .eq("wedding_id", weddingId)
      .eq("event", "publish_paid")
      .limit(1);
    if (already?.length) return;

    await recordFunnelEvent({ event: "publish_paid", weddingId, path: PATH, detail: { chargeId, amountCents } });

    const [{ data: started }, { data: wedding }] = await Promise.all([
      admin
        .from("funnel_events")
        .select("detail")
        .eq("wedding_id", weddingId)
        .eq("event", "publish_checkout_started")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin.from("weddings").select("owner_id").eq("id", weddingId).maybeSingle()
    ]);
    const ownerId = wedding?.owner_id;
    const { data: profile } = ownerId
      ? await admin.from("profiles").select("email").eq("id", ownerId).maybeSingle()
      : { data: null };
    const detail = (started?.detail ?? {}) as Record<string, unknown>;

    await sendMetaServerEvent({
      event: "purchase",
      eventId: purchaseEventId(weddingId),
      userId: ownerId,
      email: profile?.email,
      value: amountCents / 100,
      context: {
        consent: detail.consent === true,
        fbp: str(detail.fbp),
        fbc: str(detail.fbc),
        userAgent: str(detail.userAgent),
        // Evento "website" na Conversions API exige event_source_url.
        sourceUrl: str(detail.sourceUrl) ?? (process.env.APP_URL ? `${process.env.APP_URL}/dashboard` : undefined)
      }
    });
  } catch (err) {
    console.error(JSON.stringify({ at: "webhook.abacatepay.purchase", weddingId, error: errorMessage(err) }));
  }
}

/**
 * "Pagou = no ar": com a taxa confirmada, publica o rascunho na hora. Só sai de
 * 'draft' (nunca reativa 'suspended'/'expired') e é idempotente — na reentrega o
 * filtro de status não casa nenhuma linha. Nunca lança: falha só loga, o webhook
 * segue 200 (o pagamento já foi gravado) e o casal publica em /publicar.
 */
async function autoPublish(weddingId: string) {
  try {
    const { data, error } = await createAdminClient()
      .from("weddings")
      .update({ status: "published" })
      .eq("id", weddingId)
      .eq("status", "draft")
      .select("owner_id");
    if (error) throw error;
    if (data.length) {
      await recordFunnelEvent({
        event: "site_published",
        userId: data[0].owner_id,
        weddingId,
        path: PATH,
        detail: { source: "auto_after_payment" }
      });
    }
  } catch (err) {
    await logServerError("webhook.abacatepay.publish", err, { event: "publish_failed", weddingId, path: PATH });
  }
}

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
    await logServerError("webhook.abacatepay", error, {
      event: "action_failed",
      weddingId: result.weddingId,
      path: PATH,
      detail: { chargeId: result.chargeId }
    });
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

  if (recognized === true) {
    const { weddingId, chargeId } = result;
    // Antes da resposta: a tela /publicar consulta o status logo depois do Pix.
    await autoPublish(weddingId);
    after(() => recordPurchase(weddingId, chargeId, result.amountCents ?? PUBLISH_FEE_CENTS));
  }

  return NextResponse.json({ received: true, recognized: recognized === true });
}
