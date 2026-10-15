import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/app/icons";
import { Notice } from "@/components/app/Notice";
import { StatusBadge } from "@/components/app/StatusBadge";
import { SubmitButton } from "@/components/app/SubmitButton";
import { startSupportSessionAction } from "@/app/admin/suporte-actions";
import { formatDateTime, formatRelative } from "./data";

/** Faixa de números num único painel, separados por linhas finas (gap-px sobre bg-line). */
export function StatStrip({
  label,
  stats,
  className = "sm:grid-cols-3"
}: {
  label: string;
  stats: { label: string; value: string; note?: ReactNode }[];
  className?: string;
}) {
  return (
    <section aria-label={label} className="panel overflow-hidden">
      <dl className={`grid grid-cols-2 gap-px bg-line ${className}`}>
        {stats.map((stat) => (
          <div key={stat.label} className="grid min-w-0 content-start gap-1 bg-surface p-4 sm:p-5">
            <dt className="text-[0.8125rem] text-ink-soft">{stat.label}</dt>
            <dd className="font-serif text-[1.625rem] leading-none tabular-nums text-ink wrap-break-word sm:text-[2rem]">
              {stat.value}
            </dd>
            {stat.note ? <dd className="text-[0.8125rem] leading-5 text-ink-soft">{stat.note}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

type Bar = { key: string; label: ReactNode; value: number; display: string; detail?: string };

/**
 * Barras horizontais acessíveis: o número está no texto, a barra é decorativa.
 * `compact` põe rótulo, barra e valor numa linha só (séries longas, ex.: por dia).
 */
export function BarList({ label, items, compact = false }: { label: string; items: Bar[]; compact?: boolean }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const width = (value: number) => `${value > 0 ? Math.max(2, (value / max) * 100) : 0}%`;

  if (compact) {
    return (
      <ul aria-label={label} className="grid gap-1.5">
        {items.map((item) => (
          <li key={item.key} className="grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
            <span className="truncate text-ink-soft">{item.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-forest/8" aria-hidden>
              <span className="block h-full rounded-full bg-forest" style={{ width: width(item.value) }} />
            </span>
            <span className="text-right font-semibold tabular-nums text-ink">{item.display}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul aria-label={label} className="grid gap-3.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 text-ink">{item.label}</span>
            <span className="shrink-0 tabular-nums">
              <span className="font-semibold text-ink">{item.display}</span>
              {item.detail ? <span className="ml-1.5 text-ink-soft">{item.detail}</span> : null}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-forest/8" aria-hidden>
            <div className="h-full rounded-full bg-forest" style={{ width: width(item.value) }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Abas de filtro por search param, com contagem (mesmo desenho de /convidados). */
export function FilterTabs({
  label,
  current,
  tabs,
  className = ""
}: {
  label: string;
  current: string;
  tabs: { key: string; label: string; count: number; href: string }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`flex gap-1 overflow-x-auto border-b border-line px-3 ${className}`}>
      {tabs.map((tab) => {
        const active = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-forest ${
              active ? "border-forest text-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-forest text-on-forest" : "bg-forest/8"}`}>
              {tab.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Busca por GET (?q=), preservando os outros filtros em campos ocultos. */
export function SearchForm({
  action,
  q,
  label,
  placeholder,
  keep = {}
}: {
  action: string;
  q: string;
  label: string;
  placeholder: string;
  keep?: Record<string, string | undefined>;
}) {
  return (
    <form action={action} role="search" className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-0 flex-1 basis-60">
        <span className="sr-only">{label}</span>
        <Icon name="search" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input type="search" name="q" defaultValue={q} placeholder={placeholder} className="field pl-9" />
      </label>
      {Object.entries(keep).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null
      )}
      <button type="submit" className="btn btn-sm btn-secondary min-h-11">
        Buscar
      </button>
    </form>
  );
}

/** Data e hora exatas + tempo relativo, em duas linhas. */
export function DateTimeCell({ iso, extra }: { iso: string | null | undefined; extra?: ReactNode }) {
  if (!iso) return <span className="text-ink-soft">—</span>;
  return (
    <span className="grid">
      <time dateTime={iso} className="whitespace-nowrap text-ink">
        {formatDateTime(iso)}
      </time>
      <span className="text-[0.8125rem] text-ink-soft">
        {formatRelative(iso)}
        {extra}
      </span>
    </span>
  );
}

/** Aviso quando `funnel_events` não pôde ser lido (ver fetchFunnelEvents). */
export function FunnelNotice({ problem, className }: { problem: string | null; className?: string }) {
  if (!problem) return null;
  return problem === "missing" ? (
    <Notice tone="warn" className={className}>
      Rode a migration 0011_funnel_events.sql no Supabase para ver a jornada.
    </Notice>
  ) : (
    <Notice tone="error" className={className}>
      Não foi possível ler os eventos do funil ({problem}).
    </Notice>
  );
}

/** publish_payments usa "cancelled", que o StatusBadge não conhece: mostra como não concluído. */
export function PaymentBadge({ status }: { status: string }) {
  return <StatusBadge status={status === "cancelled" ? "failed" : status} />;
}

/** "Ver conta": abre o painel do cliente no modo suporte (a action confere admin e alvo de novo). */
export function ViewAccountButton({ userId, label }: { userId: string; label: string }) {
  return (
    <form action={startSupportSessionAction}>
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton className="btn btn-sm btn-secondary whitespace-nowrap" pendingLabel="Abrindo…" aria-label={`Ver conta de ${label}`}>
        <Icon name="eye" size={16} />
        Ver conta
      </SubmitButton>
    </form>
  );
}

/** Classes de tabela compartilhadas (cabeçalho e células com linhas finas). */
export const th = "whitespace-nowrap px-3 py-2.5 text-[0.8125rem] font-medium text-ink-soft first:pl-5 last:pr-5";
export const td = "px-3 py-3 align-top text-sm first:pl-5 last:pr-5";
