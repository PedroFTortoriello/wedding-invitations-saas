import { Icon } from "@/components/app/icons";
import { SHOWCASE_IDS, type ShowcaseId } from "@/components/landing/showcase";
import { AI_SITE_FEE_LABEL, MAX_AI_PHOTOS, PUBLISH_FEE_LABEL } from "@/lib/platform-data";

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
 * Preço — recibo itemizado + painel forest com os dois jeitos (o ponto de decisão): o site
 * feito pela IA em destaque (recorte creme, botão cheio) e o editor logo abaixo.
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
            Tudo incluso nos dois jeitos, em qualquer modelo
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
          {/* #preco-cta no painel inteiro: o CTA fixo do celular some enquanto qualquer parte dele
              (inclusive o destaque da IA) está na tela. O LandingBehavior só observa o id. */}
          <div
            id="preco-cta"
            data-reveal
            className="@container rounded-sm bg-forest p-6 text-on-forest sm:p-8 lg:sticky lg:top-22"
          >
            <p className="text-[0.8125rem] text-on-forest/80">Taxa única, via Pix, só na hora de publicar</p>
            <span aria-hidden className="mt-2 block h-px w-10 bg-on-forest/50" />

            {/* Site feito pela IA em destaque: recorte creme (texto --ink) com o botão cheio.
                Os dois preços têm peso parecido: o destaque vem da ordem, do recorte e do botão. */}
            <div className="mt-5 rounded-sm bg-bg p-5 text-ink sm:p-6">
              <p className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 font-serif text-[1.375rem] leading-tight">Site feito pela IA</span>
                <span className="shrink-0 whitespace-nowrap font-serif text-[clamp(1.75rem,11cqi,2.5rem)] leading-none">
                  {AI_SITE_FEE_LABEL}
                </span>
              </p>
              <p className="mt-3 text-[0.9375rem] leading-6">
                Vocês mandam os dados e até {MAX_AI_PHOTOS} fotos; a IA escolhe o modelo, escreve os textos e monta o
                site.
              </p>
              <a data-cta="preco-ia" href="/cadastro?ia=1" className="btn btn-primary mt-5 min-h-14 w-full duration-150">
                Quero que a IA monte
              </a>
            </div>

            <div className="mt-6">
              <p className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 font-serif text-[1.375rem] leading-tight">Vocês montam no editor</span>
                <span className="shrink-0 whitespace-nowrap font-serif text-[clamp(1.75rem,11cqi,2.5rem)] leading-none">
                  {PUBLISH_FEE_LABEL}
                </span>
              </p>
              <p className="mt-2 text-[0.9375rem] leading-6 text-on-forest/90">
                Escolham o modelo e editem textos e fotos, vendo o site mudar.
              </p>
              <a
                data-cta="preco"
                data-cta-modelo
                href={`/cadastro?modelo=${modelo}`}
                className="btn mt-4 min-h-12 w-full border border-on-forest/50 text-on-forest duration-150 hover:border-on-forest hover:bg-on-forest/10 focus-visible:outline-on-forest motion-reduce:transition-none"
              >
                Montar nosso site grátis
              </a>
            </div>

            <p className="mt-5 border-t border-on-forest/20 pt-4 text-[0.8125rem] leading-5 text-on-forest/80">
              Nos dois jeitos, montar e ver o site pronto é grátis, o Pix é pago uma vez só e os presentes via Pix têm
              0% de taxa.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
