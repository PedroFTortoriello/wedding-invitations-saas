"use server";

import { revalidatePath } from "next/cache";
import { getActingContext, guardSupportWrite } from "@/lib/acting";
import { logServerError } from "@/lib/funnel";
import {
  contentToJson,
  extractContent,
  isOwnerPhotoUrl,
  isTemplateId,
  monogramFromNames,
  rowToWeddingSite,
  TEMPLATE_NAMES,
  type WeddingRow
} from "@/lib/wedding";
import type { PixKeyType, WeddingGalleryImage, WeddingSite } from "@/types/wedding";

const PIX_KEY_TYPES: PixKeyType[] = ["cpf", "cnpj", "email", "phone", "random"];
const MAX_GALLERY = 40;

export type AutosaveResult = { ok?: boolean; error?: string };

/**
 * Auto-save do editor ao vivo: recebe o WeddingSite inteiro e persiste TODO o
 * conteúdo (textos + imagens). Guarda o que o cliente não pode ditar:
 * id/owner/slug/status vêm sempre da linha; monogram/templateName são derivados;
 * presentes vêm do banco (geridos em /presentes); imagens só entram se forem do
 * storage do próprio dono ou já existirem no site. Body é só JSON (arquivos sobem
 * direto pro Storage), então não esbarra no limite de 1 MB das Server Actions.
 */
export async function autosaveWeddingAction(input: WeddingSite): Promise<AutosaveResult> {
  const ctx = await getActingContext();
  const supabase = ctx.db;
  const { data, error: loadError } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", ctx.ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const row = (data as WeddingRow) ?? null;
  if (!row) {
    if (loadError) {
      await logServerError("editor.autosave.load", loadError, {
        event: "autosave_failed",
        userId: ctx.ownerId,
        path: "/editor"
      });
    }
    return { error: "Casamento não encontrado." };
  }

  // A aba foi aberta para OUTRO casamento (o cookie de suporte mudou, expirou ou saiu em outra
  // aba): nunca gravar um site por cima de outro.
  if (input?.id !== row.id) return { error: "A conta aberta mudou. Recarregue a página." };

  const site = rowToWeddingSite(row); // autoritativo p/ id/owner/slug/status/gifts

  const coupleNames = String(input.coupleNames ?? "").trim();
  if (coupleNames.length < 3) return { error: "Informe o nome do casal." };
  if (!isTemplateId(input.templateId)) return { error: "Modelo inválido." };
  const pixKeyType: PixKeyType = (PIX_KEY_TYPES as string[]).includes(input.pixKeyType) ? input.pixKeyType : "random";
  const pixKey = String(input.pixKey ?? "").trim();
  const pixHolderName = String(input.pixHolderName ?? "").trim();
  // Modo suporte: Pix é dinheiro. Qualquer diferença do que está salvo é bloqueada (e auditada).
  if (
    ctx.support &&
    (pixKey !== site.pixKey.trim() ||
      pixHolderName !== site.pixHolderName.trim() ||
      (pixKey !== "" && pixKeyType !== site.pixKeyType))
  ) {
    const blocked = await guardSupportWrite(ctx, "pix_change", row.id);
    if (!blocked.ok) return { error: blocked.message };
  }

  // Imagens: só storage do dono ou já existentes (evita URLs forasteiras). No modo suporte o
  // upload do navegador cai na pasta do admin (RLS do storage é por auth.uid()).
  const existing = new Set<string>([
    site.heroImage,
    site.footerImage,
    ...site.gallery.map((g) => g.src),
    ...site.locations.map((l) => l.image),
    ...site.detailCards.map((c) => c.image),
    ...site.gifts.map((g) => g.image ?? "")
  ]);
  const okSrc = (s: string) =>
    Boolean(
      s &&
        (isOwnerPhotoUrl(s, ctx.ownerId) ||
          existing.has(s) ||
          (ctx.support !== null && isOwnerPhotoUrl(s, ctx.support.adminId)))
    );
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

  const guard = await guardSupportWrite(ctx, "autosave", row.id);
  if (!guard.ok) return { error: guard.message };

  const { error } = await supabase
    .from("weddings")
    .update({
      couple_names: coupleNames,
      // Suporte nunca grava as colunas do Pix (conferido acima).
      ...(ctx.support
        ? {}
        : { pix_key: pixKey || null, pix_key_type: pixKey ? pixKeyType : null, pix_holder_name: pixHolderName || null }),
      content: contentToJson(extractContent(merged))
    })
    .eq("id", row.id);

  if (error) {
    await logServerError("editor.autosave", error, {
      event: "autosave_failed",
      userId: ctx.ownerId,
      weddingId: row.id,
      path: "/editor"
    });
    return { error: "Não foi possível salvar." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/casamento/${row.slug}`);
  return { ok: true };
}
