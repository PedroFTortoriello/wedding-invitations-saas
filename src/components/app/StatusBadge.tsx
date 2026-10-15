type StatusBadgeProps = {
  status: string;
  /** Use on dark (--forest) surfaces, where the tinted-light tones fail contrast. */
  onDark?: boolean;
};

const labels: Record<string, string> = {
  published: "Publicado",
  draft: "Rascunho",
  suspended: "Suspenso",
  expired: "Expirado",
  paid: "Recebido",
  pending: "Pendente",
  refunded: "Estornado",
  failed: "Não concluído",
  connected: "Conectado",
  confirmed: "Confirmado",
  declined: "Não vai"
};

export function StatusBadge({ status, onDark = false }: StatusBadgeProps) {
  const positive = ["published", "paid", "confirmed", "connected"].includes(status);
  const warning = ["draft", "pending"].includes(status);

  const tone = onDark
    ? "bg-on-forest/16 text-on-forest"
    : positive
      ? "bg-forest/10 text-forest"
      : warning
        ? "bg-warn-soft text-warn"
        : "bg-danger/10 text-danger";
  const dot = onDark ? "bg-on-forest" : positive ? "bg-forest" : warning ? "bg-[#b8892f]" : "bg-danger";

  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
      {labels[status] ?? status}
    </span>
  );
}
