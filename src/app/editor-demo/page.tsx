"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { demoWedding, romanticImages } from "@/lib/demo-wedding";

const heroOptions = [
  romanticImages.hero,
  romanticImages.toast,
  romanticImages.blackWhitePortrait,
  romanticImages.ceremonyAisle
];

export default function EditorDemoPage() {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [coupleNames, setCoupleNames] = useState(demoWedding.coupleNames);
  const [date, setDate] = useState("2026-12-05");
  const [message, setMessage] = useState(demoWedding.welcomeText);
  const [primaryColor, setPrimaryColor] = useState(demoWedding.theme.primaryDark);
  const [heroImage, setHeroImage] = useState(demoWedding.heroImage);

  const dateLabel = useMemo(() => {
    const parsedDate = new Date(`${date}T12:00:00`);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(parsedDate);
  }, [date]);

  return (
    <main className="min-h-screen bg-[#f7f0e5] text-[#332820]">
      <header className="sticky top-0 z-30 border-b border-[#5b6842]/10 bg-[#fffaf1]/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="font-serif text-3xl italic">
            Vows
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-[#ebe2d4] p-1 md:hidden">
            {(["edit", "preview"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  mode === item ? "bg-[#354022] text-white" : "text-[#5f5148]"
                }`}
              >
                {item === "edit" ? "Editar" : "Visualizar"}
              </button>
            ))}
          </div>
          <Link
            href="/casamento/pedro-e-rafaela"
            className="hidden min-h-11 items-center rounded-full bg-[#354022] px-5 text-sm font-bold text-white md:inline-flex"
          >
            Abrir demonstração completa
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[25rem_1fr]">
        <aside className={`${mode === "preview" ? "hidden" : "block"} md:block`}>
          <div className="rounded-[1.5rem] border border-[#5b6842]/12 bg-[#fffaf1] p-5 shadow-[0_22px_70px_rgba(53,64,34,0.10)]">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-[#5b6842]">Demonstração do editor</p>
            <h1 className="mt-3 font-serif text-5xl italic leading-none">Personalize a hero.</h1>
            <p className="mt-4 text-sm leading-6 text-[#5f5148]">
              Nesta etapa, os campos são simulados. A próxima evolução conecta isso à configuração inicial,
              banco de dados e publicação.
            </p>

            <div className="mt-7 grid gap-5">
              <label className="grid gap-2 text-sm font-bold text-[#5f5148]">
                Nomes
                <input
                  value={coupleNames}
                  onChange={(event) => setCoupleNames(event.target.value)}
                  className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4 outline-none focus:border-[#5b6842]"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#5f5148]">
                Data
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4 outline-none focus:border-[#5b6842]"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#5f5148]">
                Mensagem inicial
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="rounded-2xl border border-[#5b6842]/14 bg-white p-4 outline-none focus:border-[#5b6842]"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#5f5148]">
                Cor principal
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-[#5b6842]/14 bg-white p-1"
                />
              </label>
              <div>
                <p className="mb-3 text-sm font-bold text-[#5f5148]">Imagem principal</p>
                <div className="grid grid-cols-4 gap-2">
                  {heroOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setHeroImage(option)}
                      className={`overflow-hidden rounded-2xl border-2 ${
                        heroImage === option ? "border-[#354022]" : "border-transparent"
                      }`}
                    >
                      <img src={option} alt="" className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className={`${mode === "edit" ? "hidden" : "block"} md:block`}>
          <div className="overflow-hidden rounded-[2rem] border border-[#5b6842]/12 bg-[#fffaf1] p-3 shadow-[0_24px_80px_rgba(53,64,34,0.14)]">
            <div className="relative min-h-[680px] overflow-hidden rounded-[1.45rem] bg-[#111] md:min-h-[780px]">
              <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(30,38,20,0.03),rgba(30,38,20,0.18)_52%,rgba(25,32,17,0.42))]" />
              <div className="absolute left-5 right-5 top-5 flex items-center justify-between rounded-full border border-white/20 bg-white/10 px-5 py-3 text-white backdrop-blur">
                <span className="font-serif text-2xl italic">P&R</span>
                <span className="rounded-full px-4 py-2 text-sm font-bold" style={{ background: primaryColor }}>
                  Confirmar presença
                </span>
              </div>
              <div className="absolute inset-x-6 bottom-10 text-center text-white">
                <p className="mb-5 text-xs font-black uppercase tracking-[0.42em]">{dateLabel}</p>
                <h2 className="mx-auto max-w-4xl font-serif text-[clamp(3.5rem,9vw,8rem)] italic leading-[0.82]">
                  {coupleNames}
                </h2>
                <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-white/82">{message}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
