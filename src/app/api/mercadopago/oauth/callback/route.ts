import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MP_OAUTH_COOKIE, MercadoPagoApiError, exchangeOAuthCode, fetchMercadoPagoUser } from "@/lib/mercadopago";
import { flagConnectionError, saveMercadoPagoConnection } from "@/lib/mercadopago-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Volta do Mercado Pago: confere o `state` do cookie (anti-CSRF), confirma que o
 * casamento é de quem está logado, troca o `code` pelos tokens e grava a conexão
 * cifrada. O casal volta ao painel com ?mp=conectado|negado|erro.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = process.env.APP_URL?.replace(/\/+$/, "") || url.origin;

  const back = (code: string) => {
    const response = NextResponse.redirect(`${origin}/dashboard?mp=${code}`);
    response.cookies.set(MP_OAUTH_COOKIE, "", { path: "/api/mercadopago", maxAge: 0 });
    return response;
  };

  // O casal clicou em "cancelar" na tela do Mercado Pago.
  if (url.searchParams.get("error")) return back("negado");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const raw = jar.get(MP_OAUTH_COOKIE)?.value;

  if (!code || !state || !raw) return back("erro");

  let session: { state?: string; weddingId?: string; verifier?: string };
  try {
    session = JSON.parse(raw);
  } catch {
    return back("erro");
  }

  if (!session.state || session.state !== state || !session.weddingId) return back("erro");

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const response = NextResponse.redirect(`${origin}/login?next=/dashboard`);
    response.cookies.set(MP_OAUTH_COOKIE, "", { path: "/api/mercadopago", maxAge: 0 });
    return response;
  }

  const admin = createAdminClient();
  const { data: wedding } = await admin
    .from("weddings")
    .select("id, owner_id")
    .eq("id", session.weddingId)
    .maybeSingle();

  if (!wedding || wedding.owner_id !== user.id) return back("erro");

  try {
    const tokens = await exchangeOAuthCode({ code, codeVerifier: session.verifier });
    const mpUser = await fetchMercadoPagoUser(tokens.access_token).catch(() => null);
    await saveMercadoPagoConnection({ weddingId: wedding.id, tokens, user: mpUser });

    // Sem offline_access não dá para renovar: o acesso morre em 180 dias.
    if (!tokens.scope?.includes("offline_access")) {
      await flagConnectionError(wedding.id, "a aplicação não recebeu offline_access: a renovação automática não funciona");
    }
  } catch (err) {
    // Nunca logar o corpo da resposta: ela carrega tokens.
    console.error("Mercado Pago: OAuth falhou", err instanceof MercadoPagoApiError ? err.code : err);
    return back("erro");
  }

  return back("conectado");
}
