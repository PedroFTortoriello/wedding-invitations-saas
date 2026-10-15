import type { MetadataRoute } from "next";
import { SHOWCASE_IDS, demoPath } from "@/components/landing/showcase";

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Só páginas da marca. Sites de casal (/casamento/*) nunca entram: são dos convidados. */
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/termos", "/privacidade", ...SHOWCASE_IDS.map(demoPath)].map((path) => ({ url: `${APP_URL}${path}` }));
}
