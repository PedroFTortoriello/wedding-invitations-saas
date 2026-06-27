import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRsvp } from "@/lib/public-forms";

export const runtime = "nodejs";

/**
 * Confirmação de presença pública. Valida que o site está publicado e grava o
 * convidado via service-role (a RLS de guests é só do dono; a escrita pública
 * passa por aqui, com validação, em vez de afrouxar a policy).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!slug) {
      return NextResponse.json({ error: "Site inválido." }, { status: 400 });
    }

    const result = normalizeRsvp(body);
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
      return NextResponse.json({ error: "Este site não está disponível para confirmações." }, { status: 404 });
    }

    const { name, contact, status, companions } = result.value;
    const { error } = await admin.from("guests").insert({
      wedding_id: wedding.id,
      name,
      contact,
      status,
      companions_allowed: companions,
      companions_confirmed: status === "confirmed" ? companions : 0
    });

    if (error) {
      return NextResponse.json({ error: "Não foi possível registrar agora." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
}
