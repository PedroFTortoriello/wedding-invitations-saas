import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getTemplate } from "@/lib/templates/catalog";

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
  "/publicar",
  "/ia",
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

  // Site do casal: cada modelo tem um segmento de rota interno (/tpl/<id>/site/…) para o
  // HTML sair com o CSS só daquele modelo (ver components/templates/site-page.tsx; as demos
  // são reescritas em next.config). A reescrita não muda a URL do navegador e preserva a
  // query (?presente=…).
  const site = pathname.match(/^\/casamento\/([^/]+)$/);
  if (site) {
    const slug = decodeURIComponent(site[1]);
    // RLS: site publicado para qualquer um; rascunho só para o dono (cookie). Sem linha,
    // a página do modelo padrão mostra "em breve"/404.
    const { data } = await supabase.from("weddings").select("template:content->>templateId").eq("slug", slug).maybeSingle();
    const template = getTemplate(String(data?.template ?? "")).id;
    const url = request.nextUrl.clone();
    url.pathname = `/tpl/${template}/site/${site[1]}`;
    return rewriteKeepingCookies(url, response);
  }
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

/** Reescreve mantendo os cookies de sessão que o refresh acima possa ter gravado. */
function rewriteKeepingCookies(url: URL, from: NextResponse) {
  const rewritten = NextResponse.rewrite(url);
  for (const cookie of from.cookies.getAll()) rewritten.cookies.set(cookie);
  return rewritten;
}

export const config = {
  matcher: [
    // Tudo, menos rotas de API, assets do Next e arquivos estáticos.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"
  ]
};
