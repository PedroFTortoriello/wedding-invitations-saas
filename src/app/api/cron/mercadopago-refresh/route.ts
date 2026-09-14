import { NextResponse } from "next/server";
import { timingSafeEqualStr } from "@/lib/abacatepay";
import { refreshExpiringConnections } from "@/lib/mercadopago-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron diário (ver vercel.json): renova os tokens do Mercado Pago que vencem nos
 * próximos 30 dias. O access_token dura 180 dias, então a janela é folgada — sem
 * isso, a conexão do casal morreria e o cartão pararia de aparecer no site.
 * Protegido por CRON_SECRET (o Vercel manda `Authorization: Bearer <CRON_SECRET>`).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization") ?? "";

  if (!secret || !timingSafeEqualStr(provided, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshExpiringConnections();
    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "renovação falhou";
    console.error("cron mercadopago-refresh falhou", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
