"use client";

import { useActionState } from "react";
import { saveWeddingAction, type SaveWeddingState } from "./actions";

export type EditorValues = {
  coupleNames: string;
  welcomeText: string;
  weddingDateLabel: string;
  weddingTime: string;
  primaryColor: string;
  templateId: string;
  pixKey: string;
  pixKeyType: string;
  pixHolderName: string;
};

const TEMPLATE_OPTIONS: { id: string; label: string }[] = [
  { id: "classico-romantico", label: "Clássico Romântico" },
  { id: "civil-minimalista", label: "Civil Minimalista" },
  { id: "garden-classico", label: "Jardim Clássico" },
  { id: "olive-burgundy", label: "Olive Burgundy — Save the Date" }
];

const PIX_KEY_TYPES: { id: string; label: string }[] = [
  { id: "email", label: "E-mail" },
  { id: "cpf", label: "CPF" },
  { id: "cnpj", label: "CNPJ" },
  { id: "phone", label: "Telefone" },
  { id: "random", label: "Aleatória" }
];

const initialState: SaveWeddingState = {};
const fieldClass = "min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4 text-ink";
const labelClass = "grid gap-2 text-sm font-bold text-ink-soft";

export function EditorForm({ values }: { values: EditorValues }) {
  const [state, formAction, pending] = useActionState(saveWeddingAction, initialState);

  return (
    <form action={formAction} className="grid gap-6">
      <section className="card p-6">
        <p className="t-eyebrow text-ink-soft">Identidade</p>
        <div className="mt-6 grid gap-4">
          <label className={labelClass}>
            Nomes do casal
            <input name="coupleNames" type="text" required defaultValue={values.coupleNames} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Mensagem principal
            <textarea
              name="welcomeText"
              rows={5}
              defaultValue={values.welcomeText}
              className="rounded-2xl border border-[#5b6842]/14 bg-white p-4 text-ink"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              Modelo
              <select name="templateId" defaultValue={values.templateId} className={fieldClass}>
                {TEMPLATE_OPTIONS.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Cor principal
              <input
                name="primaryColor"
                type="color"
                defaultValue={values.primaryColor || "#3e4230"}
                className="h-12 rounded-2xl border border-[#5b6842]/14 bg-white p-1"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <p className="t-eyebrow text-ink-soft">Data e horário</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Data (como aparece no site)
            <input
              name="weddingDateLabel"
              type="text"
              defaultValue={values.weddingDateLabel}
              placeholder="5 de dezembro de 2026"
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Horário
            <input name="weddingTime" type="text" defaultValue={values.weddingTime} placeholder="16:30" className={fieldClass} />
          </label>
        </div>
      </section>

      <section className="card p-6">
        <p className="t-eyebrow text-ink-soft">Presentes em dinheiro (Pix)</p>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Os presentes caem 100% na sua chave Pix, sem intermediação da plataforma.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Chave Pix
            <input name="pixKey" type="text" defaultValue={values.pixKey} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Tipo da chave
            <select name="pixKeyType" defaultValue={values.pixKeyType || "email"} className={fieldClass}>
              {PIX_KEY_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Nome do titular da conta
            <input name="pixHolderName" type="text" defaultValue={values.pixHolderName} className={fieldClass} />
          </label>
        </div>
      </section>

      {state.error ? (
        <p role="alert" className="rounded-2xl bg-[#8d3d33]/10 px-4 py-3 text-sm font-bold text-[#8d3d33]">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="rounded-2xl bg-forest/10 px-4 py-3 text-sm font-bold text-forest">
          Alterações salvas.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary w-full text-sm disabled:opacity-60 md:w-auto md:justify-self-start md:px-8">
        {pending ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}
