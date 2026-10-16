import type { CSSProperties } from "react";
import Image from "next/image";
import { IPhone } from "@/components/landing/Modelos";
import { AI_SITE_FEE_LABEL, MAX_AI_GENERATIONS, MAX_AI_PHOTOS, PUBLISH_FEE_LABEL } from "@/lib/platform-data";

// Ilustrativo: o casal de demonstração (lib/demo-wedding) escrito como um casal escreveria
// no briefing de /ia, com os rótulos do AiBriefingForm. Não é entrada nem saída real da IA.
// desktopOnly: no celular o papel fica com nomes, história e estilo (o palco cabe em ~650px).
const BRIEFING: { label: string; value: string; desktopOnly?: boolean }[] = [
  { label: "Nomes do casal", value: "Helena & Lucas" },
  { label: "Data", value: "5 de dezembro de 2026", desktopOnly: true },
  { label: "Local", value: "Fazenda Três Ipês", desktopOnly: true },
  { label: "Cidade", value: "Itu, SP", desktopOnly: true },
  { label: "A história de vocês", value: "Conversas longas, viagens curtas. Quando a gente viu, já era casa." },
  { label: "Como vocês imaginam o site", value: "Elegante e noturno, com cara de cinema." }
];

// Cada linha tem evidência em lib/ai-site.ts (campos que a IA preenche).
const DOES = [
  { head: "Escolhe o modelo", rest: "que combina com o casamento de vocês." },
  {
    head: "Escreve todos os textos:",
    rest: "a frase-convite, as boas-vindas, a história em três capítulos, a programação e a confirmação de presença."
  },
  { head: "Cuida das fotos:", rest: "escolhe a da capa e a do rodapé, ordena a galeria e descreve cada uma." },
  { head: "Prepara o link:", rest: "a descrição que aparece quando o site é compartilhado no WhatsApp." }
];

/**
 * Site feito pela IA — "transformação": o briefing em papel, nas palavras do casal, vira o
 * site no celular. Server component, sem JS. Composição espelhada (palco à esquerda) para
 * variar de Modelos/Presentes/Convidados/Pricing, que põem a imagem à direita.
 * Desktop: palco 1–7 sticky (o celular cobre 64px do papel, dentro do pr-20 dele); texto
 * 8–12. Celular: título, papel, e numa linha a legenda (esquerda) e o celular (direita),
 * que sobe 64px sobre o pb-20 do papel — sem vão ao lado do aparelho.
 * Proibido na copy: número de modelos, "gerações ilimitadas", IA depois de publicar.
 */
