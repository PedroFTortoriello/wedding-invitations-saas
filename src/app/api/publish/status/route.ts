import { NextResponse } from "next/server";
import { getActingContext } from "@/lib/acting";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Status de publicação do casamento do usuário logado, consultado pela tela
 * /publicar enquanto o Pix confirma. Só { status, paid } — nada mais sai daqui.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  // Leitura: vale no modo suporte (dono = cliente). Mesmo critério de getOwnedWeddingRow.
  const ctx = await getActingContext();
  const { data } = await ctx.db
    .from("weddings")
    .select("status, publish_paid_at")
    .eq("owner_id", ctx.ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
  }

  return NextResponse.json({ status: data.status, paid: Boolean(data.publish_paid_at) }, { headers: NO_STORE });
}
