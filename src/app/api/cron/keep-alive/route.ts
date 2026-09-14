import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Keep-alive: o Vercel Cron bate aqui (ver vercel.json) e faz um SELECT trivial
 * no Postgres para que o Supabase não considere o projeto inativo e o pause
 * (free tier pausa após ~7 dias sem tráfego). Rodando 1x/dia fica muito dentro
 * da janela. `head: true` não transfere linhas — só conta.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "keep-alive falhou";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
