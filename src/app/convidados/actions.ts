"use server";

import { revalidatePath } from "next/cache";
import { getActingContext, guardSupportWrite } from "@/lib/acting";
import { logServerError } from "@/lib/funnel";
import { normalizeName } from "@/lib/public-forms";

async function ownedWedding() {
  const ctx = await getActingContext();
  const { data, error } = await ctx.db
    .from("weddings")
    .select("id")
    .eq("owner_id", ctx.ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) await logServerError("convidados.load", error, { userId: ctx.ownerId, path: "/convidados" });
  return { ctx, supabase: ctx.db, userId: ctx.ownerId, weddingId: (data?.id as string | undefined) ?? undefined };
}

/** Adiciona um ou vários convidados (um nome por linha). Dedup contra a lista atual. */
export async function addGuestsAction(formData: FormData) {
  const { ctx, supabase, userId, weddingId } = await ownedWedding();
  // Formulário renderizado para outro casamento (cookie de suporte mudou/expirou): não insere.
  if (!weddingId || formData.get("weddingId") !== weddingId) return;
  const log = { userId, weddingId, path: "/convidados" };

  const names = String(formData.get("names") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 2 && line.length <= 120);
  if (names.length === 0) return;

  const { data: existing, error: listError } = await supabase.from("guests").select("name").eq("wedding_id", weddingId);
  if (listError) await logServerError("convidados.add.list", listError, log);
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
    if (!(await guardSupportWrite(ctx, "guests_add", weddingId)).ok) return;
    const { error } = await supabase.from("guests").insert(rows);
    if (error) await logServerError("convidados.add", error, { ...log, detail: { count: rows.length } });
    revalidatePath("/convidados");
  }
}

/** Remove um convidado da lista (RLS já restringe ao dono; o eq é redundante e seguro). */
export async function removeGuestAction(formData: FormData) {
  const { ctx, supabase, userId, weddingId } = await ownedWedding();
  if (!weddingId) return;
  if (!(await guardSupportWrite(ctx, "guests_remove", weddingId)).ok) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("guests").delete().eq("id", id).eq("wedding_id", weddingId);
  if (error) await logServerError("convidados.remove", error, { userId, weddingId, path: "/convidados" });
  revalidatePath("/convidados");
}
