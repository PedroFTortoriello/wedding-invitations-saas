import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeMessage } from "@/lib/public-forms";

export const runtime = "nodejs";

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
    const { data: wedding } = await admin
      .from("weddings")
      .select("id, status")
      .eq("slug", slug)
      .maybeSingle();

    if (!wedding || wedding.status !== "published") {
      return NextResponse.json({ error: "Este site não está disponível para recados." }, { status: 404 });
    }

    const { error } = await admin.from("messages").insert({
      wedding_id: wedding.id,
      guest_name: result.value.guestName,
      message: result.value.message
    });

    if (error) {
      return NextResponse.json({ error: "Não foi possível enviar agora." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
}
