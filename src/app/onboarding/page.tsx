import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { cashGiftRevenueModel, demoWedding } from "@/lib/platform-data";

type StepState = "done" | "current" | "todo";

const steps: { label: string; state: StepState }[] = [
  { label: "Dados dos noivos", state: "done" },
  { label: "Data e horário", state: "done" },
  { label: "URL exclusiva", state: "done" },
  { label: "Locais do evento", state: "current" },
  { label: "Template", state: "todo" },
  { label: "Cores iniciais", state: "todo" },
  { label: "Foto de capa", state: "todo" },
  { label: "Publicação", state: "todo" }
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function OnboardingPage() {
  const done = steps.filter((step) => step.state === "done").length;
  const pct = Math.round((done / steps.length) * 100);

  return (
    <AppShell
      title="Criar casamento"
      subtitle="Fluxo guiado preparado para transformar cadastro em site publicado com o mínimo de fricção."
      active="onboarding"
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <p className="t-eyebrow text-ink-soft">Etapas</p>
            <span className="t-eyebrow text-ink-soft">
              {done} de {steps.length}
            </span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#5b6842]/12">
            <div
              className="h-full rounded-full bg-forest transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${pct}%` }}
            />
          </div>
          <ul className="mt-6 grid gap-3">
            {steps.map((step, index) => (
              <li
                key={step.label}
                className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors ${
                  step.state === "current" ? "border-[#5b6842]/35 bg-[#5b6842]/8" : "border-transparent bg-[#f7f0e5]"
                }`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-black ${
                    step.state === "done"
                      ? "bg-forest text-on-forest"
                      : step.state === "current"
                        ? "border-2 border-forest text-forest"
                        : "bg-[#5b6842]/12 text-ink-soft"
                  }`}
                >
                  {step.state === "done" ? <CheckIcon /> : index + 1}
                </span>
                <span className={`font-bold ${step.state === "todo" ? "text-ink-soft" : "text-ink"}`}>{step.label}</span>
                {step.state === "current" ? (
                  <span className="ml-auto rounded-full bg-forest/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-forest">
                    Atual
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6">
          <p className="t-eyebrow text-ink-soft">Dados do casal</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["Nome dos noivos", demoWedding.coupleNames],
              ["Data", demoWedding.weddingDateLabel],
              ["Horário", demoWedding.weddingTime],
              ["Slug", demoWedding.slug],
              ["Local", demoWedding.locations[0]?.venue ?? ""],
              ["Modelo", demoWedding.templateName]
            ].map(([label, value]) => (
              <label key={label} className="grid gap-2 text-sm font-bold text-ink-soft">
                {label}
                <input className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4 text-ink" defaultValue={value} />
              </label>
            ))}
          </div>
          <div className="mt-6 rounded-3xl bg-[#f7f0e5] p-5">
            <p className="t-eyebrow text-ink-soft">Modelo de presentes</p>
            <h2 className="mt-3 t-h2">{cashGiftRevenueModel.title}</h2>
            <p className="mt-2 text-sm font-bold text-forest">{cashGiftRevenueModel.highlight}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {cashGiftRevenueModel.features.map((feature) => (
                <div key={feature} className="rounded-2xl border border-[#5b6842]/12 bg-[#fffaf1] p-4 text-sm font-bold text-ink">
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <Link href="/editor" className="btn btn-primary mt-6 w-full text-sm">
            Continuar para o editor
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
