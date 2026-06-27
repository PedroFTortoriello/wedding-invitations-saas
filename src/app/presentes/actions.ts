"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { contentToJson, extractContent, rowToWeddingSite, type WeddingRow } from "@/lib/wedding";
import type { WeddingGift } from "@/types/wedding";

export type GiftActionState = { error?: string; ok?: boolean };

async function loadOwnedRow() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  return { supabase, row: (data as WeddingRow) ?? null };
}

async function saveGifts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: WeddingRow,
  gifts: WeddingGift[]
) {
  const content = extractContent({ ...rowToWeddingSite(row), gifts });
  const { error } = await supabase.from("weddings").update({ content: contentToJson(content) }).eq("id", row.id);
  revalidatePath("/presentes");
  revalidatePath(`/casamento/${row.slug}`);
  return error;
}

export async function addGiftAction(_prev: GiftActionState, formData: FormData): Promise<GiftActionState> {
  const { supabase, row } = await loadOwnedRow();
  if (!row) return { error: "Casamento não encontrado." };

  const title = String(formData.get("title") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim() || "Valor livre";
  const description = String(formData.get("description") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();

  if (title.length < 2) return { error: "Dê um nome à cota de presente." };

  const gift: WeddingGift = {
    id: randomUUID(),
    title,
    description,
    price,
    link: "#presentes",
    image: image || undefined,
    active: true
  };

  const error = await saveGifts(supabase, row, [...rowToWeddingSite(row).gifts, gift]);
  if (error) return { error: "Não foi possível salvar a cota." };
  return { ok: true };
}

export async function removeGiftAction(formData: FormData) {
  const { supabase, row } = await loadOwnedRow();
  if (!row) return;
  const giftId = String(formData.get("giftId") ?? "");
  await saveGifts(supabase, row, rowToWeddingSite(row).gifts.filter((gift) => gift.id !== giftId));
}

export async function toggleGiftAction(formData: FormData) {
  const { supabase, row } = await loadOwnedRow();
  if (!row) return;
  const giftId = String(formData.get("giftId") ?? "");
  await saveGifts(
    supabase,
    row,
    rowToWeddingSite(row).gifts.map((gift) => (gift.id === giftId ? { ...gift, active: !gift.active } : gift))
  );
}
