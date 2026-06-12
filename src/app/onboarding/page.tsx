import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { cashGiftRevenueModel, demoWedding } from "@/lib/platform-data";

const steps = [
  "Dados dos noivos",
  "Data e horário",
  "URL exclusiva",
  "Locais do evento",
  "Template",
  "Cores iniciais",
  "Foto de capa",
  "Publicacao"
];

export default function OnboardingPage() {
  return (
    <AppShell
      title="Criar casamento"
      subtitle="Fluxo guiado preparado para transformar cadastro em site publicado com o mínimo de fricção."
      active="onboarding"
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[1.6rem] border border-[#5b6842]/12 bg-[#fffaf1] p-6 shadow-[0_18px_52px_rgba(53,64,34,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#5b6842]">Etapas</p>
          <div className="mt-6 grid gap-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-2xl bg-[#f7f0e5] p-4">
                <span className="grid size-9 place-items-center rounded-full bg-[#354022] text-sm font-black text-white">
                  {index + 1}
                </span>
                <span className="font-bold text-[#5f5148]">{step}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[1.6rem] border border-[#5b6842]/12 bg-[#fffaf1] p-6 shadow-[0_18px_52px_rgba(53,64,34,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#5b6842]">Formulario mockado</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["Nome dos noivos", demoWedding.coupleNames],
              ["Data", demoWedding.weddingDateLabel],
              ["Horário", demoWedding.weddingTime],
              ["Slug", demoWedding.slug],
              ["Local", demoWedding.locations[0]?.venue ?? ""],
              ["Modelo", demoWedding.templateName]
            ].map(([label, value]) => (
              <label key={label} className="grid gap-2 text-sm font-bold text-[#5f5148]">
                {label}
                <input className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4" defaultValue={value} />
              </label>
            ))}
          </div>
          <div className="mt-5 rounded-3xl bg-[#f7f0e5] p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5b6842]">Receita da plataforma</p>
            <h2 className="mt-3 font-serif text-4xl leading-none">{cashGiftRevenueModel.title}</h2>
            <p className="mt-2 text-sm font-bold text-[#354022]">{cashGiftRevenueModel.minimumFeeLabel}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {cashGiftRevenueModel.features.map((feature) => (
                <div key={feature} className="rounded-2xl border border-[#5b6842]/12 bg-[#fffaf1] p-4 text-sm font-bold text-[#5f5148]">
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <Link href="/editor" className="mt-7 inline-flex min-h-12 rounded-full bg-[#354022] px-7 text-sm font-black text-white">
            Continuar para o editor
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
