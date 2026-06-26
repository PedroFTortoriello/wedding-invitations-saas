import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Publish gate: a wedding can only go live AFTER the publishing fee is confirmed
 * paid (weddings.publish_paid_at, set exclusively by the AbacatePay webhook).
 * Returns 402 Payment Required if the fee is unpaid.
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
      .select("id, status, publish_paid_at")
      .eq("id", weddingId)
      .single();

    if (error || !wedding) {
      return NextResponse.json({ error: "Casamento não encontrado." }, { status: 404 });
    }

    if (!wedding.publish_paid_at) {
      return NextResponse.json(
        { error: "Pague a taxa de publicação para colocar o site no ar." },
        { status: 402 }
      );
    }

    const { error: updateError } = await supabase
      .from("weddings")
      .update({ status: "published" })
      .eq("id", weddingId);

    if (updateError) {
      return NextResponse.json({ error: "Não foi possível publicar o site." }, { status: 500 });
    }

    return NextResponse.json({ status: "published" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Não foi possível publicar o site." },
      { status: 400 }
    );
  }
}
