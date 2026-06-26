import { NextResponse } from "next/server";
import { createPublishCharge } from "@/lib/abacatepay";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Start the publishing-fee payment: create an AbacatePay hosted checkout for the
 * couple's wedding and record a pending publish_payment. Returns the pay URL.
 * (Ownership is enforced by the auth layer once wired; for now it acts by id.)
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { weddingSiteId?: string };
    const weddingId = String(body.weddingSiteId || "");

    if (!weddingId) {
      return NextResponse.json({ error: "Informe o site do casamento." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: wedding, error } = await supabase
      .from("weddings")
      .select("id, couple_names, publish_paid_at")
      .eq("id", weddingId)
      .single();

    if (error || !wedding) {
      return NextResponse.json({ error: "Casamento não encontrado." }, { status: 404 });
    }

    if (wedding.publish_paid_at) {
      return NextResponse.json({ error: "A taxa de publicação deste site já foi paga." }, { status: 409 });
    }

    const appUrl = process.env.APP_URL || new URL(request.url).origin;
    const charge = await createPublishCharge({
      weddingId,
      appUrl,
      customer: wedding.couple_names ? { name: wedding.couple_names } : undefined
    });

    await supabase.from("publish_payments").insert({
      wedding_id: weddingId,
      provider: "abacatepay",
      provider_charge_id: charge.id,
      amount_cents: charge.amountCents,
      status: "pending",
      checkout_url: charge.url
    });

    return NextResponse.json({ url: charge.url, chargeId: charge.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Não foi possível iniciar o pagamento da publicação." },
      { status: 400 }
    );
  }
}
