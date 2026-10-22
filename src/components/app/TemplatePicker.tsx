"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/app/icons";
import { templateAsset } from "@/lib/template-assets";
import { ACTIVE_TEMPLATES, TEMPLATE_FAMILIES, type TemplateFamilyId } from "@/lib/templates/catalog";
import type { WeddingSite } from "@/types/wedding";

type TemplatePickerProps = {
  name: string;
  /** Controlado (editor) … */
  value?: WeddingSite["templateId"];
  onChange?: (id: WeddingSite["templateId"]) => void;
  /** … ou não controlado (formulário do onboarding). */
  defaultValue?: WeddingSite["templateId"];
  columns?: 1 | 2;
};

const CHIP =
  "inline-flex min-h-9 cursor-pointer items-center rounded-full border border-line px-3 text-[0.8125rem] font-semibold text-ink-soft transition-colors duration-150 hover:border-line-strong hover:text-ink aria-pressed:border-forest aria-pressed:bg-forest aria-pressed:text-on-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest motion-reduce:transition-none";

/**
 * Seletor de modelo: cartões de rádio agrupados por família, com a prévia real do
 * convite no celular, nome, uma linha de personalidade, a paleta e o link da demo.
 * Filtro por família só esconde (os rádios continuam no DOM: o valor marcado nunca
 * some do formulário do onboarding).
 */
export function TemplatePicker({ name, value, onChange, defaultValue, columns = 1 }: TemplatePickerProps) {
  const [family, setFamily] = useState<TemplateFamilyId | "todas">("todas");
  const families = TEMPLATE_FAMILIES.filter((f) => ACTIVE_TEMPLATES.some((t) => t.family === f.id));

  return (
    <fieldset>
      <legend className="sr-only">Modelo do site</legend>

      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por família">
        <button type="button" className={CHIP} aria-pressed={family === "todas"} onClick={() => setFamily("todas")}>
          Todas
        </button>
        {families.map((f) => (
          <button key={f.id} type="button" className={CHIP} aria-pressed={family === f.id} onClick={() => setFamily(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5">
        {families.map((f) => {
          const hidden = family !== "todas" && family !== f.id;
          return (
            <div key={f.id} hidden={hidden} className={hidden ? "hidden" : "grid gap-2"}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">{f.label}</p>
              <div className={`grid gap-2 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
                {ACTIVE_TEMPLATES.filter((t) => t.family === f.id).map((t) => (
                  <div
                    key={t.id}
                    className="group relative flex items-stretch gap-3 rounded-xl border border-line bg-field p-2.5 transition-colors duration-150 hover:border-line-strong has-checked:border-forest has-checked:shadow-[0_0_0_1px_var(--color-forest)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-forest motion-reduce:transition-none"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        name={name}
                        value={t.id}
                        className="sr-only"
                        {...(onChange
                          ? { checked: value === t.id, onChange: () => onChange(t.id) }
                          : { defaultChecked: defaultValue === t.id })}
                      />
                      <span className="relative block h-[5.5rem] w-11 shrink-0 overflow-hidden rounded-md border border-line bg-bg-2" aria-hidden>
                        <Image src={templateAsset(t.id, "phone")} alt="" fill sizes="44px" className="object-cover object-top" />
                      </span>
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[0.9375rem] font-semibold text-ink">{t.name}</span>
                          <span className="flex shrink-0 gap-0.5" aria-hidden>
                            {t.swatch.map((color) => (
                              <span key={color} className="size-2.5 rounded-full border border-ink/15" style={{ background: color }} />
                            ))}
                          </span>
                        </span>
                        <span className="text-[0.8125rem] leading-snug text-ink-soft">{t.tagline}</span>
                        <span className="text-[0.75rem] leading-snug text-ink-soft">
                          {t.fonts[0]} · {t.fonts[1]}
                        </span>
                      </span>
                      <span className="grid size-5 shrink-0 place-items-center rounded-full border border-line-strong text-transparent transition-colors duration-150 group-has-checked:border-forest group-has-checked:bg-forest group-has-checked:text-on-forest motion-reduce:transition-none">
                        <Icon name="check" size={12} strokeWidth={3} />
                      </span>
                    </label>
                    <a
                      href={`/modelo/${t.id}/helena-e-lucas`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Ver a demonstração do modelo ${t.name} em uma nova aba`}
                      className="grid w-9 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors duration-150 hover:bg-bg-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest motion-reduce:transition-none"
                    >
                      <Icon name="eye" size={16} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
