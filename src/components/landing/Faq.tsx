"use client";

import Link from "next/link";
import { useState } from "react";

// As 6 dúvidas que mais convertem — copy honesta, sem inventar recurso/garantia/urgência.
// Ordem do DOM: a maior objeção de confiança (presentes 100%) vem primeira e aberta.
const FAQ: readonly { q: string; a: string }[] = [
  {
    q: "Os presentes em dinheiro vão mesmo 100% para a gente?",
    a: "Vão. Cada Pix de presente cai direto na chave de vocês, com 0% de taxa — a gente nunca encosta no dinheiro, ele nem passa pela plataforma. O que o convidado manda é exatamente o que vocês recebem, na hora. Se quiserem, dá pra aceitar cartão também: aí o pagamento cai na conta Mercado Pago de vocês, e a taxa é do Mercado Pago (dá pra deixar ela por conta do convidado, e vocês recebem o valor cheio)."
  },
  {
    q: "Quanto custa? Tem mensalidade?",
    a: "Uma taxa única de R$149,90, paga só na hora de publicar. Sem mensalidade, sem renovação, sem letra miúda. Antes de publicar, vocês editam à vontade, de graça — só paga pra colocar o site no ar."
  },
  {
    q: "Preciso saber mexer em site ou tecnologia?",
    a: "Não. Vocês escolhem um modelo pronto e trocam só os textos, as fotos e as datas. Layout, confirmação de presença e contagem regressiva já vêm montados. Se você manda mensagem no WhatsApp, dá conta."
  },
  {
    q: "Dá pra mudar as coisas depois de publicar?",
    a: "Dá. Mudou o horário, o endereço, uma foto? É só entrar e atualizar os dados — o site no ar muda junto, sem pagar de novo."
  },
  {
    q: "Como os convidados confirmam presença e deixam recado?",
    a: "Tudo pelo próprio site, no mesmo link: confirmam em um toque e escrevem o recado ali mesmo. Vocês acompanham quem vem e leem os recados num painel que atualiza em tempo real — sem grupo de WhatsApp, sem planilha."
  },
  {
    q: "O site sai do ar depois do casamento?",
    a: "Não. Ele continua no ar como lembrança do dia — pra vocês reverem e mostrarem quando quiserem, sempre no mesmo endereço."
  }
];

/**
 * FAQ — o respiro de creme depois do clímax forest do Pricing, último filtro de
 * objeção antes do footer. Composição assimétrica: manifesto sticky à esquerda,
 * accordion em hairlines à direita (sem cards). Single-open, 1ª aberta para a
 * seção nunca aparecer colapsada e dar conteúdo no 1º paint.
 *
 * Acordeão correto > estética. A animação de altura usa o truque CSS
 * grid-template-rows 0fr↔1fr (anima nativo, robusto e leve) em vez de Framer
 * height:"auto" — que, na prática, fixa a altura no mount mas não re-anima na
 * troca de estado. A resposta fica SEMPRE no DOM (bom p/ SEO e no-JS), só
 * recortada por overflow quando fechada; aria-hidden tira a colapsada da árvore
 * de a11y (aria-expanded verdadeiro) sem removê-la do DOM. O reveal de entrada
 * vive nos WRAPPERS (data-reveal, à prova de no-JS) e anima opacity/translateY —
 * propriedade distinta do grid-rows, sem conflito. prefers-reduced-motion zera
 * as transições via motion-reduce.
 */
export function Faq() {
  // Single-open: um índice resolve tudo. 1ª aberta por padrão.
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="duvidas" className="section bg-bg">
      <div className="wrap">
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-12 md:items-start">
          {/* ESQUERDA — manifesto sticky: heading editorial (sem eyebrow reflexo),
              intro curta, o único gold da seção e a âncora honesta de conversão. */}
          <div data-reveal className="self-start md:col-span-5 md:sticky md:top-28">
            <h2 className="text-balance t-h1 italic text-ink">Perguntas antes do sim.</h2>
            <p className="measure mt-5 t-lead text-ink">
              As dúvidas que mais aparecem — respondidas direto, sem letra miúda.
            </p>

            {/* Único gold da seção: a geometria do .card-accent, montada à mão. */}
            <span className="mt-8 block h-[2px] w-10 rounded-full bg-gold" />

            {/* Âncora honesta: não inventa canal de suporte; reenquadra a conversão
                ('montar de graça e ver por dentro') sem repetir o bloco de Pricing. */}
            <p className="mt-8 font-serif text-lg italic text-ink">Ainda com uma dúvida?</p>
            <p className="measure mt-2 leading-7 text-ink-soft">
              A resposta mais honesta é montar o site inteiro de graça e ver por dentro —
              você só paga se decidir publicar.
            </p>
            <div className="mt-5 flex flex-col items-start gap-3">
              {/* Única .btn da seção. !text-on-forest: o color de .btn-primary perde
                  para o text-* herdado (cascade Tailwind v4); o repo força com `!`. */}
              <Link href="/cadastro" className="btn btn-primary !text-on-forest min-h-12 px-7">
                Criar minha conta
              </Link>
              <a
                href="#modelos"
                className="-mx-2 inline-flex min-h-11 items-center px-2 underline decoration-forest/30 underline-offset-4 transition-colors duration-200 hover:decoration-forest motion-reduce:transition-none"
              >
                Ver um modelo por dentro
              </a>
            </div>
          </div>

          {/* DIREITA — accordion APG (heading + button + region). Sem <dl> para não
              misturar dois padrões (dt não pode conter heading content). */}
          <div className="md:col-span-7">
            {FAQ.map((item, i) => {
              const isOpen = open === i;
              const btnId = `faq-q-${i}`;
              const panelId = `faq-a-${i}`;

              return (
                <div
                  key={btnId}
                  data-reveal
                  style={{ transitionDelay: `${i * 70}ms` }}
                  className="border-t border-forest/12 first:border-t-0"
                >
                  {/* Pergunta dentro de heading p/ navegação por leitor de tela (APG).
                      Toggle é linha de texto (ink herdado), NÃO .btn. */}
                  <h3 className="t-h3 italic">
                    <button
                      type="button"
                      id={btnId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-6 rounded-lg py-5 text-left text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                    >
                      <span>{item.q}</span>
                      {/* Chevron gira via CSS; cor ink-soft (não gold), estado já
                          anunciado por aria-expanded → aria-hidden. */}
                      <span
                        aria-hidden
                        className={`shrink-0 text-ink-soft transition-transform duration-300 motion-reduce:transition-none ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        ⌄
                      </span>
                    </button>
                  </h3>

                  {/* Resposta SEMPRE no DOM. Altura animada por grid-template-rows
                      0fr↔1fr (CSS nativo, robusto); o filho overflow-hidden/min-h-0
                      colapsa junto. aria-hidden quando fechada: tira da árvore de
                      a11y sem remover do DOM (crawler ainda lê). */}
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    aria-hidden={!isOpen}
                    className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p className="pb-6 pr-10 leading-7 text-ink-soft">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
