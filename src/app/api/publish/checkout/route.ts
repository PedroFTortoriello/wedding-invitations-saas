import { NextResponse } from "next/server";
import { createPublishCharge } from "@/lib/abacatepay";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Inicia o pagamento da taxa de publicação: cria um checkout hospedado na
 * AbacatePay para o casamento do usuário e registra um publish_payment pendente.
 * Exige sessão e posse do casamento (owner_id = usuário logado).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Faça login para publicar." }, { status: 401 });
    }

    const body = (await request.json()) as { weddingSiteId?: string };
    const weddingId = String(body.weddingSiteId || "");

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
      return NextResponse.json({ error: "Casamento não encontrado." }, { status: 404 });
    }

    if (wedding.owner_id !== user.id) {
      return NextResponse.json({ error: "Sem permissão para este site." }, { status: 403 });
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

    await admin.from("publish_payments").insert({
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
