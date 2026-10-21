import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Catálogo de cotas (migrations 0018+): toda foto referenciada precisa existir em public/,
// senão o card do painel quebra em produção. O seed e as fotos sobem no mesmo deploy.
const dir = join(process.cwd(), "supabase/migrations");
const migrations = readdirSync(dir).filter((file) => /gift_catalog/.test(file));
const rows = migrations.flatMap((file) =>
  [...readFileSync(join(dir, file), "utf8").matchAll(/^\s*\('([a-z0-9-]+)', '([^']+)', '([^']*(?:''[^']*)*)', .*?'(\/assets\/presentes\/[^']+)'/gm)].map((m) => ({
    file,
    id: m[1],
    category: m[2],
    title: m[3],
    image: m[4]
  }))
);

describe("catálogo de presentes", () => {
  it("tem as migrations e os itens esperados", () => {
    expect(migrations).toContain("0020_gift_catalog_double.sql");
    const ids = new Set(rows.map((row) => row.id));
    expect(ids.size).toBeGreaterThanOrEqual(210); // "pelo menos o dobro" das 105
  });

  it("toda cota aponta para uma foto que existe em public/", () => {
    const missing = rows.filter((row) => !existsSync(join(process.cwd(), "public", row.image))).map((row) => `${row.file}: ${row.id} → ${row.image}`);
    expect(missing).toEqual([]);
  });

  it("ids da 0020 não repetem dentro da própria migration", () => {
    const own = rows.filter((row) => row.file.startsWith("0020")).map((row) => row.id);
    expect(new Set(own).size).toBe(own.length);
  });
});
