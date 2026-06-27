import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { GiftLinkImporter } from "@/components/app/GiftLinkImporter";
import { StatusBadge } from "@/components/app/StatusBadge";
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
        <aside className="card flex flex-col p-6">
          <p className="t-eyebrow text-ink-soft">Identidade</p>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-ink-soft">
              Nomes
              <input
                className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4 text-ink"
                defaultValue={demoWedding.coupleNames}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink-soft">
              Mensagem principal
              <textarea
                className="rounded-2xl border border-[#5b6842]/14 bg-white p-4 text-ink"
                rows={5}
                defaultValue={demoWedding.welcomeText}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink-soft">
              Cor principal
              <input
                type="color"
                className="h-12 rounded-2xl border border-[#5b6842]/14 bg-white p-1"
                defaultValue={demoWedding.theme.primaryDark}
              />
            </label>
          </div>
          <Link href="/casamento/pedro-e-rafaela" className="btn btn-primary mt-6 w-full text-sm">
            Prévia pública
          </Link>

          <div className="mt-auto border-t border-[#5b6842]/12 pt-6">
            <p className="t-eyebrow text-ink-soft">Resumo do site</p>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-soft">Status</dt>
                <dd>
                  <StatusBadge status={demoWedding.status} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-soft">Link</dt>
                <dd className="truncate font-bold text-ink">/casamento/{demoWedding.slug}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-soft">Modelo</dt>
                <dd className="font-bold text-ink">{demoWedding.templateName}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-soft">Galeria</dt>
                <dd className="font-bold text-ink">{demoWedding.gallery.length} fotos</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-soft">Cor principal</dt>
                <dd className="flex items-center gap-2 font-bold text-ink">
                  <span
                    className="size-4 rounded-full border border-[#5b6842]/20"
                    style={{ background: demoWedding.theme.primaryDark }}
                    aria-hidden
                  />
                  {demoWedding.theme.primaryDark}
                </dd>
              </div>
            </dl>
          </div>
        </aside>

        <section className="grid gap-4">
          <GiftLinkImporter />
          <p className="mt-2 t-eyebrow text-ink-soft">Seções do site</p>
          {editableSections.map(([title, status, description]) => {
            const active = status === "Ativo";
            return (
              <article key={title} className="card card-interactive group p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="t-h3">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-ink-soft">{description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 t-eyebrow ${
                        active ? "bg-[#5b6842]/16 text-forest" : "bg-[#c79a3f]/22 text-[#5c3f12]"
                      }`}
                    >
                      {status}
                    </span>
                    <span
                      className="text-ink-soft transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:translate-x-0 motion-reduce:transition-none"
                      aria-hidden
                    >
                      →
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
