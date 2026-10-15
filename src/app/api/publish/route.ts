import { NextResponse } from "next/server";
import { getActingContext, guardSupportWrite } from "@/lib/acting";
import { logServerError, recordFunnelEvent } from "@/lib/funnel";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Publica o site: só é permitido DEPOIS que a taxa foi confirmada paga
 * (weddings.publish_paid_at, gravado exclusivamente pelo webhook da AbacatePay).
 * Exige sessão e posse. Retorna 402 se a taxa estiver em aberto.
 */
export async function POST(request: Request) {
  const path = "/api/publish";
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
    // ponytail: getUser de novo dentro do contexto (1 ida a mais ao Auth); o 401 JSON acima
    // continua porque requireUser redirecionaria em vez de responder.
    const ctx = await getActingContext();
    userId = ctx.ownerId;

    const body = (await request.json()) as { weddingSiteId?: string };
    weddingId = String(body.weddingSiteId || "");

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
      // PGRST116 = nenhuma linha (id inexistente); o resto é falha real do banco.
      if (error && error.code !== "PGRST116") {
        await logServerError("publish.load", error, { event: "publish_failed", userId, path });
      }
      return NextResponse.json({ error: "Casamento não encontrado." }, { status: 404 });
    }

    if (wedding.owner_id !== ctx.ownerId) {
      return NextResponse.json({ error: "Sem permissão para este site." }, { status: 403 });
    }

    const guard = await guardSupportWrite(ctx, "publish", weddingId);
    if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: 403 });

    if (!wedding.publish_paid_at) {
      return NextResponse.json(
        { error: "Pague a taxa de publicação para colocar o site no ar." },
        { status: 402 }
      );
    }

    // Suspenso/expirado volta só pelo suporte — pagar não reativa (igual ao webhook).
    if (wedding.status === "suspended" || wedding.status === "expired") {
      return NextResponse.json({ error: "Este site está inativo. Fale com o suporte." }, { status: 409 });
    }

    const { error: updateError } = await admin
      .from("weddings")
      .update({ status: "published" })
      .eq("id", weddingId);

    if (updateError) {
      await logServerError("publish.update", updateError, { event: "publish_failed", userId, weddingId, path });
      return NextResponse.json({ error: "Não foi possível publicar o site." }, { status: 500 });
    }

    await recordFunnelEvent({ event: "site_published", userId, weddingId, path, detail: { source: "manual" } });
    return NextResponse.json({ status: "published" });
  } catch (err) {
    await logServerError("publish", err, { event: "publish_failed", userId, weddingId, path });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Não foi possível publicar o site." },
      { status: 400 }
    );
  }
}