export function SiteIa() {
  return (
    <section id="ia" aria-labelledby="ia-titulo" className="bg-bg-2 py-12 text-ink lg:py-24">
      <div className="wrap grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8">
        <div data-reveal className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:self-end">
          <p className="t-eyebrow text-ink-soft">Site feito pela IA</p>
          <h2 id="ia-titulo" className="mt-3 t-h1 text-balance">
            Vocês contam a história. <em className="italic">A IA monta o site.</em>
          </h2>
          <p className="mt-4 t-lead">
            Sem tempo para montar? Preencham o briefing com os dados do casamento, escrevam a história do jeito que sair e
            mandem até {MAX_AI_PHOTOS} fotos. Em cerca de um minuto, o site aparece no editor.
          </p>
        </div>

        <figure className="mx-auto mt-8 grid w-full max-w-[30rem] grid-cols-[minmax(0,1fr)_48%] items-end gap-x-4 lg:sticky lg:top-24 lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:flex lg:max-w-none lg:flex-wrap lg:items-center lg:gap-x-0 lg:self-start">
          {/* O papel. pb-20 (celular) e pr-20 (desktop) reservam a faixa que o celular cobre. */}
          <div
            data-reveal
            className="relative col-span-2 w-[92%] -rotate-1 rounded-[3px] border border-ink/10 bg-[var(--panel)] px-5 pb-20 pt-5 shadow-[0_1px_2px_rgb(26_30_21/0.06),0_28px_48px_-30px_rgb(26_30_21/0.5)] lg:w-[62%] lg:-rotate-2 lg:px-7 lg:pb-7 lg:pr-20 lg:pt-6"
          >
            <div className="flex items-center justify-between gap-3 border-b border-ink/15 pb-3">
              <p className="m-0 font-serif text-[1.375rem] leading-none">Briefing</p>
              <p className="m-0 shrink-0 rounded-full border border-ink/20 px-2.5 py-1 text-[0.75rem] leading-none text-ink-soft">
                Exemplo ilustrativo
              </p>
            </div>
            <dl className="m-0">
              {BRIEFING.map(({ label, value, desktopOnly }) => (
                <div
                  key={label}
                  className={`border-b border-ink/10 py-2.5 last:border-b-0 ${desktopOnly ? "max-sm:hidden" : ""}`}
                >
                  <dt className="text-[0.75rem] font-semibold uppercase leading-tight tracking-[0.12em] text-ink-soft">
                    {label}
                  </dt>
                  <dd className="m-0 mt-1 font-serif text-[1.125rem] italic leading-snug text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* O site: chega 120ms depois do papel, por cima dele. */}
          <div
            data-reveal
            style={{ transitionDelay: "120ms", "--reveal-y": "28px" } as CSSProperties}
            className="relative z-10 col-start-2 row-start-2 -mt-16 w-full max-w-60 justify-self-end lg:-ml-16 lg:mt-0 lg:w-[40%] lg:max-w-none lg:shrink-0"
          >
            <IPhone>
              <Image
                src="/assets/landing/capa/cinema-noir-phone.webp"
                alt="Modelo Cinema Noir no celular, com dados de demonstração: capa escura com a data, os nomes Helena Ribeiro e Lucas Moreira e o local"
                fill
                sizes="(min-width: 1024px) 256px, 48vw"
              />
            </IPhone>
          </div>

          <figcaption className="col-start-1 row-start-2 pb-1 text-[13px] leading-normal text-ink-soft lg:mt-6 lg:max-w-[36rem] lg:basis-full lg:pb-0">
            Exemplo ilustrativo com o casal de demonstração da Noivar. O celular mostra o modelo Cinema Noir, não um site
            gerado pela IA.
          </figcaption>
        </figure>

        <div className="mt-10 lg:col-span-5 lg:col-start-8 lg:row-start-2">
          <h3 data-reveal className="t-h3">
            Nesse minuto, a IA
          </h3>
          <ul className="hairline-rows mt-3 border-y border-ink/15">
            {DOES.map(({ head, rest }, i) => (
              <li
                key={head}
                data-reveal
                style={{ transitionDelay: `${i * 60}ms` }}
                className="py-3 text-[15px] leading-[1.55] lg:text-base"
              >
                <span className="font-serif text-[1.25rem] leading-none">{head}</span> {rest}
              </li>
            ))}
          </ul>

          {/* As duas frases andam juntas: a promessa e a revisão logo abaixo. */}
          <p data-reveal className="mt-6 t-subtitle text-balance">
            Tudo a partir do que vocês contaram. <em className="italic">Ela não inventa lugar, data nem lembrança.</em>
          </p>
          <p data-reveal className="mt-3 text-[15px] leading-[1.55]">
            O site abre no editor para vocês revisarem, e tudo continua editável. Dá para gerar até {MAX_AI_GENERATIONS}{" "}
            vezes por casamento.
          </p>

          <div data-reveal className="mt-8">
            <dl className="ledger">
              <div>
                <dt>Gerar e revisar o site</dt>
                <dd>R$ 0</dd>
              </div>
              <div>
                <dt>Publicar, uma vez, via Pix</dt>
                <dd>{AI_SITE_FEE_LABEL}</dd>
              </div>
              <div>
                <dt>Taxa nos presentes via Pix</dt>
                <dd>0%</dd>
              </div>
            </dl>
            {/* Sem data-cta-modelo: a IA escolhe o modelo; o cadastro leva direto ao briefing. */}
            <a
              data-cta="ia"
              href="/cadastro?ia=1"
              className="btn btn-primary mt-6 min-h-14 w-full duration-150 sm:w-auto sm:px-10"
            >
              Quero que a IA monte
            </a>
            <p className="mt-3 text-[13px] leading-normal text-ink-soft">
              Criem a conta e sigam direto para o briefing. Depois da primeira geração, a publicação fica{" "}
              {AI_SITE_FEE_LABEL}, mesmo que vocês reescrevam tudo. Preferem montar vocês no editor, sem a IA? A
              publicação fica {PUBLISH_FEE_LABEL}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
