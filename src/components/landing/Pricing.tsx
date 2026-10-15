import { Icon } from "@/components/app/icons";
import { SHOWCASE_IDS, type ShowcaseId } from "@/components/landing/showcase";
import { PUBLISH_FEE_BRL, PUBLISH_FEE_LABEL } from "@/lib/platform-data";

const HOST = new URL(process.env.APP_URL || "http://localhost:3000").host;

type Item = { item: string; detail?: string };

// O que a taxa compra, na ordem do recibo. Cada linha tem evidência no código
// (brief 3.6). Nada de promessa de prazo além do que está em COMPANY.
const INCLUDED: readonly Item[] = [
  { item: "Confirmação pela lista de convidados", detail: "Só confirma quem está na lista" },
  { item: "Recados dos convidados", detail: "Guardados no painel" },
  { item: "Lista de presentes com cotas", detail: "Com foto e valor" },
  { item: "Pix com 0% de taxa", detail: "Direto na chave de vocês" },
  { item: "Cartão em até 12x", detail: "Opcional, pela conta Mercado Pago de vocês" },
  { item: "Presentes importados por link", detail: "Quando a loja permite, nome, valor e foto entram sozinhos" },
  { item: "Contagem regressiva" },
  { item: "História do casal" },
  { item: "Locais com link do mapa" },
  { item: "Programação do dia" },
  { item: "Cartões de traje, hospedagem e cardápio" },
  { item: "Galeria com até 40 fotos" },
  { item: "Endereço com o nome de vocês", detail: `${HOST}/casamento/…` },
  { item: "Prévia com foto e título no WhatsApp" },
  { item: "Link para a cerimonialista", detail: "Só leitura, sem ver o Pix" },
  { item: "Troca de modelo", detail: "Sem perder textos e fotos" }
];

/** Linhas visíveis no celular antes do <details>. */
const MOBILE_VISIBLE = 6;

// "menos de R$ X por convidado" num casamento de 100: sobe para o próximo décimo,
// então continua verdade se a taxa mudar.
const PER_GUEST = ((Math.floor(PUBLISH_FEE_BRL / 10) + 1) / 10).toFixed(2).replace(".", ",");

/** `reveal`: posição no stagger de 40ms (limitado às 8 primeiras); sem ele, a linha não anima. */
function Row({ item, detail, reveal }: Item & { reveal?: number }) {
  return (
    <li
      data-reveal={reveal === undefined ? undefined : ""}
      style={reveal === undefined ? undefined : { transitionDelay: `${Math.min(reveal, 7) * 40}ms` }}
      className="flex items-baseline justify-between gap-4 border-t border-line py-2.5"
    >
      <div className="min-w-0">
        <p className="font-serif text-[1.1875rem] leading-[1.25] text-ink">{item}</p>
        {detail ? <p className="mt-0.5 text-sm leading-[1.35] text-ink-soft">{detail}</p> : null}
      </div>
      <span className="shrink-0 text-[0.8125rem] text-ink-soft">incluso</span>
    </li>
  );
}

/**
 * Preço — recibo itemizado + painel de total forest (o ponto de decisão).
 * Server component, sem JS: no celular as linhas 7–16 ficam num <details> nativo;
 * no desktop o recibo inteiro aparece em duas colunas (8+8) e o total fica sticky.
 * ponytail: o recibo é renderizado duas vezes (celular / desktop, uma delas em
 * display:none) porque <details> não abre por media query; ~2 KB de HTML.
 *
 * `modelo` é só o href sem JS; o LandingBehavior troca o ?modelo no [data-cta-modelo].
 */
export function Pricing({ modelo = SHOWCASE_IDS[0] }: { modelo?: ShowcaseId }) {
  return (
    <section id="preco" className="bg-bg py-12 text-ink lg:py-24">
      <div className="wrap grid gap-10 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-7">
          <h2 data-reveal className="t-h1 text-balance">
            Uma taxa. Uma vez. <em className="italic">Sem mensalidade.</em>
          </h2>
          <p data-reveal className="mt-4 t-h3">
            Tudo incluso, em qualquer modelo
          </p>

          {/* Celular: 6 linhas + <details> com o resto. */}
          <div className="mt-6 lg:hidden">
            <ul className="border-b border-line">
              {INCLUDED.slice(0, MOBILE_VISIBLE).map((row, i) => (
                <Row key={row.item} {...row} reveal={i} />
              ))}
            </ul>
            <details className="group border-b border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                Ver os {INCLUDED.length} itens incluídos
                <Icon
                  name="chevronDown"
                  size={20}
                  strokeWidth={1.5}
                  className="shrink-0 text-ink-soft transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <ul>
                {INCLUDED.slice(MOBILE_VISIBLE).map((row) => (
                  <Row key={row.item} {...row} />
                ))}
              </ul>
            </details>
          </div>

          {/* Desktop: recibo inteiro em duas colunas de 8 linhas. */}
          <ul className="mt-8 hidden border-b border-line lg:grid lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-[repeat(8,auto)] lg:gap-x-8">
            {INCLUDED.map((row, i) => (
              <Row key={row.item} {...row} reveal={i} />
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5">
          <div
            data-reveal
            className="@container rounded-sm bg-forest p-6 text-on-forest sm:p-8 lg:sticky lg:top-22"
          >
            <p className="text-[0.8125rem] text-on-forest/80">Total</p>
            <span aria-hidden className="mt-2 block h-px w-10 bg-on-forest/50" />
            {/* Escala do brief, limitada pela largura do painel (a 1024px 7rem estouraria). */}
            <p className="mt-4 whitespace-nowrap font-serif text-[clamp(3.5rem,min(2rem+8vw,28cqi),7rem)] leading-none">
              {PUBLISH_FEE_LABEL}
            </p>
            <p className="mt-5 text-on-forest">pagos via Pix, uma única vez, só na hora de publicar.</p>
            <p className="mt-1 text-on-forest/80">Montar, editar e ver o site pronto é grátis.</p>
            <a
              id="preco-cta"
              data-cta="preco"
              data-cta-modelo
              href={`/cadastro?modelo=${modelo}`}
              className="btn btn-inverse mt-6 min-h-14 w-full duration-150"
            >
              Montar nosso site grátis
            </a>
            <p className="mt-4 text-[0.8125rem] leading-5 text-on-forest/80">
              Num casamento com 100 convidados, dá menos de R$ {PER_GUEST} por convidado.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
