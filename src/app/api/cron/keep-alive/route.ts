import { NextResponse } from "next/server";
import { timingSafeEqualStr } from "@/lib/abacatepay";
import { logServerError } from "@/lib/funnel";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Keep-alive: o Vercel Cron bate aqui (ver vercel.json) e faz um SELECT trivial
 * no Postgres para que o Supabase não considere o projeto inativo e o pause
 * (free tier pausa após ~7 dias sem tráfego). Rodando 1x/dia fica muito dentro
 * da janela. `head: true` não transfere linhas — só conta.
 */
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Retenção dos identificadores de anúncio em funnel_events (migration 0013). Só com
    // o CRON_SECRET do Vercel Cron: o SELECT acima segue público (inofensivo), a escrita
    // não. Sem a função no banco registra no funil (visível no admin) e não derruba o keep-alive.
    const secret = process.env.CRON_SECRET;
    if (secret && timingSafeEqualStr(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
      const { error: purgeError } = await supabase.rpc("purge_funnel_ad_ids");
      if (purgeError) await logServerError("cron.purge_funnel_ad_ids", purgeError, { path: "/api/cron/keep-alive" });
    }

    return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "keep-alive falhou";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
