type StatusBadgeProps = {
  status: string;
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

export function StatusBadge({ status }: StatusBadgeProps) {
  const positive = ["published", "paid", "confirmed"].includes(status);
  const warning = ["draft", "pending"].includes(status);

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
        positive
          ? "bg-[#5b6842]/14 text-[#354022]"
          : warning
            ? "bg-[#d6a85f]/18 text-[#7a5220]"
            : "bg-[#8d3d33]/12 text-[#8d3d33]"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
