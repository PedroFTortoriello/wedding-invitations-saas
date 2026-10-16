"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/app/icons";
import { SUPPORT_BLOCKED_HINT, SupportBlockedNote } from "@/components/app/SupportBar";
import { newEventId, track } from "@/lib/analytics";
import { publishFee } from "@/lib/platform-data";

type PublishButtonProps = {
  weddingId: string;
  /** Taxa já paga: publica direto. Senão, abre o checkout da taxa única. */
  paid: boolean;
  /** Botão creme sobre fundo --forest. */
  onDark?: boolean;
  compact?: boolean;
  /** Botão grande de largura total: a ação principal da tela /publicar. */
  block?: boolean;
  /** Modo suporte: publicar e pagar ficam só com o casal (o servidor também recusa). */
  blocked?: boolean;
  /** Taxa deste casamento (padrão ou site feito pela IA). O servidor cobra a certa de qualquer jeito. */
  fee?: ReturnType<typeof publishFee>;
};

export function PublishButton({
  weddingId,
  paid,
  onDark = false,
  compact = false,
  block = false,
  blocked = false,
  fee = publishFee(false)
}: PublishButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (blocked) return;
    setLoading(true);
    setError(null);
    // InitiateCheckout: o mesmo event_id vai ao servidor (Conversions API) para deduplicar.
    let eventId: string | undefined;
    if (!paid) {
      eventId = newEventId("checkout");
      track("begin_checkout", { value: fee.brl }, { eventId });
    }
    try {
      const response = await fetch(paid ? "/api/publish" : "/api/publish/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingSiteId: weddingId, eventId })
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || (!paid && !data.url)) {
        setError(data.error ?? (paid ? "Não foi possível publicar." : "Não foi possível iniciar o pagamento."));
        setLoading(false);
        return;
      }
      if (paid) {
        router.refresh();
        setLoading(false);
      } else {
        window.location.href = data.url!;
      }
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  const label = paid
    ? loading
      ? "Publicando…"
      : "Publicar agora"
    : loading
      ? "Abrindo pagamento…"
      : compact
        ? "Publicar"
        : `Publicar por ${fee.label}`;

  return (
    <div className={`relative grid gap-2 ${block ? "" : "justify-items-start"}`}>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        aria-disabled={blocked || undefined}
        title={blocked ? SUPPORT_BLOCKED_HINT : undefined}
        className={`btn ${block ? "w-full" : "btn-sm"} ${onDark ? "btn-inverse" : "btn-primary"} disabled:opacity-60`}
      >
        {label}
        {!loading && !compact ? <Icon name="chevronRight" size={16} /> : null}
      </button>
      {blocked && !compact ? <SupportBlockedNote onDark={onDark} /> : null}
      {error ? (
        <p
          role="alert"
          className={
            compact
              ? "absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-danger/25 bg-surface p-3 text-sm font-medium text-danger shadow-lg"
              : `text-sm font-medium ${onDark ? "text-on-forest" : "text-danger"}`
          }
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
