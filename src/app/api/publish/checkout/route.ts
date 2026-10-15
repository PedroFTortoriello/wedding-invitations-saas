import { after, NextResponse } from "next/server";
import { createPublishCharge } from "@/lib/abacatepay";
import { getActingContext, guardSupportWrite } from "@/lib/acting";
import { logServerError, recordFunnelEvent } from "@/lib/funnel";
import { getTrackingContext, sendMetaServerEvent } from "@/lib/meta-capi";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const EVENT_ID_RE = /^[A-Za-z0-9_-]{1,80}$/;

/**
 * Inicia o pagamento da taxa de publicação: cria um checkout hospedado na
 * AbacatePay para o casamento do usuário e registra um publish_payment pendente.
 * Exige sessão e posse do casamento (owner_id = usuário logado).
 */
export async function POST(request: Request) {
  const path = "/api/publish/checkout";
  let userId: string | undefined;
  let weddingId: string | undefined;
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return NextResponse.json({ error: "Faça login para publicar." }, { status: 401 });
    }
    // O 401 JSON acima fica: requireUser (dentro do contexto) redirecionaria.
    const acting = await getActingContext();
    userId = acting.ownerId;

    const body = (await request.json()) as { weddingSiteId?: string; eventId?: unknown };
    weddingId = String(body.weddingSiteId || "");
    // event_id do InitiateCheckout do Pixel: o mesmo vai pela Conversions API (dedup).
    const eventId = typeof body.eventId === "string" && EVENT_ID_RE.test(body.eventId) ? body.eventId : undefined;

    if (!weddingId) {
      return NextResponse.json({ error: "Informe o site do casamento." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: wedding, error } = await admin
      .from("weddings")
      .select("id, couple_names, owner_id, publish_paid_at")
      .eq("id", weddingId)
      .single();

    if (error || !wedding) {
      // PGRST116 = nenhuma linha (id inexistente); o resto é falha real do banco.
      if (error && error.code !== "PGRST116") {
        await logServerError("publish.checkout.load", error, { event: "publish_checkout_failed", userId, path });
      }
      return NextResponse.json({ error: "Casamento não encontrado." }, { status: 404 });
    }

    if (wedding.owner_id !== acting.ownerId) {
      return NextResponse.json({ error: "Sem permissão para este site." }, { status: 403 });
    }

    const guard = await guardSupportWrite(acting, "publish_checkout", weddingId);
    if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: 403 });

    if (wedding.publish_paid_at) {
      return NextResponse.json({ error: "A taxa de publicação deste site já foi paga." }, { status: 409 });
    }

    const appUrl = process.env.APP_URL || new URL(request.url).origin;
    const charge = await createPublishCharge({ weddingId, appUrl });

    // A AbacatePay deduplica por externalId (= weddingId): reabrir o checkout do
    // mesmo casamento devolve o MESMO bill_id. Um insert puro estoura a unique
    // de provider_charge_id (500) mesmo sendo o mesmo pagamento pendente — então
    // fazemos upsert idempotente e só reabrimos a URL da cobrança existente.
    const { error: insertError } = await admin.from("publish_payments").upsert(
      {
        wedding_id: weddingId,
        provider: "abacatepay",
        provider_charge_id: charge.id,
        amount_cents: charge.amountCents,
        status: "pending",
        checkout_url: charge.url
      },
      { onConflict: "provider_charge_id" }
    );

    // O webhook reconcilia SÓ por provider_charge_id — sem esta linha o pagamento
    // fica órfão. Falha aqui não pode devolver a URL como se tudo estivesse ok.
    if (insertError) {
      await logServerError("publish.checkout.insert", insertError, {
        event: "publish_checkout_failed",
        userId,
        weddingId,
        path,
        detail: { chargeId: charge.id }
      });
      return NextResponse.json(
        { error: "Não foi possível registrar o pagamento. Tente novamente." },
        { status: 500 }
      );
    }

    // Identificadores de anúncio (só presentes com consentimento) ficam salvos aqui:
    // o webhook, sem cookies do casal, lê este evento para mandar o Purchase à Meta.
    // Retenção: o cron diário apaga fbp/fbc/userAgent após 30 dias (purge_funnel_ad_ids).
    const ctx = await getTrackingContext();
    await recordFunnelEvent({
      event: "publish_checkout_started",
      userId,
      weddingId,
      path,
      detail: {
        chargeId: charge.id,
        amountCents: charge.amountCents,
        consent: ctx.consent,
        fbp: ctx.fbp,
        fbc: ctx.fbc,
        userAgent: ctx.userAgent,
        sourceUrl: ctx.sourceUrl
      }
    });
    if (eventId) {
      const email = user.email;
      // Depois da resposta: a Meta pode levar até 3s e o casal está indo para o Pix.
      after(() =>
        sendMetaServerEvent({
          event: "begin_checkout",
          eventId,
          userId,
          email,
          value: charge.amountCents / 100,
          context: ctx
        })
      );
    }

    return NextResponse.json({ url: charge.url, chargeId: charge.id });
  } catch (err) {
    await logServerError("publish.checkout", err, { event: "publish_checkout_failed", userId, weddingId, path });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Não foi possível iniciar o pagamento da publicação." },
      { status: 400 }
    );
  }
}
