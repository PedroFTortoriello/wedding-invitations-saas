import type { ReactNode } from "react";
import { Icon } from "@/components/app/icons";
import { SHOWCASE_IDS, type ShowcaseId } from "@/components/landing/showcase";
import { COMPANY, whatsappLink } from "@/lib/company";
import { PUBLISH_FEE_LABEL } from "@/lib/platform-data";

const WHATSAPP_URL = whatsappLink("Olá! Estou vendo a Noivar para o nosso casamento.");
const INLINE_LINK = "font-semibold underline decoration-ink/40 underline-offset-4 hover:decoration-ink";

// Respostas de 2–3 linhas, cada uma com evidência no código (brief 3.7).
// 9 e 10 vêm da política aprovada (COMPANY). Identidade da empresa só em /termos e /privacidade.
const FAQ: readonly { q: string; a: ReactNode }[] = [
  {
    q: "Quanto custa? Dá para montar antes de pagar?",
    a: `Dá. Montar, editar e ver o site pronto é grátis. Para publicar, vocês pagam ${PUBLISH_FEE_LABEL} uma única vez, via Pix. Sem mensalidade e sem plano.`
  },
  {
    q: "Os presentes via Pix vão mesmo 100% para nós?",
    a: "Vão. O Pix sai do banco do convidado direto para a chave de vocês, sem passar pela Noivar e sem taxa para ninguém. A Noivar ganha só com a taxa de publicação."
  },
  {
    q: "É seguro para os convidados?",
    a: "O convidado paga no app do próprio banco, com o Pix copia e cola ou o QR Code. Antes de confirmar, o banco mostra o nome de quem vai receber. A Noivar nunca guarda o dinheiro."
  },
  {
    q: "Como a gente sabe quem mandou cada Pix?",
    a: "Cada presente aparece no painel com o nome e o recado de quem enviou. Vocês conferem no extrato do banco e marcam como recebido."
  },
  {
    q: "E presente no cartão?",
    a: "Também dá, em até 12x. Vocês conectam a conta Mercado Pago de vocês e o valor cai lá. No cartão existe a taxa do Mercado Pago, e vocês escolhem se ela entra no valor do convidado ou sai do que vocês recebem."
  },
  {
    q: "E se alguém que não foi convidado tentar confirmar presença?",
    a: "Não consegue. A confirmação só aceita nomes da lista de convidados que vocês cadastram no painel."
  },
  {
    q: "Nossos convidados mais velhos vão conseguir usar?",
    a: "Vão. Abrem o link no celular, digitam o nome, escolhem na lista e tocam em Confirmar presença. Para presentear, é o mesmo Pix copia e cola do app do banco."
  },
  {
    q: "Dá para trocar de modelo depois?",
    a: "Dá, a qualquer momento, no editor. Textos e fotos continuam iguais."
  },
  {
    q: "E se a gente desistir depois de pagar?",
    // Sem e-mail cadastrado, não prometemos o canal.
    a: `Vocês têm ${COMPANY.refundDays} dias depois do pagamento para pedir o reembolso integral, ${COMPANY.email ? "pelo WhatsApp ou pelo e-mail" : "pelo WhatsApp"}.`
  },
  {
    q: "O site sai do ar depois do casamento?",
    a: `Não. Ele fica no ar por pelo menos ${COMPANY.siteMonthsAfterWedding} meses depois da data do casamento, sem custo extra.`
  }
];

/**
 * FAQ — sanfona exclusiva nativa (<details name="faq">), server component, sem JS.
 * Desktop: split 4/8 com o aside sticky; celular: perguntas primeiro, aside depois.
 * Sem animação de altura; só o chevron gira (desligado com reduced motion).
 */
export function Faq({ modelo = SHOWCASE_IDS[0] }: { modelo?: ShowcaseId }) {
  return (
    <section id="duvidas" className="bg-bg-2 py-12 text-ink lg:py-24">
      {/* auto 1fr: a lista ocupa as duas linhas sem esticar a linha do título. */}
      <div className="wrap grid gap-y-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12">
        <h2 data-reveal className="t-h1 text-balance lg:col-span-4">
          Perguntas <em className="italic">antes do sim.</em>
        </h2>

        <div className="border-b border-ink/15 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1">
          {FAQ.map(({ q, a }, i) => (
            <details
              key={q}
              name="faq"
              data-reveal
              style={{ transitionDelay: `${Math.min(i, 7) * 40}ms` }}
              className="group border-t border-ink/15"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-2.5 [&::-webkit-details-marker]:hidden">
                <h3 className="t-h3 text-ink">{q}</h3>
                <Icon
                  name="chevronDown"
                  size={22}
                  strokeWidth={1.5}
                  className="shrink-0 text-ink-soft transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="max-w-[60ch] pb-5 text-base leading-[1.55] text-ink">{a}</p>
            </details>
          ))}
        </div>

        <aside
          data-reveal
          className="lg:sticky lg:top-22 lg:col-span-4 lg:row-start-2 lg:self-start lg:pt-2"
        >
          <p className="t-h3">Ainda com dúvida?</p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-2 inline-flex min-h-11 items-center ${INLINE_LINK}`}
          >
            Falem com a gente no WhatsApp
          </a>
          <p className="text-sm text-ink-soft">Atendimento de {COMPANY.whatsappHours}.</p>
          <a
            data-cta="faq"
            data-cta-modelo
            href={`/cadastro?modelo=${modelo}`}
            className={`mt-3 inline-flex min-h-11 items-center ${INLINE_LINK}`}
          >
            Ou montem o site de graça e vejam por dentro.
          </a>
        </aside>
      </div>
    </section>
  );
}
