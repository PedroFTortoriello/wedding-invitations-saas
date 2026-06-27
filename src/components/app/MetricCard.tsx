type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <article className="rounded-[1.4rem] border border-[#5b6842]/12 bg-[#fffaf1] p-6 shadow-[0_18px_52px_rgba(53,64,34,0.08)]">
      <p className="t-eyebrow text-ink-soft">{label}</p>
      <strong className="mt-4 block t-h1 font-normal leading-none">{value}</strong>
      <p className="mt-3 text-sm leading-6 text-ink-soft">{helper}</p>
    </article>
  );
}
