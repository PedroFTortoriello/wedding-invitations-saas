"use client";

import { useActionState, useEffect, useRef } from "react";
import { addGiftAction, type GiftActionState } from "./actions";

const initial: GiftActionState = {};
const fieldClass = "min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4 text-ink";
const labelClass = "grid gap-2 text-sm font-bold text-ink-soft";

export function GiftManager() {
  const [state, formAction, pending] = useActionState(addGiftAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="card p-6">
      <p className="t-eyebrow text-ink-soft">Nova cota de presente</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className={`${labelClass} md:col-span-2`}>
          Título
          <input name="title" type="text" required placeholder="Lua de mel, jantar especial…" className={fieldClass} />
        </label>
        <label className={labelClass}>
          Valor
          <input name="price" type="text" placeholder="R$ 250,00 ou Valor livre" className={fieldClass} />
        </label>
        <label className={labelClass}>
          Imagem (URL, opcional)
          <input name="image" type="url" placeholder="https://…" className={fieldClass} />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Descrição (opcional)
          <textarea
            name="description"
            rows={2}
            className="rounded-2xl border border-[#5b6842]/14 bg-white p-4 text-ink"
          />
        </label>
      </div>

      {state.error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-[#8d3d33]/10 px-4 py-3 text-sm font-bold text-[#8d3d33]">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="mt-4 rounded-2xl bg-forest/10 px-4 py-3 text-sm font-bold text-forest">
          Cota adicionada.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary mt-5 text-sm disabled:opacity-60">
        {pending ? "Adicionando…" : "Adicionar cota"}
      </button>
    </form>
  );
}
