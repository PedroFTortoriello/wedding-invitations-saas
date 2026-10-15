"use client";

import { useState } from "react";
import { Icon } from "@/components/app/icons";

/** Link absoluto com "Copiar" e (opcional) "Abrir". Mostra a URL sem o protocolo. */
export function CopyLink({ url, label, openable = false }: { url: string; label: string; openable?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard bloqueado: o campo seleciona tudo no foco para copiar à mão.
    }
  }

  return (
    <div className="flex min-h-11 w-full max-w-xl items-center gap-1 rounded-lg border border-line-strong bg-field py-1 pl-3 pr-1">
      <Icon name="link" size={16} className="shrink-0 text-ink-soft" />
      <input
        readOnly
        value={url.replace(/^https?:\/\//, "")}
        onFocus={(e) => e.currentTarget.select()}
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent px-1.5 text-sm text-ink outline-none"
      />
      {openable ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="icon-btn size-9" aria-label="Abrir em nova aba">
          <Icon name="external" size={16} />
        </a>
      ) : null}
      <button type="button" onClick={copy} className="btn btn-sm btn-ghost min-h-9 px-3" aria-live="polite">
        <Icon name={copied ? "check" : "copy"} size={15} />
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
