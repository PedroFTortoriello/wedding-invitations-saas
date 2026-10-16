"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getActingContext, guardSupportWrite, type ActingContext } from "@/lib/acting";
import { logServerError } from "@/lib/funnel";
import { normalizeGiftImage, type GiftImageFraming } from "@/lib/gift-image";
import { formatBRL } from "@/lib/gift-price";
import { contentToJson, extractContent, isOwnerPhotoUrl, rowToWeddingSite, type WeddingRow } from "@/lib/wedding";
import type { WeddingGift } from "@/types/wedding";

export type GiftActionState = { error?: string; ok?: boolean };

/** Campo numérico opcional do formulário: vazio/ausente vira undefined (e cai no padrão). */
function optionalNumber(value: FormDataEntryValue | null) {
  return value === null || value === "" ? undefined : Number(value);
}

async function loadOwnedRow() {
  const ctx = await getActingContext();
  const { data, error } = await ctx.db
    .from("weddings")
    .select("*")
    .eq("owner_id", ctx.ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) await logServerError("presentes.load", error, { userId: ctx.ownerId, path: "/presentes" });
  return { ctx, supabase: ctx.db, row: (data as WeddingRow) ?? null };
}

/** Foto enviada pelo navegador: pasta do dono, ou do admin no modo suporte (RLS do storage é por auth.uid()). */
function isUploadedPhoto(ctx: ActingContext, url: string, ownerId: string) {
  return isOwnerPhotoUrl(url, ownerId) || (ctx.support !== null && isOwnerPhotoUrl(url, ctx.support.adminId));
}

async function saveGifts(
  supabase: ActingContext["db"],
  row: WeddingRow,
  gifts: WeddingGift[]
) {
  const content = extractContent({ ...rowToWeddingSite(row), gifts });
  const { error } = await supabase.from("weddings").update({ content: contentToJson(content) }).eq("id", row.id);
  if (error) {
    await logServerError("presentes.save", error, { userId: row.owner_id, weddingId: row.id, path: "/presentes" });
  }
  revalidatePath("/presentes");
  revalidatePath(`/casamento/${row.slug}`);
  return error;
}

