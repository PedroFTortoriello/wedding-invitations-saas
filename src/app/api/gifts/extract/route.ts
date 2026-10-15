import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { logServerError } from "@/lib/funnel";
import { extractGiftFromUrl, fetchExternalImage, GIFT_IMPORT_MESSAGES, GiftImportError } from "@/lib/gift-scraper";
import { createClient } from "@/lib/supabase/server";
import type { GiftExtractionRequest } from "@/types/gift-extraction";

export const runtime = "nodejs";

const BUCKET = "wedding-photos";

export async function POST(request: Request) {
  let userId: string | undefined;
  try {
    // Faz fetch server-side de uma URL informada pelo usuário (o scraper bloqueia
    // hosts privados). Exige sessão para não ser um proxy de fetch anônimo.
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    userId = user?.id;
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
      if (!downloaded) {
        // Só host da imagem e estratégia (sem URL completa): mostra CDN bloqueando o servidor.
        await logServerError("gifts.extract.image", new Error("image download failed"), {
          userId,
          path: "/api/gifts/extract",
          detail: { source: gift.source, imageHost: new URL(gift.image).hostname }
        });
      } else {
        const path = `${user.id}/gift-${randomUUID()}.${downloaded.ext}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, downloaded.bytes, { contentType: downloaded.contentType, upsert: false });
        if (!error) {
          image = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        } else {
          await logServerError("gifts.extract.upload", error, { userId, path: "/api/gifts/extract" });
        }
      }
    }

    return NextResponse.json({ ...gift, image });
  } catch (error) {
    // Inclui recusas esperadas (loja fora do ar, link inválido): mostram quais lojas falham.
    // detail = loja + estratégias tentadas + status (sem dado do usuário).
    const importError = error instanceof GiftImportError ? error : null;
    await logServerError("gifts.extract", error, {
      userId,
      path: "/api/gifts/extract",
      detail: importError ? { attempts: importError.detail } : undefined
    });
    // Nunca repassa erro técnico cru para a tela.
    const message = importError?.message ?? GIFT_IMPORT_MESSAGES.manual;

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
