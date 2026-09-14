import { NextResponse } from "next/server";
import {
  MP_OAUTH_COOKIE,
  buildAuthorizationUrl,
  createOAuthState,
  createPkcePair,
  isMercadoPagoConfigured,
  isPkceEnabled
} from "@/lib/mercadopago";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Início da conexão: manda o casal para o Mercado Pago autorizar a aplicação.
 * O `state` guarda a sessão do fluxo — o redirect_uri precisa ser idêntico ao
 * cadastrado na aplicação, então nada de parâmetros extras nele.
 */
export async function GET(request: Request) {
  const origin = process.env.APP_URL?.replace(/\/+$/, "") || new URL(request.url).origin;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=/dashboard`);
  }

  // Mesma regra do painel: o casamento mais antigo do usuário (MVP: um por conta).
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!wedding) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  if (!isMercadoPagoConfigured()) {
    return NextResponse.redirect(`${origin}/dashboard?mp=erro`);
  }

  try {
    const state = createOAuthState();
    const pkce = isPkceEnabled() ? createPkcePair() : null;
    const authorizationUrl = buildAuthorizationUrl({ state, codeChallenge: pkce?.challenge });

    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(MP_OAUTH_COOKIE, JSON.stringify({ state, weddingId: wedding.id, verifier: pkce?.verifier }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // lax: a volta do Mercado Pago é uma navegação cross-site (strict perderia o cookie).
      sameSite: "lax",
      path: "/api/mercadopago",
      maxAge: 600
    });
    return response;
  } catch (err) {
    console.error("Mercado Pago: não foi possível montar a autorização", err);
    return NextResponse.redirect(`${origin}/dashboard?mp=erro`);
  }
}
