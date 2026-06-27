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
      className={`inline-flex rounded-full px-3 py-1 t-eyebrow ${
        positive
          ? "bg-[#5b6842]/14 text-forest"
          : warning
            ? "bg-[#d6a85f]/18 text-[#7a5220]"
            : "bg-[#8d3d33]/12 text-[#8d3d33]"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