export async function addGiftAction(_prev: GiftActionState, formData: FormData): Promise<GiftActionState> {
  const { ctx, supabase, row } = await loadOwnedRow();
  if (!row) return { error: "Casamento não encontrado." };
  // A aba foi aberta para este casamento? (modo suporte: o cookie pode ter trocado de conta)
  if (formData.get("weddingId") !== row.id) return { error: "A conta aberta mudou. Recarregue a página." };

  const title = String(formData.get("title") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim() || "Valor livre";
  const description = String(formData.get("description") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();

  if (title.length < 2) return { error: "Dê um nome à cota de presente." };

  const safeImage = image && isUploadedPhoto(ctx, image, row.owner_id) ? image : undefined;

  const gift: WeddingGift = {
    id: randomUUID(),
    title,
    description,
    price,
    link: "#presentes",
    image: safeImage,
    // Enquadramento só faz sentido com foto; ausente ou inválido cai em "Foto inteira" centralizada.
    ...(safeImage
      ? normalizeGiftImage({
          imageFit: formData.get("imageFit"),
          imageFocus: { x: optionalNumber(formData.get("imageFocusX")), y: optionalNumber(formData.get("imageFocusY")) },
          imageZoom: optionalNumber(formData.get("imageZoom"))
        })
      : {}),
    active: true
  };

  const guard = await guardSupportWrite(ctx, "gifts_add", row.id);
  if (!guard.ok) return { error: guard.message };

  const error = await saveGifts(supabase, row, [...rowToWeddingSite(row).gifts, gift]);
  if (error) return { error: "Não foi possível salvar a cota." };
  return { ok: true };
}

/** "Adicionar" no catálogo: o item vem do banco pelo id — nome, valor e foto nunca vêm do navegador. */
export async function addCatalogGiftAction(_prev: GiftActionState, formData: FormData): Promise<GiftActionState> {
  const { ctx, supabase, row } = await loadOwnedRow();
  if (!row) return { error: "Casamento não encontrado." };
  if (formData.get("weddingId") !== row.id) return { error: "A conta aberta mudou. Recarregue a página." };

  const { data: item, error: loadError } = await supabase
    .from("gift_catalog")
    .select("id, title, description, price, image")
    .eq("id", String(formData.get("catalogId") ?? ""))
    .eq("active", true) // modo suporte usa service role, que ignora a RLS
    .maybeSingle();
  if (loadError) await logServerError("presentes.catalog", loadError, { userId: row.owner_id, path: "/presentes" });
  if (!item) return { error: "Esse presente saiu do catálogo. Recarregue a página." };

  const gifts = rowToWeddingSite(row).gifts;
  // Clique duplo ou outra aba: já está na lista, nada a fazer.
  if (gifts.some((gift) => gift.catalogId === item.id)) return { ok: true };

  const guard = await guardSupportWrite(ctx, "gifts_add", row.id);
  if (!guard.ok) return { error: guard.message };

  const gift: WeddingGift = {
    id: randomUUID(),
    title: item.title,
    description: item.description,
    // formatBRL usa espaço não separável; as cotas digitadas usam espaço comum.
    price: item.price ? formatBRL(Number(item.price)).replace(/\s/g, " ") : "Valor livre",
    link: "#presentes",
    image: item.image,
    // Fotos do catálogo são de ambiente, não de produto: preenchem o quadro do modelo.
    ...normalizeGiftImage({ imageFit: "cover" }),
    catalogId: item.id,
    active: true
  };
  const error = await saveGifts(supabase, row, [...gifts, gift]);
  if (error) return { error: "Não foi possível adicionar o presente." };
  return { ok: true };
}

/** "Editar" de uma cota existente: nome, valor e descrição. */
export async function updateGiftDetailsAction(formData: FormData): Promise<GiftActionState> {
  const { ctx, supabase, row } = await loadOwnedRow();
  if (!row) return { error: "Casamento não encontrado." };

  const giftId = String(formData.get("giftId") ?? "");
  const gifts = rowToWeddingSite(row).gifts;
  if (!gifts.some((gift) => gift.id === giftId)) return { error: "Cota não encontrada. Recarregue a página." };

  const title = String(formData.get("title") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim() || "Valor livre";
  const description = String(formData.get("description") ?? "").trim();
  if (title.length < 2) return { error: "Dê um nome à cota de presente." };

  const guard = await guardSupportWrite(ctx, "gifts_edit", row.id);
  if (!guard.ok) return { error: guard.message };

  const error = await saveGifts(
    supabase,
    row,
    gifts.map((gift) => (gift.id === giftId ? { ...gift, title, price, description } : gift))
  );
  if (error) return { error: "Não foi possível salvar a cota." };
  return { ok: true };
}

export async function removeGiftAction(formData: FormData) {
  const { ctx, supabase, row } = await loadOwnedRow();
  if (!row) return;
  if (!(await guardSupportWrite(ctx, "gifts_remove", row.id)).ok) return;
  const giftId = String(formData.get("giftId") ?? "");
  await saveGifts(supabase, row, rowToWeddingSite(row).gifts.filter((gift) => gift.id !== giftId));
}

export async function toggleGiftAction(formData: FormData) {
  const { ctx, supabase, row } = await loadOwnedRow();
  if (!row) return;
  if (!(await guardSupportWrite(ctx, "gifts_toggle", row.id)).ok) return;
  const giftId = String(formData.get("giftId") ?? "");
  await saveGifts(
    supabase,
    row,
    rowToWeddingSite(row).gifts.map((gift) => (gift.id === giftId ? { ...gift, active: !gift.active } : gift))
  );
}

export type GiftImageInput = Partial<GiftImageFraming> & { image?: string };

/** Ajuste da foto de uma cota existente ("Ajustar foto" em /presentes): troca a imagem e/ou o enquadramento. */
export async function updateGiftImageAction(giftId: string, input: GiftImageInput): Promise<GiftActionState> {
  const { ctx, supabase, row } = await loadOwnedRow();
  if (!row) return { error: "Casamento não encontrado." };

  const gifts = rowToWeddingSite(row).gifts;
  const gift = typeof giftId === "string" ? gifts.find((item) => item.id === giftId) : undefined;
  if (!gift) return { error: "Cota não encontrada. Recarregue a página." };

  // Entrada vem do cliente: nada é confiável além do que validamos aqui.
  const raw: Record<string, unknown> = typeof input === "object" && input !== null ? input : {};
  const requested = typeof raw.image === "string" ? raw.image.trim() : "";
  const image = requested || gift.image;
  if (!image) return { error: "Essa cota não tem foto para ajustar." };
  if (image !== gift.image && !isUploadedPhoto(ctx, image, row.owner_id)) {
    return { error: "Não foi possível usar essa imagem. Envie a foto de novo." };
  }

  const guard = await guardSupportWrite(ctx, "gifts_image", row.id);
  if (!guard.ok) return { error: guard.message };

  const framing = normalizeGiftImage(raw);
  const error = await saveGifts(
    supabase,
    row,
    gifts.map((item) => (item.id === gift.id ? { ...item, image, ...framing } : item))
  );
  if (error) return { error: "Não foi possível salvar o ajuste da foto." };
  return { ok: true };
}
