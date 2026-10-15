"use client";

import { useActionState } from "react";
import { Notice } from "@/components/app/Notice";
import { TemplatePicker } from "@/components/app/TemplatePicker";
import { createWeddingAction, type CreateWeddingState } from "./actions";

const initialState: CreateWeddingState = {};

const labelClass = "grid content-start gap-1.5";
const labelText = "text-sm font-medium text-ink";
const legendClass = "text-base font-semibold text-ink";

export function OnboardingForm({ defaultCoupleNames }: { defaultCoupleNames: string }) {
  const [state, formAction, pending] = useActionState(createWeddingAction, initialState);

  return (
    <form action={formAction} className="panel grid gap-8 p-5 sm:p-7">
      <fieldset className="grid gap-4">
        <legend className={`${legendClass} mb-4`}>O casal</legend>
        <label className={labelClass}>
          <span className={labelText}>Nomes do casal</span>
          <input
            name="coupleNames"
            type="text"
            required
            minLength={3}
            defaultValue={defaultCoupleNames}
            placeholder="Helena & Lucas"
            autoComplete="off"
            className="field"
          />
        </label>

        <div className={labelClass}>
          <label htmlFor="onboarding-slug" className={labelText}>
            Endereço do site
          </label>
          <div className="flex items-center rounded-[0.625rem] border border-line-strong bg-field transition-colors duration-150 focus-within:border-forest focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-forest)_18%,transparent)]">
            <span className="whitespace-nowrap pl-3 text-[0.9375rem] text-ink-soft">/casamento/</span>
            <input
              id="onboarding-slug"
              name="slug"
              type="text"
              placeholder="helena-e-lucas"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              aria-describedby="onboarding-slug-hint"
              className="min-h-11 min-w-0 flex-1 bg-transparent py-2 pl-0.5 pr-3 text-[0.9375rem] text-ink outline-none"
            />
          </div>
          <p id="onboarding-slug-hint" className="text-[0.8125rem] text-ink-soft">
            Deixe em branco para gerar a partir dos nomes.
          </p>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className={`${legendClass} mb-4`}>O casamento</legend>
        <label className={labelClass}>
          <span className={labelText}>Data</span>
          <input name="weddingDate" type="date" className="field" />
        </label>
        <label className={labelClass}>
          <span className={labelText}>Horário</span>
          <input name="weddingTime" type="time" className="field" />
        </label>
        <label className={labelClass}>
          <span className={labelText}>Local</span>
          <input name="venue" type="text" placeholder="Fazenda Santa Maria" className="field" />
        </label>
        <label className={labelClass}>
          <span className={labelText}>Cidade</span>
          <input name="city" type="text" placeholder="Porto Feliz, SP" className="field" />
        </label>
      </fieldset>

      <div className="grid gap-4">
        <div>
          <p className={legendClass}>Modelo</p>
          <p className="mt-1 text-[0.8125rem] text-ink-soft">Dá para trocar a qualquer momento no editor, sem perder nada.</p>
        </div>
        <TemplatePicker name="templateId" defaultValue="classico-romantico" columns={2} />
      </div>

      <div className="grid gap-3">
        {state.error ? <Notice tone="error">{state.error}</Notice> : null}
        <button type="submit" disabled={pending} className="btn btn-sm btn-primary min-h-12 w-full text-[0.9375rem] disabled:opacity-60">
          {pending ? "Criando o site…" : "Criar site e abrir o editor"}
        </button>
      </div>
    </form>
  );
}
