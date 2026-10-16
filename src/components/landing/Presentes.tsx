import Image from "next/image";
import { SHOWCASE_IDS, type ShowcaseId } from "@/components/landing/showcase";

// Comparação por categoria, datada, sem nome de concorrente (CONAR art. 32).
// ponytail: re-checar mensalmente enquanto houver anúncio
const MARKET_FEE = { ratePct: 3.89, exampleBrl: 10_000, checkedAt: "setembro de 2026" };

const pct = MARKET_FEE.ratePct.toLocaleString("pt-BR");
const example = MARKET_FEE.exampleBrl.toLocaleString("pt-BR");
const cost = Math.round((MARKET_FEE.exampleBrl * MARKET_FEE.ratePct) / 100).toLocaleString("pt-BR");

const FLOW = [
  "O convidado escolhe a cota e gera o Pix no próprio site.",
  "O código mostra para quem vai: o nome de vocês.",
  "Ele paga no app do banco, e o valor cai direto na chave de vocês. A Noivar não toca no dinheiro.",
  "Cada presente aparece no painel com o nome e o recado de quem mandou. Vocês conferem no extrato e marcam como recebido."
];

/**
 * Presentes — faixa forest que torna o "0% no Pix" verificável: como o dinheiro
 * chega, a conta com uma taxa de mercado datada e a taxa do cartão ao lado da
 * promessa. Server component. Texto sempre --on-forest (secundário 80%, nota 70%).
 * Desktop: grade de 2 colunas em 3 linhas (0% | recortes, fluxo | recortes,
 * conta | cartão). Mobile segue a ordem do DOM.
 */
export function Presentes({ modelo = SHOWCASE_IDS[0] }: { modelo?: ShowcaseId }) {
  return (
    <section
      id="presentes"
      aria-labelledby="presentes-titulo"
      className="bg-forest py-12 text-on-forest lg:py-24"
    >
      <div className="wrap grid gap-x-8 lg:grid-cols-12">
        <div data-reveal className="lg:col-span-6 lg:row-start-1">
          <h2 id="presentes-titulo" className="t-h1 text-balance">
            Presente via Pix cai <span className="italic">inteiro</span> na conta de vocês.
          </h2>
          <p className="mt-4 flex items-center gap-4 lg:mt-6">
            <span className="t-display shrink-0">0%</span>
            <span className="t-subtitle text-balance">de taxa no Pix. Nem para vocês, nem para os convidados.</span>
          </p>
        </div>

        {/* Recortes reais do Jardim Romântico: modal na frente, cota atrás. A pilha é a caixa do
            modal (704×1070 → 320×486px no desktop); a cota (388×874) tira a altura da caixa, não da
            própria largura: top 40px + (100% − 64px) termina 24px acima do modal, então nunca sai
            da caixa nem alcança a linha 3 (cartão), em qualquer largura. Sai 144px à esquerda (a
            1024px avança 8px no gap da grade) e mostra ~77% dos 187px: foto, título e valor. */}
        <div
          data-reveal
          className="mt-6 flex justify-center lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:items-center lg:justify-end"
        >
          <div className="relative w-[min(72vw,280px)] lg:w-80">
            <Image
              src="/assets/landing/presentes-cotas.webp"
              alt="Cota Lua de Mel em Portugal na lista de presentes do modelo Jardim Romântico, com valor livre e botão Presentear"
              width={388}
              height={874}
              sizes="190px"
              className="absolute top-10 -left-36 hidden h-[calc(100%-4rem)] w-auto rounded-2xl lg:block"
            />
            <Image
              src="/assets/landing/presentes-pix.webp"
              alt="Janela de presente em dinheiro do modelo Jardim Romântico: cota Lua de Mel em Portugal, selo 0% de taxa · 100% para o casal, valor de R$ 150, campos opcionais de nome e mensagem e botão Gerar Pix"
              width={704}
              height={1070}
              sizes="(min-width: 1024px) 320px, 280px"
              className="relative h-auto w-full rounded-[22px] shadow-[0_28px_56px_-28px_rgb(0_0_0/0.55)]"
            />
          </div>
        </div>

        <ol className="hairline-rows mt-4 lg:col-span-6 lg:row-start-2 lg:mt-10">
          {FLOW.map((step, i) => (
            <li key={step} data-reveal style={{ transitionDelay: `${i * 60}ms` }} className="py-3 leading-[1.55] lg:py-3.5">
              {step}
            </li>
          ))}
        </ol>

        <div data-reveal className="mt-6 lg:col-span-6 lg:row-start-3 lg:mt-12">
          <p className="m-0 rounded-md border border-on-forest/25 px-5 py-4 leading-[1.55]">
            Numa lista que cobra {pct}% por presente, R$ {example} em presentes pagam R$ {cost} de taxa, saindo de vocês
            ou somada ao Pix dos convidados. Aqui, via Pix: R$ 0.
          </p>
          <p className="mt-3 text-xs leading-normal text-on-forest/70">
            {pct}%: taxa por presente publicada por plataformas brasileiras de lista de casamento, consultada em{" "}
            {MARKET_FEE.checkedAt}. Varia por plano.
          </p>
        </div>

        <div data-reveal className="mt-6 lg:col-span-6 lg:col-start-7 lg:row-start-3 lg:mt-12">
          <p className="m-0 leading-[1.55] text-on-forest/80">
            <strong className="font-semibold text-on-forest">E no cartão?</strong> Conectem a conta Mercado Pago de vocês e
            o convidado parcela em até 12x. Aí existe a taxa do Mercado Pago, e vocês escolhem se ela entra no valor do
            convidado ou sai do que vocês recebem.
          </p>
          <a
            href={`/cadastro?modelo=${modelo}`}
            data-cta="presentes"
            data-cta-modelo=""
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-semibold text-on-forest underline decoration-on-forest/50 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-on-forest motion-reduce:transition-none"
          >
            Montar nosso site grátis <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
