"use client";

import { useActionState } from "react";
import { createWeddingAction, type CreateWeddingState } from "./actions";

const TEMPLATE_OPTIONS: { id: string; label: string }[] = [
  { id: "classico-romantico", label: "Clássico Romântico" },
  { id: "civil-minimalista", label: "Civil Minimalista" },
  { id: "garden-classico", label: "Jardim Clássico" },
  { id: "olive-burgundy", label: "Olive Burgundy — Save the Date" }
];

const initialState: CreateWeddingState = {};

const fieldClass = "min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4 text-ink";
const labelClass = "grid gap-2 text-sm font-bold text-ink-soft";

export function OnboardingForm({ defaultCoupleNames }: { defaultCoupleNames: string }) {
  const [state, formAction, pending] = useActionState(createWeddingAction, initialState);

  return (
    <form action={formAction} className="card p-6">
      <p className="t-eyebrow text-ink-soft">Dados do casal</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className={`${labelClass} md:col-span-2`}>
          Nome do casal
          <input
            name="coupleNames"
            type="text"
            required
            defaultValue={defaultCoupleNames}
            placeholder="Pedro & Rafaela"
            className={fieldClass}
          />
        </label>

        <label className={`${labelClass} md:col-span-2`}>
          URL do site (deixe em branco para gerar automaticamente)
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-ink-soft">/casamento/</span>
            <input name="slug" type="text" placeholder="pedro-e-rafaela" className={`${fieldClass} w-full`} />
          </div>
        </label>

        <label className={labelClass}>
          Modelo
          <select name="templateId" defaultValue="classico-romantico" className={fieldClass}>
            {TEMPLATE_OPTIONS.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Cidade do evento
          <input name="city" type="text" placeholder="Porto Feliz, SP" className={fieldClass} />
        </label>

        <label className={labelClass}>
          Data
          <input name="weddingDate" type="date" className={fieldClass} />
        </label>

        <label className={labelClass}>
          Horário
          <input name="weddingTime" type="time" className={fieldClass} />
        </label>

        <label className={`${labelClass} md:col-span-2`}>
          Local (venue)
          <input name="venue" type="text" placeholder="Casa Fasano Boa Vista" className={fieldClass} />
        </label>
      </div>

      {state.error ? (
        <p role="alert" className="mt-5 rounded-2xl bg-[#8d3d33]/10 px-4 py-3 text-sm font-bold text-[#8d3d33]">
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary mt-6 w-full text-sm disabled:opacity-60">
        {pending ? "Criando…" : "Criar e ir para o editor"}
      </button>
    </form>
  );
}
