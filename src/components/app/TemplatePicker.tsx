"use client";

import { TEMPLATE_CHOICES } from "@/lib/template-options";
import { Icon } from "@/components/app/icons";
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

/** Seletor de modelo em cartões de rádio: nome, uma linha de personalidade e a paleta. */
export function TemplatePicker({ name, value, onChange, defaultValue, columns = 1 }: TemplatePickerProps) {
  return (
    <fieldset>
      <legend className="sr-only">Modelo do site</legend>
      <div className={`grid gap-2 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
        {TEMPLATE_CHOICES.map((t) => (
          <label
            key={t.id}
            className="group relative flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-field p-3 transition-colors duration-150 hover:border-line-strong has-checked:border-forest has-checked:shadow-[0_0_0_1px_var(--color-forest)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-forest"
          >
            <input
              type="radio"
              name={name}
              value={t.id}
              className="sr-only"
              {...(onChange
                ? { checked: value === t.id, onChange: () => onChange(t.id) }
                : { defaultChecked: defaultValue === t.id })}
            />
            <span className="flex h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line" aria-hidden>
              <span className="w-1/2" style={{ background: t.swatch[0] }} />
              <span className="w-1/4" style={{ background: t.swatch[1] }} />
              <span className="w-1/4" style={{ background: t.swatch[2] }} />
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="text-[0.9375rem] font-semibold text-ink">{t.label}</span>
              <span className="text-[0.8125rem] leading-snug text-ink-soft">{t.tagline}</span>
            </span>
            <span className="grid size-5 shrink-0 place-items-center rounded-full border border-line-strong text-transparent transition-colors duration-150 group-has-checked:border-forest group-has-checked:bg-forest group-has-checked:text-on-forest">
              <Icon name="check" size={12} strokeWidth={3} />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
