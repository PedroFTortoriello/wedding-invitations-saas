import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { extractGiftFromUrl, fetchExternalImage } from "@/lib/gift-scraper";
import { createClient } from "@/lib/supabase/server";
import type { GiftExtractionRequest } from "@/types/gift-extraction";

export const runtime = "nodejs";

const BUCKET = "wedding-photos";

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

    // Rebaixa a imagem externa para o NOSSO storage (pasta do dono): assim ela
    // passa no guard de imagem do addGiftAction e renderiza no next/image.
    let image: string | null = null;
    if (gift.image) {
      const downloaded = await fetchExternalImage(gift.image);
      if (downloaded) {
        const path = `${user.id}/gift-${randomUUID()}.${downloaded.ext}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, downloaded.bytes, { contentType: downloaded.contentType, upsert: false });
        if (!error) {
          image = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        }
      }
    }

    return NextResponse.json({ ...gift, image });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível extrair os dados desse produto.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
