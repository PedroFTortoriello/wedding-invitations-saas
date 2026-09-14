"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  contentToJson,
  extractContent,
  isTemplateId,
  monogramFromNames,
  rowToWeddingSite,
  TEMPLATE_NAMES,
  type WeddingRow
} from "@/lib/wedding";
import type { PixKeyType, WeddingGalleryImage, WeddingSite } from "@/types/wedding";

const PIX_KEY_TYPES: PixKeyType[] = ["cpf", "cnpj", "email", "phone", "random"];
const BUCKET = "wedding-photos";
const MAX_GALLERY = 40;

export type AutosaveResult = { ok?: boolean; error?: string };

function ownerPrefix(ownerId: string): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? `${url}/storage/v1/object/public/${BUCKET}/${ownerId}/` : null;
}

/**
 * Auto-save do editor ao vivo: recebe o WeddingSite inteiro e persiste TODO o
 * conteúdo (textos + imagens). Guarda o que o cliente não pode ditar:
 * id/owner/slug/status vêm sempre da linha; monogram/templateName são derivados;
 * presentes vêm do banco (geridos em /presentes); imagens só entram se forem do
 * storage do próprio dono ou já existirem no site. Body é só JSON (arquivos sobem
 * direto pro Storage), então não esbarra no limite de 1 MB das Server Actions.
 */
export async function autosaveWeddingAction(input: WeddingSite): Promise<AutosaveResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const row = (data as WeddingRow) ?? null;
  if (!row) return { error: "Casamento não encontrado." };

  const site = rowToWeddingSite(row); // autoritativo p/ id/owner/slug/status/gifts

  const coupleNames = String(input.coupleNames ?? "").trim();
  if (coupleNames.length < 3) return { error: "Informe o nome do casal." };
  if (!isTemplateId(input.templateId)) return { error: "Modelo inválido." };
  const pixKeyType: PixKeyType = (PIX_KEY_TYPES as string[]).includes(input.pixKeyType) ? input.pixKeyType : "random";
  const pixKey = String(input.pixKey ?? "").trim();

  // Imagens: só storage do dono ou já existentes (evita URLs forasteiras).
  const prefix = ownerPrefix(user.id);
  const existing = new Set<string>([
    site.heroImage,
    site.footerImage,
    ...site.gallery.map((g) => g.src),
    ...site.locations.map((l) => l.image),
    ...site.detailCards.map((c) => c.image),
    ...site.gifts.map((g) => g.image ?? "")
  ]);
  const okSrc = (s: string) => Boolean(s && ((prefix && s.startsWith(prefix)) || existing.has(s)));
  const keepImg = (candidate: string, fallback: string) => (okSrc(candidate) ? candidate : fallback);

  const gallery: WeddingGalleryImage[] = (Array.isArray(input.gallery) ? input.gallery : [])
    .filter((g) => g && typeof g.src === "string" && okSrc(g.src))
    .slice(0, MAX_GALLERY)
    .map((g) => ({
      id: String(g.id || g.src),
      src: g.src,
      alt: typeof g.alt === "string" ? g.alt.slice(0, 160) : "",
      role: g.role ?? "story"
    }));

  const merged: WeddingSite = {
    ...input,
    id: site.id,
    ownerId: site.ownerId,
    slug: site.slug,
    status: site.status,
    coupleNames,
    monogram: monogramFromNames(coupleNames),
    templateId: input.templateId,
    templateName: TEMPLATE_NAMES[input.templateId],
    pixKey,
    pixKeyType,
    heroImage: keepImg(input.heroImage, site.heroImage),
    footerImage: keepImg(input.footerImage, site.footerImage),
    gallery,
    locations: (Array.isArray(input.locations) ? input.locations : []).map((l, i) => ({
      ...l,
      image: keepImg(l.image, site.locations[i]?.image ?? site.heroImage)
    })),
    detailCards: (Array.isArray(input.detailCards) ? input.detailCards : []).map((c, i) => ({
      ...c,
      image: keepImg(c.image, site.detailCards[i]?.image ?? site.heroImage)
    })),
    gifts: site.gifts // presentes são geridos em /presentes — nunca sobrescreve pelo editor
  };

  const { error } = await supabase
    .from("weddings")
    .update({
      couple_names: coupleNames,
      pix_key: pixKey || null,
      pix_key_type: pixKey ? pixKeyType : null,
      pix_holder_name: String(input.pixHolderName ?? "").trim() || null,
      content: contentToJson(extractContent(merged))
    })
    .eq("id", row.id);

  if (error) return { error: "Não foi possível salvar." };

  revalidatePath("/dashboard");
  revalidatePath(`/casamento/${row.slug}`);
  return { ok: true };
}
