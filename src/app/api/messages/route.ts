import { NextResponse } from "next/server";
import { logServerError } from "@/lib/funnel";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeMessage } from "@/lib/public-forms";

export const runtime = "nodejs";

const PATH = "/api/messages";

/**
 * Recado público de um convidado. Valida site publicado e grava via service-role.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!slug) {
      return NextResponse.json({ error: "Site inválido." }, { status: 400 });
    }

    const result = normalizeMessage(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: wedding, error: weddingError } = await admin
      .from("weddings")
      .select("id, status")
      .eq("slug", slug)
      .maybeSingle();

    if (!wedding || wedding.status !== "published") {
      // Público: só slug e o erro — nunca nome ou recado do convidado.
      if (weddingError) await logServerError("messages.wedding", weddingError, { path: PATH, detail: { slug } });
      return NextResponse.json({ error: "Este site não está disponível para recados." }, { status: 404 });
    }

    const { error } = await admin.from("messages").insert({
      wedding_id: wedding.id,
      guest_name: result.value.guestName,
      message: result.value.message
    });

    if (error) {
      await logServerError("messages.insert", error, { weddingId: wedding.id, path: PATH });
      return NextResponse.json({ error: "Não foi possível enviar agora." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // JSON malformado é do cliente — e a mensagem do parser ecoa trechos do corpo.
    if (!(err instanceof SyntaxError)) await logServerError("messages", err, { path: PATH });
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
}
