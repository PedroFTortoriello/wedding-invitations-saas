"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PublishButton } from "@/components/app/PublishButton";
import { COMPANY, whatsappLink } from "@/lib/company";
import { LiveNow, StatusLayout, type SiteCardData } from "./SiteLive";

const FAST_MS = 2_000;
const SLOW_MS = 10_000;
/** Depois disso o Pix está demorando: avisa e passa a consultar a cada 10s. */
const FAST_WINDOW_MS = 90_000;

type PublishState = { status: string; paid: boolean };

/**
 * Volta do checkout (?pagamento=concluido). O webhook confirma o Pix e publica o
 * site sozinho; aqui só consultamos /api/publish/status até ver "published".
 * Com a aba escondida não consulta — retoma ao voltar.
 */
export function PublishStatus({
  weddingId,
  site,
  initial,
  blocked = false
}: {
  weddingId: string;
  site: SiteCardData;
  initial: PublishState;
  /** Modo suporte: o botão manual de publicar fica desativado. */
  blocked?: boolean;
}) {
  const router = useRouter();
  const [polled, setPolled] = useState<PublishState>(initial);
  const [slow, setSlow] = useState(false);
  // "Publicar agora" (fallback) faz router.refresh(): o status novo chega pela prop.
  const published = initial.status === "published" || polled.status === "published";
  const paid = initial.paid || polled.paid;

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), FAST_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (published) return;
    let timer = 0;
    let busy = false;
    let alive = true;

    const poll = async () => {
      window.clearTimeout(timer);
      if (busy || document.hidden) return; // escondida: o visibilitychange retoma
      busy = true;
      try {
        const response = await fetch("/api/publish/status", { cache: "no-store" });
        if (response.ok && alive) {
          const next = (await response.json()) as PublishState;
          setPolled(next);
          // O servidor re-renderiza a página já com o PurchaseTracker (pagamento recente).
          if (next.status === "published") router.refresh();
        }
      } catch {
        // Rede instável: tenta de novo no próximo ciclo.
      }
      busy = false;
      if (alive) timer = window.setTimeout(poll, slow ? SLOW_MS : FAST_MS);
    };
    const onVisibility = () => {
      if (!document.hidden) void poll();
    };

    timer = window.setTimeout(poll, slow ? SLOW_MS : FAST_MS);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [published, slow, router]);

  // Pago e ainda rascunho: normal por um instante (o webhook publica logo depois de
  // gravar o pagamento). Se persistir, a publicação automática falhou — botão manual.
  const phase = published ? "live" : paid ? (slow || initial.paid ? "publish" : "publishing") : slow ? "late" : "confirming";
  const announcement = {
    live: "Seu site está no ar!",
    publish: "Pagamento confirmado. Falta só publicar.",
    publishing: "Pagamento confirmado. Colocando o site no ar.",
    late: "O pagamento ainda não foi confirmado.",
    confirming: "Confirmando o pagamento."
  }[phase];

  return (
    <StatusLayout site={site} status={published ? "published" : "draft"}>
      <p role="status" className="sr-only">
        {announcement}
      </p>

      {phase === "live" ? (
        <LiveNow
          site={site}
          title={
            <>
              Seu site está <em>no ar!</em>
            </>
          }
        />
      ) : phase === "publish" ? (
        <>
          <h1 className="t-h1 text-balance">
            Pagamento confirmado. <em>Falta só publicar.</em>
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-ink-soft">
            O Pix chegou. Publiquem agora e o link passa a funcionar para os convidados na hora.
          </p>
          <div className="mt-7 max-w-sm">
            <PublishButton weddingId={weddingId} paid block blocked={blocked} />
          </div>
        </>
      ) : (
        <>
          <p className="flex items-center gap-2.5 text-sm font-semibold text-ink-soft" aria-hidden>
            <span className="size-2 rounded-full bg-forest motion-safe:animate-pulse" />
            {phase === "publishing" ? "Pix confirmado" : "Aguardando o Pix"}
          </p>
          <h1 className="mt-4 t-h1 text-balance">
            {phase === "publishing" ? (
              <>
                Colocando o site <em>no ar…</em>
              </>
            ) : (
              <>
                Confirmando o <em>pagamento…</em>
              </>
            )}
          </h1>
          {phase === "late" ? (
            <>
              <p className="mt-4 max-w-md text-base leading-7 text-ink">
                O pagamento pode levar alguns minutos para confirmar. Vamos atualizar esta página sozinhos.
              </p>
              <p className="mt-3 max-w-md text-sm leading-6 text-ink-soft">
                Já pagou e nada mudou?{" "}
                <a
                  href={whatsappLink("Olá! Paguei a publicação do meu site e ele ainda não entrou no ar.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ink underline underline-offset-2"
                >
                  Fale com a gente no WhatsApp
                </a>{" "}
                ({COMPANY.whatsappHours}).
              </p>
            </>
          ) : (
            <p className="mt-4 max-w-md text-base leading-7 text-ink-soft">
              Assim que o Pix for confirmado, o site entra no ar sozinho. Costuma levar poucos segundos.
            </p>
          )}
          <p className="mt-7 text-sm text-ink-soft">
            Pode sair desta página: o site é publicado mesmo assim.{" "}
            <Link href="/dashboard" className="font-semibold text-ink underline underline-offset-2">
              Ir para o painel
            </Link>
          </p>
        </>
      )}
    </StatusLayout>
  );
}
