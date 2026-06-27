"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PublishPanelProps = {
  weddingId: string;
  status: string;
  paid: boolean;
};

const PUBLISH_FEE_LABEL = "R$ 149,90";

export function PublishPanel({ weddingId, status, paid }: PublishPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "published") {
    return null;
  }

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/publish/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingSiteId: weddingId })
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Não foi possível iniciar o pagamento.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  async function publishNow() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingSiteId: weddingId })
      });
      const data = (await response.json()) as { status?: string; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível publicar.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-3xl border border-[#5b6842]/14 bg-[#fffaf1] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="t-eyebrow text-ink-soft">Publicação</p>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            {paid
              ? "Taxa paga. Coloque seu site no ar quando quiser."
              : `Taxa única de ${PUBLISH_FEE_LABEL} para publicar e deixar o link ativo para os convidados.`}
          </p>
        </div>
        {paid ? (
          <button type="button" onClick={publishNow} disabled={loading} className="btn btn-primary shrink-0 text-sm disabled:opacity-60">
            {loading ? "Publicando…" : "Publicar agora"}
          </button>
        ) : (
          <button type="button" onClick={startCheckout} disabled={loading} className="btn btn-primary shrink-0 text-sm disabled:opacity-60">
            {loading ? "Redirecionando…" : `Publicar site — ${PUBLISH_FEE_LABEL}`}
          </button>
        )}
      </div>
      {error ? (
        <p role="alert" className="mt-3 rounded-2xl bg-[#8d3d33]/10 px-4 py-3 text-sm font-bold text-[#8d3d33]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
