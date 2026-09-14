"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeName } from "@/lib/public-forms";

async function ownedWedding() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("weddings")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return { supabase, weddingId: (data?.id as string | undefined) ?? undefined };
}

/** Adiciona um ou vários convidados (um nome por linha). Dedup contra a lista atual. */
export async function addGuestsAction(formData: FormData) {
  const { supabase, weddingId } = await ownedWedding();
  if (!weddingId) return;

  const names = String(formData.get("names") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 2 && line.length <= 120);
  if (names.length === 0) return;

  const { data: existing } = await supabase.from("guests").select("name").eq("wedding_id", weddingId);
  const have = new Set((existing ?? []).map((guest) => normalizeName(guest.name)));

  const seen = new Set<string>();
  const rows = names
    .filter((name) => {
      const key = normalizeName(name);
      if (have.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((name) => ({ wedding_id: weddingId, name }));

  if (rows.length > 0) {
    await supabase.from("guests").insert(rows);
    revalidatePath("/convidados");
  }
}

/** Remove um convidado da lista (RLS já restringe ao dono; o eq é redundante e seguro). */
export async function removeGuestAction(formData: FormData) {
  const { supabase, weddingId } = await ownedWedding();
  if (!weddingId) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("guests").delete().eq("id", id).eq("wedding_id", weddingId);
  revalidatePath("/convidados");
}
