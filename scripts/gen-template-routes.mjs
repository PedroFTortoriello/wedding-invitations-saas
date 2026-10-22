/**
 * Gera um segmento de rota interno por modelo (ver components/templates/site-page.tsx):
 *   src/app/tpl/<id>/site/[slug]/page.tsx   e   src/app/tpl/<id>/demo/[slug]/page.tsx
 * a partir dos ids do catálogo e dos componentes do registry.client.tsx. Rode ao
 * adicionar ou remover um modelo:  node scripts/gen-template-routes.mjs
 * Apaga as pastas de ids que saíram do catálogo. tests/template-catalog.test.ts confere.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "src", "app", "tpl");

const registry = readFileSync(join(ROOT, "src", "components", "templates", "registry.client.tsx"), "utf8");
const entries = [...registry.matchAll(/import\("\.\/([a-z0-9-]+)\/(\w+)"\)\.then\(\(m\) => m\.(\w+)\)/g)].map((m) => ({
  id: m[1],
  file: m[2],
  component: m[3]
}));
if (!entries.length) throw new Error("Nenhum modelo encontrado em registry.client.tsx");

const HEADER = "// Gerado por scripts/gen-template-routes.mjs — não edite à mão.\n";

for (const { id, file, component } of entries) {
  const site = `${HEADER}import { ${component} } from "@/components/templates/${id}/${file}";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(${component});
export const generateMetadata = page.generateMetadata;
export default page.Page;
`;
  const demo = `${HEADER}import { ${component} } from "@/components/templates/${id}/${file}";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("${id}", ${component});
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;
`;
  for (const [kind, source] of [
    ["site", site],
    ["demo", demo]
  ]) {
    const dir = join(APP, id, kind, "[slug]");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "page.tsx"), source);
  }
}

// Pastas de modelos que saíram do catálogo.
const ids = new Set(entries.map((e) => e.id));
for (const dir of readdirSync(APP, { withFileTypes: true })) {
  if (dir.isDirectory() && !ids.has(dir.name)) rmSync(join(APP, dir.name), { recursive: true });
}

console.log(`${entries.length} modelos: rotas em src/app/tpl/<id>/{site,demo}/[slug]/page.tsx`);
