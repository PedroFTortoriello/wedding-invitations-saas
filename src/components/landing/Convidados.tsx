import Image from "next/image";
import { IPhone } from "@/components/landing/Modelos";
import { modeloAsset } from "@/components/landing/showcase";

// A página inteira do Editorial Luxury no celular (390×9556), a mesma que rola na vitrine de Modelos.
const PAGE = modeloAsset("editorial-luxury", "mobile-full");
// A tela do .iphone mostra 846px dessa captura (proporção 0,461 na largura de 390), em qualquer tamanho.
const SCROLL = 9556 - 846;
// ponytail: topos medidos à mão na captura; recapturou (scripts/capture-landing.py tour), meça de novo.
const at = (top: number) => `50% ${((top / SCROLL) * 100).toFixed(2)}%`;

// A contagem muda a cada captura: sem números no alt.
const SCREENS = [
  {
    top: 7020,
    label: "Confirmação de presença",
    alt: "Seção Confirme sua presença do modelo Editorial Luxury no celular, com o prazo Responda até 5 de novembro, o campo Nome completo (Digite para buscar seu nome), o botão Confirmar presença e o link Não poderei ir"
  },
  {
    top: 3506,
    label: "Contagem e programação",
    alt: "Contagem regressiva do modelo Editorial Luxury no celular, em dias, horas, minutos e segundos até 5 de dezembro de 2026, às 16:30, seguida da programação O dia, com a Recepção às 16:30 e a Cerimônia às 17:30"
  },
  {
    top: 4680,
    label: "Local e mapa",
    alt: "Seção O local do modelo Editorial Luxury no celular: Fazenda Três Ipês, em Itu, SP, com o botão Abrir no Google Maps e o mapa do lugar"
  },
  {
    top: 8612,
    label: "Recados",
    alt: "Formulário Deixe um recado do modelo Editorial Luxury no celular, com os campos Seu nome e Recado e o botão Enviar recado, acima do rodapé com os nomes Helena Ribeiro e Lucas Moreira"
  }
];

// wide: no desktop a frase cobre as duas telas do meio (contagem e mapa).
const BEATS = [
  {
    title: "Só confirma quem foi convidado.",
    text: "O convidado digita o nome, escolhe na lista de vocês e toca em Confirmar presença. Quem não está na lista não consegue confirmar."
  },
  {
    title: "Data, programação e mapa.",
    text: "Contagem regressiva até o dia, os horários da programação e o local, com um botão que abre o mapa.",
    wide: true
  },
  {
    title: "E deixa um recado.",
    text: "Os recados ficam guardados no painel de vocês, para ler antes, durante e depois do dia."
  }
];

/**
 * Convidados — o site do lado do convidado, em quatro celulares com a mesma captura do
 * Editorial Luxury, cada um enquadrado num trecho (object-position). Server component, sem JS.
 * Uma faixa forest decorativa (sem texto em cima) corre de ponta a ponta atrás dos aparelhos;
 * abaixo, uma linha de frases alinhada às telas e o fecho da cerimonialista como régua (.ledger).
 *   desktop  cabeçalho 7/5; celulares nas 4 colunas do .wrap, os das pontas 24px mais baixos
 *            (arco simétrico, só translate: não mexe na altura da linha); frases na mesma grade,
 *            a do meio em 2 colunas, e a régua encaixada sob as colunas 2–4.
 *   mobile   .snap-row de celulares de min(56vw, 15rem) com legenda curta; frases e régua empilhadas.
 */
export function Convidados() {
  return (
    <section id="convidados" aria-labelledby="convidados-titulo" className="bg-bg-2 py-12 text-ink lg:py-24">
      <div data-reveal className="wrap lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8">
        <h2 id="convidados-titulo" className="t-h1 text-balance lg:col-span-7">
          Do lado de lá <span className="italic">do link.</span>
        </h2>
        <div className="mt-4 lg:col-span-5 lg:mt-0">
          <p className="m-0 t-lead">É assim que o site chega no celular dos convidados.</p>
          <p id="convidados-legenda" className="mt-2 text-[13px] leading-normal text-ink-soft">
            Telas reais do modelo Editorial Luxury, com dados de demonstração.
          </p>
        </div>
      </div>

      <div className="relative mt-6 lg:mt-12">
        <div aria-hidden="true" className="absolute inset-x-0 top-[17%] bottom-[17%] bg-forest" />
        {/* tabIndex + nome: no celular a lista rola de lado e não tem nada focável dentro.
            py-6: o overflow do .snap-row cortaria a sombra dos aparelhos. */}
        <ul
          tabIndex={0}
          aria-label="O site no celular do convidado"
          aria-describedby="convidados-legenda"
          className="snap-row relative auto-cols-[min(56vw,15rem)] py-6 lg:mx-auto lg:max-w-300 lg:grid-flow-row lg:grid-cols-4 lg:gap-x-8 lg:overflow-visible lg:px-10 lg:py-0"
        >
          {SCREENS.map((screen, i) => (
            <li
              key={screen.label}
              data-reveal
              style={{ transitionDelay: `${i * 70}ms` }}
              className={i === 0 || i === SCREENS.length - 1 ? "lg:translate-y-6" : undefined}
            >
              <figure className="m-0">
                <IPhone>
                  <Image
                    src={PAGE}
                    alt={screen.alt}
                    fill
                    sizes="(min-width: 1024px) 240px, 52vw"
                    style={{ objectPosition: at(screen.top) }}
                  />
                </IPhone>
                <figcaption className="mt-3 text-[13px] leading-normal text-ink-soft lg:sr-only">{screen.label}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>

      {/* Mesma grade dos celulares: o traço de cada frase mede as telas que ela explica. No desktop a
          primeira frase, a mais longa, desce 2 linhas e a régua da cerimonialista encaixa ao lado dela,
          sob as outras duas: nenhuma coluna fica com vão embaixo. */}
      <div className="wrap mt-6 lg:mt-14 lg:grid lg:grid-cols-4 lg:gap-x-8">
        {BEATS.map((beat, i) => (
          <div
            key={beat.title}
            data-reveal
            style={{ transitionDelay: `${i * 70}ms` }}
            className={`border-t border-ink/30 py-4 lg:pb-0 lg:pt-5 ${i === 0 ? "lg:row-span-2" : ""} ${beat.wide ? "lg:col-span-2" : ""}`}
          >
            <h3 className="t-h3">{beat.title}</h3>
            <p className="mt-1.5 text-[15px] leading-[1.55] lg:text-base">{beat.text}</p>
          </div>
        ))}

        <dl data-reveal className="ledger mt-4 *:py-4 lg:col-span-3 lg:col-start-2 lg:mt-8 lg:self-end">
          <div>
            <dt>
              <strong className="font-semibold">Para a cerimonialista,</strong> um link para acompanhar confirmados e
              recados, sem ver o Pix e sem editar nada.
            </dt>
            <dd>Só leitura</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
