import type { MetadataRoute } from "next";

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");

/**
 * Painel, APIs e checkout fora dos buscadores. /lp NÃO entra aqui: as variações de anúncio
 * saem do índice pelo noindex + canonical na home, e um Disallow impediria o robô de ler isso.
 */
const PRIVATE = [
  "/dashboard",
  "/editor",
  "/admin",
  "/api",
  "/checkout",
  "/convidados",
  "/presentes",
  "/mensagens",
  "/onboarding",
  "/coordenacao",
  "/publicar"
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE },
    sitemap: `${APP_URL}/sitemap.xml`
  };
}
