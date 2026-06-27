type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <article className="card p-6">
      <p className="t-eyebrow text-ink-soft">{label}</p>
      <strong className="mt-4 block t-h1 font-normal leading-none">{value}</strong>
      <p className="mt-3 text-sm leading-6 text-ink-soft">{helper}</p>
    </article>
  );
}
