import { NextResponse } from "next/server";
import { logServerError } from "@/lib/funnel";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeName } from "@/lib/public-forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Busca pública de nomes na lista de convidados do casal — alimenta o autocomplete
 * do RSVP para o convidado achar o SEU nome (evita confirmar o de um homônimo).
 * Devolve SÓ nomes (nunca contato/status), de sites publicados, com consulta mínima
 * de 2 caracteres e teto de resultados para não virar dump da lista inteira. Via
 * service-role porque a RLS de `guests` é só do casal.
 */
const MIN_QUERY = 2;
const LIMIT = 8;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") ?? "").trim();
  const target = normalizeName(searchParams.get("q") ?? "");
  if (!slug || target.length < MIN_QUERY) {
    return NextResponse.json({ names: [] });
  }

  const admin = createAdminClient();
  const { data: wedding, error: weddingError } = await admin
    .from("weddings")
    .select("id, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!wedding || wedding.status !== "published") {
    // Público: só slug e o erro — nunca o termo buscado (é nome de convidado).
    if (weddingError) {
      await logServerError("rsvp.search.wedding", weddingError, { path: "/api/rsvp/search", detail: { slug } });
    }
    return NextResponse.json({ names: [] });
  }

  const { data: guests, error: guestsError } = await admin.from("guests").select("name").eq("wedding_id", wedding.id);
  if (guestsError) {
    await logServerError("rsvp.search.guests", guestsError, { weddingId: wedding.id, path: "/api/rsvp/search" });
  }

  // Casa sem acento/caixa; prefixo antes de substring; nomes idênticos só uma vez.
  const seen = new Set<string>();
  const matches: Array<{ name: string; starts: boolean }> = [];
  for (const guest of guests ?? []) {
    const normalized = normalizeName(guest.name);
    if (!normalized.includes(target) || seen.has(guest.name)) continue;
    seen.add(guest.name);
    matches.push({ name: guest.name, starts: normalized.startsWith(target) });
  }
  matches.sort((a, b) =>
    a.starts === b.starts ? a.name.localeCompare(b.name, "pt-BR") : a.starts ? -1 : 1
  );

  return NextResponse.json({ names: matches.slice(0, LIMIT).map((m) => m.name) });
}
