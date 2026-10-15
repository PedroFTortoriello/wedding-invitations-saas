"use client";

import { useActionState, useState } from "react";
import { Notice } from "@/components/app/Notice";
import { SubmitButton } from "@/components/app/SubmitButton";
import { deleteAccountAction } from "@/app/admin/usuarios/actions";
import { emailConfirmationMatches } from "./account-deletion";

/**
 * Confirmação final de "Apagar conta": e-mail da conta digitado + "Entendi". O botão só
 * libera quando os dois conferem; o servidor confere tudo de novo (deleteAccountAction).
 */
export function DeleteAccountForm({ userId, email }: { userId: string; email: string }) {
  const [state, formAction] = useActionState(deleteAccountAction, null);
  const [typed, setTyped] = useState("");
  const [understood, setUnderstood] = useState(false);
  const ready = understood && emailConfirmationMatches(typed, email);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="userId" value={userId} />
      <label className="grid gap-1.5">
        <span className="text-sm font-semibold text-ink">
          Digite o e-mail da conta para confirmar: <span className="font-mono text-[0.8125rem] wrap-break-word">{email}</span>
        </span>
        <input
          name="email"
          type="email"
          autoComplete="off"
          spellCheck={false}
          required
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          aria-invalid={typed.trim() !== "" && !emailConfirmationMatches(typed, email) ? true : undefined}
          className="field max-w-md"
        />
      </label>
      <label className="flex items-start gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          name="understood"
          checked={understood}
          onChange={(event) => setUnderstood(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-danger"
        />
        Entendi que não dá para desfazer
      </label>
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <DangerSubmit disabled={!ready} />
        {ready ? null : <span className="text-[0.8125rem] text-ink-soft">Digite o e-mail e marque a caixa para liberar.</span>}
      </div>
    </form>
  );
}

function DangerSubmit({ disabled }: { disabled: boolean }) {
  // SubmitButton não repassa `disabled`: sem confirmação, um botão simples desativado.
  if (disabled) {
    return (
      <button type="button" disabled className="btn btn-sm bg-danger text-white">
        Apagar conta definitivamente
      </button>
    );
  }
  return (
    <SubmitButton className="btn btn-sm bg-danger text-white hover:bg-danger/90" pendingLabel="Apagando…">
      Apagar conta definitivamente
    </SubmitButton>
  );
}
