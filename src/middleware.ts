import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rotas que exigem sessão. O site público (/casamento/[slug], /modelo/...) e a
// landing ficam de fora.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/editor",
  "/onboarding",
  "/convidados",
  "/presentes",
  "/mensagens",
  "/checkout",
  "/admin"
];

// Já autenticado não deve ver login/cadastro.
const AUTH_PREFIXES = ["/login", "/cadastro"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Refresca a sessão Supabase (cookie httpOnly) em cada request e protege as
 * rotas do painel. Enquanto o Supabase não estiver configurado (antes da infra
 * de produção), o middleware é um no-op para não derrubar o ambiente.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && matches(pathname, PROTECTED_PREFIXES)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && matches(pathname, AUTH_PREFIXES)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Tudo, menos rotas de API, assets do Next e arquivos estáticos.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"
  ]
};
