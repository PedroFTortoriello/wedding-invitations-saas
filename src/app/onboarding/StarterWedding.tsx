"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/app/icons";
import { Notice } from "@/components/app/Notice";
import { track } from "@/lib/analytics";
import { completeSignupAction } from "../cadastro/actions";
import { createStarterWeddingAction, type StarterWeddingResult } from "./actions";

const FALLBACK_ERROR = "Não conseguimos criar o site automaticamente. Preencha os dados abaixo para continuar.";

type StarterWeddingProps = {
  /** eventId do cadastro (?cadastro=): fecha o cadastro no servidor junto com a criação. */
  signupEventId?: string;
  /** Página com o formulário manual (plano B se a criação automática falhar). */
  form: ReactNode;
};

/**
 * Conta com nome do casal e sem casamento: cria o site no modelo escolhido no
 * cadastro (ou no padrão) e abre o editor, sem formulário. Se falhar, mostra o
 * formulário com o motivo.
 */
export function StarterWedding({ signupEventId, form }: StarterWeddingProps) {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // StrictMode roda o efeito duas vezes em dev: cria uma vez só.
    if (started.current) return;
    started.current = true;

    (async () => {
      let result: StarterWeddingResult;
      try {
        if (signupEventId) {
          const res = await completeSignupAction({ eventId: signupEventId });
          result = { ok: res.weddingCreated, alreadyExisted: res.alreadyExisted, template: res.template };
        } else {
          result = await createStarterWeddingAction();
        }
      } catch {
        result = { ok: false };
      }

      if (result.ok) {
        // Modelo real devolvido pelo servidor (o da landing ou DEFAULT_TEMPLATE).
        if (!result.alreadyExisted) track("wedding_created", { template: result.template });
        router.replace("/editor?bemvindo=1");
        return;
      }
      setError(result.message ?? FALLBACK_ERROR);
    })();
  }, [signupEventId, router]);

  if (error) {
    return (
      <>
        <div className="mx-auto max-w-6xl px-4 pt-6 -mb-4 md:px-8 lg:pt-8 lg:-mb-8">
          <Notice tone="error">{error}</Notice>
        </div>
        {form}
      </>
    );
  }

  return (
    <main className="grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-10">
      <div role="status" aria-live="polite" className="grid max-w-sm justify-items-center text-center">
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-full bg-forest/8 text-forest motion-safe:animate-pulse"
        >
          <Icon name="heart" size={22} />
        </span>
        <h1 className="mt-5 font-serif text-[2rem] leading-[1.1] tracking-[-0.01em] text-balance md:text-[2.5rem]">
          Preparando o site de <em>vocês</em>…
        </h1>
        <p className="mt-3 text-base leading-6 text-ink-soft">Leva só um instante.</p>
      </div>
    </main>
  );
}
