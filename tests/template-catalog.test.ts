import { existsSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GIFT_ASPECT_BY_TEMPLATE } from "@/lib/gift-image";
import { DEMO_SHOOTS } from "@/lib/demo-photos";
import { TEMPLATE_CHOICES } from "@/lib/template-options";
import {
  ACTIVE_TEMPLATES,
  TEMPLATES,
  TEMPLATE_FAMILIES,
  TEMPLATE_IDS,
  TEMPLATE_NAMES,
  getTemplate,
  isTemplateId,
  templatesOfFamily
} from "@/lib/templates/catalog";

describe("catálogo de modelos", () => {
  it("tem ids únicos, estáveis (slug) e ao menos 30 modelos ativos em 10 famílias com 3+ cada", () => {
    expect(new Set(TEMPLATE_IDS).size).toBe(TEMPLATE_IDS.length);
    for (const id of TEMPLATE_IDS) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(ACTIVE_TEMPLATES.length).toBeGreaterThanOrEqual(30);
    expect(TEMPLATE_FAMILIES.length).toBe(10);
    for (const family of TEMPLATE_FAMILIES) {
      expect(templatesOfFamily(family.id).length, family.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("mantém os ids antigos (sites publicados continuam renderizando)", () => {
    for (const legacy of [
      "classico-romantico",
      "civil-minimalista",
      "garden-classico",
      "olive-burgundy",
      "editorial-luxury",
      "jardim-romantico",
      "pe-na-areia",
      "cinema-noir"
    ]) {
      expect(isTemplateId(legacy), legacy).toBe(true);
    }
    expect(getTemplate("nao-existe").id).toBe("classico-romantico");
  });

  it("cada modelo tem componente, CSS, nome, descrição, fontes, amostra e ensaio válido", () => {
    for (const template of TEMPLATES) {
      const dir = `src/components/templates/${template.id}`;
      expect(existsSync(dir), dir).toBe(true);
      const files = readdirSync(dir);
      expect(files.some((f) => f.endsWith("Template.tsx")), `${dir} sem *Template.tsx`).toBe(true);
      expect(files.some((f) => f.endsWith(".module.css")), `${dir} sem CSS module`).toBe(true);
      expect(template.name.length).toBeGreaterThan(2);
      expect(template.tagline.length).toBeGreaterThan(10);
      expect(template.description.length).toBeGreaterThan(40);
      expect(template.styles.length).toBeGreaterThan(0);
      for (const color of template.swatch) expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(TEMPLATE_NAMES[template.id]).toBe(template.name);
      expect(GIFT_ASPECT_BY_TEMPLATE[template.id]).toBe(template.giftAspect);
      if (template.demoShoot) expect(DEMO_SHOOTS[template.demoShoot].gallery.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("o registry do editor cobre exatamente os ids do catálogo", async () => {
    const fs = await import("node:fs/promises");
    const client = await fs.readFile("src/components/templates/registry.client.tsx", "utf8");
    const clientIds = [...client.matchAll(/import\("\.\/([a-z0-9-]+)\//g)].map((m) => m[1]);
    expect(new Set(clientIds)).toEqual(new Set(TEMPLATE_IDS));
  });

  it("cada modelo tem o segmento de rota interno gerado (site e demo)", () => {
    for (const id of TEMPLATE_IDS) {
      expect(existsSync(`src/app/tpl/${id}/site/[slug]/page.tsx`), `${id}: rode node scripts/gen-template-routes.mjs`).toBe(true);
      expect(existsSync(`src/app/tpl/${id}/demo/[slug]/page.tsx`), `${id}: rode node scripts/gen-template-routes.mjs`).toBe(true);
    }
    const generated = readdirSync("src/app/tpl");
    expect(new Set(generated)).toEqual(new Set(TEMPLATE_IDS));
  });

  it("cada modelo ativo tem as três prévias da vitrine (capture-templates.py assets)", () => {
    for (const template of ACTIVE_TEMPLATES) {
      for (const kind of ["phone", "full", "desktop"]) {
        expect(existsSync(`public/assets/templates/${template.id}-${kind}.webp`), `${template.id}-${kind}.webp`).toBe(true);
      }
    }
  });

  it("o seletor oferece só os ativos, na ordem do catálogo", () => {
    expect(TEMPLATE_CHOICES.map((c) => c.id)).toEqual(ACTIVE_TEMPLATES.map((t) => t.id));
    expect(TEMPLATE_CHOICES.some((c) => c.id === "olive-burgundy")).toBe(false);
  });
});
