import { NextResponse } from "next/server";
import { extractGiftFromUrl } from "@/lib/gift-scraper";
import { createClient } from "@/lib/supabase/server";
import type { GiftExtractionRequest } from "@/types/gift-extraction";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // Faz fetch server-side de uma URL informada pelo usuário (o scraper bloqueia
    // hosts privados). Exige sessão para não ser um proxy de fetch anônimo.
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Faça login para importar presentes." }, { status: 401 });
    }

    const body = (await request.json()) as Partial<GiftExtractionRequest>;
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json({ error: "Informe o link do produto." }, { status: 400 });
    }

    const gift = await extractGiftFromUrl(url);

    return NextResponse.json(gift);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível extrair os dados desse produto.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
