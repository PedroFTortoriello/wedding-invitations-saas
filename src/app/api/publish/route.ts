import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Publica o site: só é permitido DEPOIS que a taxa foi confirmada paga
 * (weddings.publish_paid_at, gravado exclusivamente pelo webhook da AbacatePay).
 * Exige sessão e posse. Retorna 402 se a taxa estiver em aberto.
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
      .select("id, owner_id, status, publish_paid_at")
      .eq("id", weddingId)
      .single();

    if (error || !wedding) {
      return NextResponse.json({ error: "Casamento não encontrado." }, { status: 404 });
    }

    if (wedding.owner_id !== user.id) {
      return NextResponse.json({ error: "Sem permissão para este site." }, { status: 403 });
    }

    if (!wedding.publish_paid_at) {
      return NextResponse.json(
        { error: "Pague a taxa de publicação para colocar o site no ar." },
        { status: 402 }
      );
    }

    const { error: updateError } = await admin
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
