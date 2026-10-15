import type { ReactNode } from "react";
import { endSupportSessionAction } from "@/app/admin/suporte-actions";
import { Icon } from "@/components/app/icons";
import type { SupportInfo } from "@/lib/acting";

/** Texto curto das ações que o modo suporte não faz (o servidor bloqueia de qualquer jeito). */
export const SUPPORT_BLOCKED_HINT = "Bloqueado no modo suporte: só o casal pode fazer isso.";

/** "1h 52min" / "35min" até a expiração (epoch em segundos). */
function timeLeft(expiresAt: number, now = Date.now()): string {
  const minutes = Math.max(1, Math.ceil((expiresAt * 1000 - now) / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${m ? ` ${m}min` : ""}` : `${m}min`;
}

/**
 * Barra do modo suporte: o admin está vendo (e editando) a conta de um cliente.
 * Server component, renderizada no topo de cada tela do painel do casal. É sticky e
 * fica no fluxo: empurra o conteúdo em vez de cobri-lo (layouts com elementos fixos
 * ou sticky descontam a altura dela, h-12).
 */
export function SupportBar({ support }: { support: SupportInfo }) {
  return (
    <div
      role="region"
      aria-label="Modo suporte"
      className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2.5 border-b border-gold/60 bg-forest px-3 text-on-forest sm:gap-3 sm:px-4 md:px-6"
    >
      <Icon name="eye" size={18} className="shrink-0" />
      <p className="min-w-0 flex-1 truncate text-sm leading-5">
        <span className="sm:hidden">Suporte · </span>
        <span className="max-sm:hidden">Modo suporte · vendo a conta de </span>
        <strong className="font-semibold" title={support.targetLabel}>
          {support.targetLabel}
        </strong>
      </p>
      <p className="hidden shrink-0 text-[0.8125rem] tabular-nums text-on-forest/85 md:block">
        expira em ~{timeLeft(support.expiresAt)}
      </p>
      <form action={endSupportSessionAction} className="shrink-0">
        <button type="submit" aria-label="Voltar ao admin" className="btn btn-sm btn-inverse px-3 sm:px-3.5">
          <Icon name="chevronLeft" size={16} />
          Voltar<span className="max-sm:hidden"> ao admin</span>
        </button>
      </form>
    </div>
  );
}

/**
 * Botão de uma ação bloqueada no modo suporte: continua focável (aria-disabled) e
 * explica o bloqueio no title, sem executar nada.
 */
export function SupportBlockedButton({
  className,
  children,
  "aria-label": ariaLabel
}: {
  className: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={ariaLabel}
      title={SUPPORT_BLOCKED_HINT}
      className={`${className} cursor-not-allowed opacity-55`}
    >
      {children}
    </button>
  );
}

/** Explicação visível ao lado de um bloco de ações bloqueadas. */
export function SupportBlockedNote({ onDark = false, className = "" }: { onDark?: boolean; className?: string }) {
  return (
    <p
      className={`flex items-start gap-1.5 text-[0.8125rem] font-medium leading-5 ${
        onDark ? "text-on-forest/90" : "text-ink-soft"
      } ${className}`}
    >
      <Icon name="eye" size={15} className="mt-0.5 shrink-0" />
      {SUPPORT_BLOCKED_HINT}
    </p>
  );
}
