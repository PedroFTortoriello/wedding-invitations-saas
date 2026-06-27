import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { GiftLinkImporter } from "@/components/app/GiftLinkImporter";
import { demoWedding } from "@/lib/platform-data";

const editableSections = [
  ["Hero", "Ativo", "Nome, foto principal e chamada de confirmação"],
  ["Contagem regressiva", "Ativo", "Data, horário e texto de chamada"],
  ["História", "Ativo", "Três momentos editoriais do casal"],
  ["Detalhes", "Ativo", "Local, presentes e menu do jantar"],
  ["Galeria", "Preparado", "Upload e ordenação entram na próxima integração"],
  ["Mensagens", "Ativo", "Formulário público e moderação futura"]
];

export default function EditorPage() {
  return (
    <AppShell
      title="Editor do site"
      subtitle="Central de personalização preparada para salvar textos, cores, fotos, presentes e seções por casamento."
      active="editor"
    >
      <div className="grid gap-6 xl:grid-cols-[26rem_1fr]">
        <aside className="rounded-[1.6rem] border border-[#5b6842]/12 bg-[#fffaf1] p-6 shadow-[0_18px_52px_rgba(53,64,34,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-ink-soft">Identidade</p>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-ink-soft">
              Nomes
              <input className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4" defaultValue={demoWedding.coupleNames} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink-soft">
              Mensagem principal
              <textarea className="rounded-2xl border border-[#5b6842]/14 bg-white p-4" rows={5} defaultValue={demoWedding.welcomeText} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink-soft">
              Cor principal
              <input type="color" className="h-12 rounded-2xl border border-[#5b6842]/14 bg-white p-1" defaultValue={demoWedding.theme.primaryDark} />
            </label>
          </div>
          <Link href="/casamento/pedro-e-rafaela" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#354022] text-sm font-black text-white">
            Prévia pública
          </Link>
        </aside>
        <section className="grid gap-4">
          <GiftLinkImporter />
          {editableSections.map(([title, status, description]) => (
            <article key={title} className="rounded-[1.3rem] border border-[#5b6842]/12 bg-[#fffaf1] p-5 shadow-[0_14px_42px_rgba(53,64,34,0.06)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-serif text-4xl leading-none">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">{description}</p>
                </div>
                <span className="rounded-full bg-[#5b6842]/12 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-forest">
                  {status}
                </span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
