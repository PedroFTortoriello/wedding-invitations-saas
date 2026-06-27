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
  paid: "Pago",
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Nao vai"
};

export function StatusBadge({ status, onDark = false }: StatusBadgeProps) {
  const positive = ["published", "paid", "confirmed"].includes(status);
  const warning = ["draft", "pending"].includes(status);

  const tone = onDark
    ? "bg-on-forest/16 text-on-forest"
    : positive
      ? "bg-[#5b6842]/16 text-forest"
      : warning
        ? "bg-[#c79a3f]/22 text-[#5c3f12]"
        : "bg-[#8d3d33]/14 text-[#6f2a22]";
  const dot = onDark
    ? "bg-on-forest"
    : positive
      ? "bg-forest"
      : warning
        ? "bg-[#a9781f]"
        : "bg-[#8d3d33]";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 t-eyebrow ${tone}`}>
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
      {labels[status] ?? status}
    </span>
  );
}
