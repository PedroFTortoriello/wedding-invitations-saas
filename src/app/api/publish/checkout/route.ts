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
      console.error("publish_payments insert falhou", insertError);
      return NextResponse.json(
        { error: "Não foi possível registrar o pagamento. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: charge.url, chargeId: charge.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Não foi possível iniciar o pagamento da publicação." },
      { status: 400 }
    );
  }
}
