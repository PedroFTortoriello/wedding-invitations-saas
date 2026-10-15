import type { CSSProperties } from "react";
import Image from "next/image";
import { SHOWCASE_IDS, type ShowcaseId } from "@/components/landing/showcase";
import { PUBLISH_FEE_LABEL } from "@/lib/platform-data";
import s from "./capa.module.css";

// Host real do link do casal (APP_URL em produção; localhost no dev).
const HOST = new URL(process.env.APP_URL || "http://localhost:3000").host;

const STEPS: { verb: string; text: string; price: string; once?: boolean }[] = [
  {
    verb: "Escolham o modelo.",
    text: "Com o nome de vocês, o site já nasce montado no modelo escolhido. Dá para trocar depois sem perder textos e fotos.",
    price: "R$ 0"
  },
  {
    verb: "Editem vendo o site mudar.",
    text: "Textos, fotos, história, programação e locais. Cada ajuste aparece na hora, na prévia ao lado.",
    price: "R$ 0"
  },
  {
    verb: "Publiquem e mandem o link.",
    text: `Pagamento via Pix. O site vai para ${HOST}/casamento/helena-e-lucas, pronto para o WhatsApp.`,
    price: PUBLISH_FEE_LABEL,
    once: true
  }
];

/*
 * Linhas de chamada sobre capa/editor.webp. x/y = ponto na captura, em %.
 * 1: ícone de Modelo na lista · 2: linha "Recepção" da prévia · 3: botão Publicar do topo.
 * ponytail: coordenadas medidas na captura; se recapturar o editor, remedir.
 */
const CALLOUTS = [
  { n: 1, side: "left", x: "1.9%", y: "37.5%" },
  { n: 2, side: "right", x: "58%", y: "54.1%" },
  { n: 3, side: "right", x: "99.4%", y: "3.9%" }
] as const;

/**
 * Passos na faixa forest que nasce atrás dos aparelhos do hero: reverte o risco (dois
 * passos custam R$ 0, só o terceiro cobra). Desktop largo: editor inteiro à esquerda com
 * 3 chamadas numeradas (é uma sequência real) e passos com preço à direita. Tablet:
 * empilhado. Celular: sem imagem.
 *
 * `modelo` é o href sem JS; o LandingBehavior troca pelo último modelo escolhido
 * ([data-cta-modelo]). Por isso <a> e não <Link>.
 */
export function Passos({ modelo = SHOWCASE_IDS[0] }: { modelo?: ShowcaseId }) {
  return (
    <section id="como-funciona" aria-labelledby="passos-titulo" className={s.steps}>
      <div className={s.stepsGrid}>
        <h2 id="passos-titulo" data-reveal className={s.stepsTitle}>
          Vocês só pagam <em>no último passo.</em>
        </h2>

        <figure data-reveal className={s.editor}>
          <div className={s.editorFrame}>
            <div className={s.editorShot}>
              <Image
                src="/assets/landing/capa/editor.webp"
                alt="Editor da Noivar: à esquerda, Pronto para publicar 4 de 4 e as seções do site, com Modelo Jardim Romântico; à direita, a prévia ao vivo mostrando a programação do dia; no topo, o botão Publicar"
                width={1600}
                height={937}
                sizes="(min-width: 1200px) 60vw, (min-width: 768px) calc(100vw - 10rem), 1px"
              />
              {CALLOUTS.map((c) => (
                <span
                  key={c.n}
                  aria-hidden
                  data-n={c.n}
                  data-side={c.side}
                  className={s.callout}
                  style={{ "--x": c.x, "--y": c.y } as CSSProperties}
                />
              ))}
            </div>
          </div>
          <figcaption>Editor da Noivar · dados de demonstração</figcaption>
        </figure>

        <div className={s.stepsBody}>
          <ol className={s.list}>
            {STEPS.map((step, i) => (
              <li
                key={step.verb}
                data-reveal
                className={step.once ? `${s.item} ${s.itemPaid}` : s.item}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span aria-hidden className={s.num}>
                  {i + 1}
                </span>
                <h3>{step.verb}</h3>
                <p className={s.price}>
                  {step.price}
                  {step.once ? <small>uma vez</small> : null}
                </p>
                <p className={s.text}>{step.text}</p>
              </li>
            ))}
          </ol>

          <a data-cta="passos" data-cta-modelo href={`/cadastro?modelo=${modelo}`} className={s.stepsCta}>
            Montar nosso site grátis <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
