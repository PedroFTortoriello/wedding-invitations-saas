"use client";

import { useState } from "react";

/** Mostra o link só-leitura da cerimonialista (URL absoluta vinda do server) com copiar/abrir. */
export function CoordinatorLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard bloqueado: o campo já fica selecionado no foco para copiar à mão.
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[#f7f0e5] p-4 sm:flex-row sm:items-center">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 rounded-xl border border-[#5b6842]/14 bg-white px-3 py-2 text-sm text-ink-soft"
        aria-label="Link da cerimonialista"
      />
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={copy} className="btn btn-primary text-sm">
          {copied ? "Copiado ✓" : "Copiar link"}
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary text-sm">
          Abrir ↗
        </a>
      </div>
    </div>
  );
}
