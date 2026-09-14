import Link from "next/link";

// O que JUSTIFICA o valor — sem re-listar RSVP/recados/presentes/contagem nem os 4
// fatos (0%/R$149,90/1 link/tempo real). Vende valor novo: o modelo editorial inteiro,
// editar-em-vez-de-configurar, e o site que dura como lembrança depois da festa.
const INCLUDED: readonly string[] = [
  "Um dos modelos editoriais inteiro — a tipografia de revista e a fotografia em destaque dos exemplos acima, agora com a história de vocês.",
  "Pronto para editar, não para configurar: vocês trocam textos, fotos e datas, e o resto já vem montado.",
  "Um site que continua no ar depois da festa — a lembrança digital do dia, para rever quando quiserem."
];

/**
 * Pricing — o momento de DECISÃO da página, na ponte de cor forest. O preço é dito
 * como FRASE, não como numeral de outdoor (o "0%" e o "R$149,90" já foram gastos no
 * Hero/Features/SocialProof). Declaração type-led à esquerda, um filete dourado fino,
 * e uma banda assimétrica: o "incluído" vende valor novo, o bloco de decisão ancora a
 * conversão. Sem card, sem grid de números, sem tabela de planos (há UMA taxa).
 * Server component, sem JS: reveal via data-reveal (global) e o lift do CTA vem do
 * próprio .btn-inverse:hover (CSS).
 */
export function Pricing() {
  return (
    <section id="preco" className="section bg-forest text-on-forest">
      <div className="wrap">
        {/* Declaração: o preço como frase. Heading com centro de gravidade tipográfico
            (~16ch, quebra em verso); valor no peso de uma sentença, jamais t-display. */}
        <div data-reveal>
          <h2 className="max-w-[16ch] text-balance t-h1 italic text-on-forest">
            Uma taxa. Uma vez. Depois, o site é de vocês.
          </h2>
          <p className="measure mt-6 t-subtitle text-on-forest/85">
            São <span className="font-medium text-on-forest">R$149,90</span> para publicar —
            pagos uma vez só. Não é plano, nem assinatura.
          </p>
        </div>

        {/* Único gold da seção: a geometria do .card-accent (2px × 2.5rem), montada à
            mão porque aqui não há card. Separa a declaração do corpo. */}
        <div data-reveal className="mt-10">
          <span className="block h-[2px] w-10 rounded-full bg-gold" />
        </div>

        {/* Banda assimétrica: incluído (7) + decisão (5). Altura segue o conteúdo. */}
        <div className="mt-12 grid gap-x-12 gap-y-12 md:grid-cols-12">
          {/* Incluído — valor novo, empilhado em hairlines. Sem ícone/checkmark/numeração. */}
          <div className="md:col-span-7">
            {/* Rótulo deliberado em serif italic — NÃO eyebrow uppercase reflexo. */}
            <p data-reveal className="font-serif text-lg italic text-on-forest/85">
              O que vem junto
            </p>
            <ul className="mt-6">
              {INCLUDED.map((item, i) => (
                <li
                  key={i}
                  data-reveal
                  style={{ transitionDelay: `${i * 80}ms` }}
                  className="mt-5 border-t border-on-forest/15 pt-5 leading-7 text-on-forest/85 first:mt-0"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Decisão: termos honestos, depois CTA creme e link de menor compromisso. */}
          <div data-reveal className="md:col-span-5">
            <p className="leading-7 text-on-forest/85">
              Sem mensalidade, sem renovação, sem letra miúda. Editem à vontade, quantas
              vezes quiserem — só se paga na hora de publicar; antes disso, nada é cobrado.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3">
              {/* !text-forest: o color do .btn-inverse perde para o text-on-forest herdado
                  da section (cascade Tailwind v4); o repo força a cor dos botões com `!`.
                  O lift no hover já vem do próprio .btn-inverse:hover (CSS). */}
              <div className="w-full sm:w-auto">
                <Link href="/cadastro" className="btn btn-inverse !text-forest min-h-14 w-full px-8">
                  Criar meu site
                </Link>
              </div>
              {/* Alvo de toque confortável (~44px) — não só a altura da linha de texto. */}
              <a
                href="#modelos"
                className="-mx-2 inline-flex min-h-11 items-center px-2 text-on-forest underline decoration-on-forest/40 underline-offset-4 transition-colors duration-200 hover:decoration-on-forest motion-reduce:transition-none"
              >
                Ver os modelos por dentro
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
