import type { MetadataRoute } from "next";
import { demoPath } from "@/components/landing/showcase";
import { ACTIVE_TEMPLATES } from "@/lib/templates/catalog";

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Só páginas da marca. Sites de casal (/casamento/*) nunca entram: são dos convidados. */
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/modelos", "/termos", "/privacidade", ...ACTIVE_TEMPLATES.map((template) => demoPath(template.id))].map((path) => ({
    url: `${APP_URL}${path}`
  }));
}
