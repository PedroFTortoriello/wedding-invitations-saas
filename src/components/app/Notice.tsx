import type { ReactNode } from "react";
import { Icon } from "@/components/app/icons";

type NoticeProps = {
  tone?: "success" | "error" | "warn" | "info";
  children: ReactNode;
  className?: string;
};

const TONES = {
  success: { box: "bg-forest/8 text-forest border-forest/15", icon: "check" },
  error: { box: "bg-danger/8 text-danger border-danger/20", icon: "alert" },
  warn: { box: "bg-warn-soft/70 text-warn border-warn/20", icon: "alert" },
  info: { box: "bg-surface text-ink border-line", icon: "alert" }
} as const;

/** Aviso inline do painel (sucesso, erro, atenção). Erros anunciam na hora (role=alert). */
export function Notice({ tone = "info", children, className = "" }: NoticeProps) {
  const t = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-5 ${t.box} ${className}`}
    >
      <Icon name={t.icon} size={18} className="mt-px shrink-0" />
      <div className="min-w-0 font-medium">{children}</div>
    </div>
  );
}
