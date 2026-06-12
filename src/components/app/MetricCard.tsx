type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <article className="rounded-[1.4rem] border border-[#5b6842]/12 bg-[#fffaf1] p-6 shadow-[0_18px_52px_rgba(53,64,34,0.08)]">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[#5b6842]">{label}</p>
      <strong className="mt-4 block font-serif text-5xl font-normal leading-none">{value}</strong>
      <p className="mt-3 text-sm leading-6 text-[#5f5148]">{helper}</p>
    </article>
  );
}
