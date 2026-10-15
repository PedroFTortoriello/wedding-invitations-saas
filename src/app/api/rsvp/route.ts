import { NextResponse } from "next/server";
import { logServerError } from "@/lib/funnel";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeName, normalizeRsvp } from "@/lib/public-forms";

export const runtime = "nodejs";

const PATH = "/api/rsvp";

/**
 * Confirmação de presença pública, por BUSCA na lista do casal: o convidado
 * digita só o nome; casamos com um convidado pré-cadastrado (nome normalizado,
 * sem acento/caixa) e atualizamos o status. Quem não está na lista não confirma
 * — a lista é a fonte de verdade. Escrita via service-role porque o público não
 * é dono (a RLS de guests é só do casal).
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
    const { data: wedding, error: weddingError } = await admin
      .from("weddings")
      .select("id, status")
      .eq("slug", slug)
      .maybeSingle();

    if (!wedding || wedding.status !== "published") {
      // Público: só slug e o erro — nunca dados do convidado.
      if (weddingError) await logServerError("rsvp.wedding", weddingError, { path: PATH, detail: { slug } });
      return NextResponse.json({ error: "Este site não está disponível para confirmações." }, { status: 404 });
    }

    const { name, status } = result.value;

    // ponytail: lista de casamento é pequena (<1000) — busca tudo e casa em JS
    // p/ conseguir match sem acento/caixa. Se crescer, virar unaccent no SQL.
    const { data: guests, error: guestsError } = await admin
      .from("guests")
      .select("id, name, companions_allowed")
      .eq("wedding_id", wedding.id);
    if (guestsError) await logServerError("rsvp.guests", guestsError, { weddingId: wedding.id, path: PATH });

    const target = normalizeName(name);
    const match = (guests ?? []).find((guest) => normalizeName(guest.name) === target);

    if (!match) {
      return NextResponse.json(
        {
          error:
            "Não encontramos seu nome na lista de convidados. Confira como está no convite ou fale com o casal."
        },
        { status: 404 }
      );
    }

    // ponytail: nomes duplicados na lista casam no primeiro; acompanhantes
    // confirmados = o que o casal permitiu (o convite inteiro vem).
    const { error } = await admin
      .from("guests")
      .update({
        status,
        companions_confirmed: status === "confirmed" ? match.companions_allowed : 0
      })
      .eq("id", match.id);

    if (error) {
      await logServerError("rsvp.update", error, { weddingId: wedding.id, path: PATH });
      return NextResponse.json({ error: "Não foi possível registrar agora." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, name: match.name, status });
  } catch (err) {
    // JSON malformado é do cliente — e a mensagem do parser ecoa trechos do corpo.
    if (!(err instanceof SyntaxError)) await logServerError("rsvp", err, { path: PATH });
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
}
