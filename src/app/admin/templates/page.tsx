import Image from "next/image";
import { AdminShell } from "@/components/app/AdminShell";
import { ADMIN_WEDDING_COLUMNS, fetchAll, formatPercent, templateIdOf } from "@/components/admin/data";
import { StatStrip } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { platformTemplates } from "@/lib/platform-data";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATE_CHOICES } from "@/lib/template-options";
import { TEMPLATE_IDS, TEMPLATE_NAMES } from "@/lib/wedding";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const weddings = await fetchAll((from, to) => supabase.from("weddings").select(ADMIN_WEDDING_COLUMNS).order("id").range(from, to));

  const usage = new Map<string, { total: number; published: number; lastUsedAt: string | null }>();
  for (const wedding of weddings) {
    const id = templateIdOf(wedding.template);
    const item = usage.get(id) ?? { total: 0, published: 0, lastUsedAt: null };
    item.total += 1;
    if (wedding.status === "published") item.published += 1;
    if (!item.lastUsedAt || wedding.created_at > item.lastUsedAt) item.lastUsedAt = wedding.created_at;
    usage.set(id, item);
  }

  const rows = TEMPLATE_IDS.map((id) => {
    const catalog = platformTemplates.find((template) => template.id === id);
    const choice = TEMPLATE_CHOICES.find((template) => template.id === id);
    return {
      id,
      name: TEMPLATE_NAMES[id],
      description: choice?.tagline ?? catalog?.description ?? "Sem descrição no catálogo.",
      image: catalog?.previewImage ?? null,
      swatch: choice?.swatch ?? null,
      offered: Boolean(choice),
      usage: usage.get(id) ?? { total: 0, published: 0, lastUsedAt: null }
    };
  }).sort((a, b) => b.usage.total - a.usage.total || Number(b.offered) - Number(a.offered) || a.name.localeCompare(b.name, "pt-BR"));

  const max = Math.max(1, ...rows.map((row) => row.usage.total));
  const top = rows[0]?.usage.total ? rows[0] : null;
  const unused = rows.filter((row) => row.offered && row.usage.total === 0).length;

  return (
    <AdminShell
      title="Modelos"
      subtitle="Os modelos de site, quantos casais usam cada um e quais aparecem para quem cria um casamento."
      active="templates"
    >
      <div className="grid gap-5">
        <StatStrip
          label="Resumo dos modelos"
          className="lg:grid-cols-4"
          stats={[
            { label: "Modelos no sistema", value: String(rows.length), note: `${TEMPLATE_CHOICES.length} oferecidos no seletor` },
            { label: "Casamentos", value: String(weddings.length), note: "Somando todos os modelos" },
            {
              label: "Mais usado",
              value: top ? String(top.usage.total) : "—",
              note: top ? `${top.name} · ${formatPercent(top.usage.total, weddings.length)}` : "Nenhum casamento ainda"
            },
            { label: "Oferecidos sem uso", value: String(unused), note: "No seletor, mas nenhum casal escolheu" }
          ]}
        />

        <section className="panel" aria-labelledby="templates-title">
          <div className="px-5 pt-5">
            <h2 id="templates-title" className="text-base font-semibold">
              Uso por modelo
            </h2>
            <p className="mt-1 text-sm leading-5 text-ink-soft">
              Do mais usado ao menos usado. Casamentos sem modelo gravado contam como Clássico Romântico, o padrão.
            </p>
          </div>
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {rows.map((row) => (
              <li key={row.id} className="grid gap-4 px-5 py-4 sm:grid-cols-[7.5rem_minmax(0,1fr)_minmax(0,14rem)] sm:items-center">
                <div className="relative hidden aspect-[4/3] overflow-hidden rounded-lg bg-bg-2 sm:block">
                  {row.image ? (
                    <Image src={row.image} alt={`Prévia do modelo ${row.name}`} fill sizes="120px" className="object-cover" />
                  ) : row.swatch ? (
                    <span className="grid h-full grid-cols-3" aria-hidden>
                      {row.swatch.map((color) => (
                        <span key={color} style={{ background: color }} />
                      ))}
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <h3 className="text-[0.9375rem] font-semibold text-ink">{row.name}</h3>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.offered ? "bg-forest/10 text-forest" : "border border-line-strong text-ink-soft"
                      }`}
                    >
                      {row.offered ? "No seletor" : "Fora do seletor"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-soft">{row.description}</p>
                  <p className="mt-1 text-[0.8125rem] text-ink-soft">
                    <code className="font-mono">{row.id}</code>
                  </p>
                </div>
                <div>
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="font-serif text-[1.75rem] leading-none tabular-nums text-ink">{row.usage.total}</span>
                    <span className="text-sm tabular-nums text-ink-soft">{formatPercent(row.usage.total, weddings.length)} do total</span>
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-forest/8" aria-hidden>
                    <div
                      className="h-full rounded-full bg-forest"
                      style={{ width: `${row.usage.total ? Math.max(2, (row.usage.total / max) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[0.8125rem] text-ink-soft">
                    {row.usage.total === 0
                      ? "Nenhum casamento com este modelo"
                      : `${row.usage.published} ${row.usage.published === 1 ? "publicado" : "publicados"} · ${row.usage.total - row.usage.published} em rascunho ou inativos`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}
