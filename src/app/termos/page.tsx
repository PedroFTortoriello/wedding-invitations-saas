import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CookiePreferencesButton } from "@/components/analytics/Analytics";
import { CompanyIdentity } from "@/components/legal/CompanyIdentity";
import { COMPANY } from "@/lib/company";
import {
  LEGAL_DRAFT,
  LEGAL_UPDATED_AT,
  LEGAL_WHATSAPP_URL,
  formatWhatsapp
} from "@/lib/legal";
import { PUBLISH_FEE_LABEL } from "@/lib/platform-data";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: `Como funciona a Noivar: conta, taxa única de ${PUBLISH_FEE_LABEL} para publicar, presentes via Pix direto para o casal, reembolso e responsabilidades.`,
  alternates: { canonical: "/termos" },
  robots: { index: true, follow: true }
};

const LINK =
  "font-semibold underline decoration-ink/40 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-ink motion-reduce:transition-none";

const REFUND = `${COMPANY.refundDays} dias`;
const MONTHS = `${COMPANY.siteMonthsAfterWedding} meses`;

const CONTACT = (
  <a href="#contato" className={LINK}>
    canais de contato
  </a>
);

// Texto ancorado no que o sistema faz hoje (ver /privacidade para os dados). Mudou a
// regra no código? Mude aqui e em LEGAL_UPDATED_AT.
const SECTIONS: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "servico",
    title: "O que é a Noivar",
    body: (
      <>
        <p>
          A Noivar é uma plataforma para montar sites de casamento. O casal escolhe um modelo, preenche textos, fotos,
          locais e lista de presentes, cadastra os convidados e publica o site num link próprio para compartilhar.
        </p>
        <p>
          No site publicado, os convidados confirmam presença, deixam recados e enviam presentes via Pix ou, se o casal
          ativar, no cartão.
        </p>
        <p><CompanyIdentity /></p>
      </>
    )
  },
  {
    id: "conta",
    title: "Conta",
    body: (
      <ul>
        <li>Para criar uma conta é preciso ter 18 anos ou mais.</li>
        <li>
          A conta usa o nome do casal, um e-mail e uma senha. Guardem a senha com cuidado: o que for feito com o login de
          vocês é responsabilidade de vocês.
        </li>
        <li>Cada conta tem um site de casamento.</li>
        <li>Informem dados verdadeiros. Contas criadas para fraude ou em nome de outra pessoa podem ser suspensas.</li>
      </ul>
    )
  },
  {
    id: "publicacao",
    title: "Montar, pagar e publicar",
    body: (
      <>
        <p>Montar, editar e ver o site pronto não custa nada.</p>
        <p>
          Para publicar, vocês pagam uma taxa única de {PUBLISH_FEE_LABEL}, via Pix, na página de pagamento da AbacatePay,
          empresa que processa a cobrança. Não existe mensalidade, plano ou renovação.
        </p>
        <p>
          Assim que a AbacatePay confirma o pagamento, o site é publicado automaticamente. Depois de publicado, vocês
          continuam editando textos, fotos, presentes e convidados, e podem trocar de modelo a qualquer momento sem perder o
          conteúdo.
        </p>
        <p>
          O site fica no ar por, no mínimo, {MONTHS} depois da data do casamento informada no editor, sem custo extra.
          Passado esse prazo, a Noivar pode tirar o site do ar.
        </p>
      </>
    )
  },
  {
    id: "reembolso",
    title: "Reembolso",
    body: (
      <>
        <p>
          Vocês podem pedir o reembolso integral da taxa de publicação em até {REFUND} depois do pagamento, sem precisar
          explicar o motivo, pelos {CONTACT}. Com o reembolso, o site deixa de ficar publicado e volta a ser rascunho.
        </p>
        <p>Depois desse prazo, a taxa não é reembolsável, salvo nos casos previstos em lei.</p>
      </>
    )
  },
  {
    id: "presentes-pix",
    title: "Presentes via Pix",
    body: (
      <ul>
        <li>
          O site gera o código Pix (copia e cola e QR Code) com a chave que vocês cadastram. O convidado paga no app do
          próprio banco e o dinheiro vai direto para essa chave.
        </li>
        <li>A Noivar não recebe, não guarda e não repassa esse dinheiro, e não cobra taxa sobre presentes via Pix.</li>
        <li>
          A Noivar não tem acesso ao extrato de vocês. Cada presente aparece no painel como pendente, com o nome e o recado
          de quem enviou; vocês conferem no banco e marcam como recebido.
        </li>
        <li>
          Vocês são responsáveis por cadastrar a chave certa. A Noivar não consegue desfazer um Pix enviado para uma chave
          errada.
        </li>
        <li>
          As cotas da lista (por exemplo, “jantar da lua de mel”) sugerem valores. O convidado envia dinheiro, não compra um
          produto: a Noivar não vende nem entrega itens.
        </li>
        <li>Devoluções de presentes são combinadas diretamente entre convidado e casal.</li>
      </ul>
    )
  },
  {
    id: "presentes-cartao",
    title: "Presentes no cartão",
    body: (
      <ul>
        <li>
          É opcional. Vocês podem conectar a conta Mercado Pago de vocês para receber presentes no cartão de crédito. O
          convidado paga numa página do Mercado Pago e o valor cai na conta de vocês.
        </li>
        <li>
          O Mercado Pago cobra uma taxa por pagamento no cartão. Vocês escolhem se ela é somada ao valor do convidado ou
          descontada do que vocês recebem. Parcelamento, prazos de liberação, estornos e contestações seguem as regras do
          Mercado Pago.
        </li>
        <li>Os dados do cartão são digitados na página do Mercado Pago e nunca passam pela Noivar.</li>
        <li>Vocês podem desconectar a conta Mercado Pago a qualquer momento no painel.</li>
      </ul>
    )
  },
  {
    id: "conteudo",
    title: "O conteúdo do site",
    body: (
      <ul>
        <li>
          Vocês são responsáveis pelo que publicam: textos, fotos, nomes, datas, locais, lista de presentes e chave Pix.
        </li>
        <li>
          Publiquem só fotos que vocês podem usar e de pessoas que concordaram em aparecer. Fotos de crianças precisam da
          autorização dos pais ou responsáveis.
        </li>
        <li>
          Ao importar um presente pelo link de uma loja, a Noivar copia o título, o preço e a imagem da página do produto
          para a lista de vocês. Usem esse recurso só para montar a lista de presentes.
        </li>
        <li>O site publicado pode ser visto por qualquer pessoa com o link e pode aparecer em buscadores.</li>
        <li>
          O conteúdo continua sendo de vocês. Para hospedar e exibir o site, vocês autorizam a Noivar a armazenar, copiar e
          mostrar esse conteúdo, apenas para prestar o serviço.
        </li>
        <li>
          A Noivar pode remover conteúdo ilegal, que viole direitos de outras pessoas ou estes termos, ou quando houver
          ordem judicial.
        </li>
      </ul>
    )
  },
  {
    id: "convidados",
    title: "Convidados, confirmações e recados",
    body: (
      <ul>
        <li>
          A confirmação de presença só aceita nomes da lista que vocês cadastram. Enquanto o convidado digita, o site sugere
          nomes da lista; por isso, qualquer pessoa com o link pode ver nomes da lista ao digitar parte deles.
        </li>
        <li>
          Recados ficam visíveis só para vocês no painel e no link da cerimonialista, se vocês gerarem um. Presentes,
          só para vocês.
        </li>
        <li>
          Vocês decidem quais dados de convidados coletar e para quê; a Noivar trata esses dados em nome de vocês, como
          descrito na{" "}
          <Link href="/privacidade" className={LINK}>
            Política de privacidade
          </Link>
          . Usem esses dados só para organizar o casamento.
        </li>
      </ul>
    )
  },
  {
    id: "cerimonialista",
    title: "Link da cerimonialista",
    body: (
      <p>
        Vocês podem gerar um link só de leitura para a cerimonialista ou outra pessoa de confiança. Ele mostra a lista de
        convidados, as confirmações, os recados e os locais, sem dados de Pix ou de presentes e sem permitir edição.
        Qualquer pessoa com esse link vê essas informações, então compartilhem com cuidado. Vocês podem desativar o link a
        qualquer momento no painel.
      </p>
    )
  },
  {
    id: "para-convidados",
    title: "Para quem é convidado",
    body: (
      <ul>
        <li>
          O site de cada casamento é do casal. O nome, a resposta de presença, o recado e o presente que você envia vão
          para o casal.
        </li>
        <li>
          Um presente via Pix é uma transferência do seu banco para a chave do casal. Antes de confirmar, confira no app do
          banco o nome de quem vai receber. A Noivar não participa do pagamento e não consegue estorná-lo.
        </li>
        <li>Presentes no cartão são pagos no Mercado Pago, nas condições mostradas lá.</li>
        <li>Dúvidas sobre presentes ou sobre o evento devem ser tratadas com o casal.</li>
      </ul>
    )
  },
  {
    id: "uso-proibido",
    title: "Uso proibido",
    body: (
      <>
        <p>Não é permitido usar a Noivar para:</p>
        <ul>
          <li>publicar conteúdo ilegal, ofensivo ou que viole direitos de outras pessoas;</li>
          <li>se passar por outra pessoa ou criar um casamento falso para pedir dinheiro;</li>
          <li>tentar acessar contas, sites ou dados de outros casais;</li>
          <li>copiar dados da plataforma de forma automatizada ou sobrecarregar os sistemas.</li>
        </ul>
        <p>
          Nesses casos, a Noivar pode remover o conteúdo, tirar o site do ar e encerrar a conta, e comunicar as autoridades
          quando for o caso.
        </p>
      </>
    )
  },
  {
    id: "responsabilidade",
    title: "Disponibilidade e responsabilidade",
    body: (
      <ul>
        <li>
          A Noivar trabalha para manter os sites no ar, mas pode haver interrupções por manutenção ou por falhas de
          fornecedores, como hospedagem, banco de dados e meios de pagamento.
        </li>
        <li>
          A Noivar não responde por Pix enviado a uma chave errada cadastrada pelo casal, por falhas ou bloqueios de bancos,
          da AbacatePay ou do Mercado Pago, pelo conteúdo publicado pelos casais nem por acordos entre casal e convidados.
        </li>
        <li>Nada nestes termos limita os direitos garantidos pelo Código de Defesa do Consumidor.</li>
      </ul>
    )
  },
  {
    id: "encerramento",
    title: "Encerrar a conta",
    body: (
      <p>
        Vocês podem pedir a exclusão da conta a qualquer momento pelos {CONTACT}. Com a exclusão, o site sai do ar e os
        dados são apagados como descrito na{" "}
        <Link href="/privacidade#retencao" className={LINK}>
          Política de privacidade
        </Link>
        . Passado o prazo de reembolso, excluir a conta não dá direito à devolução da taxa.
      </p>
    )
  },
  {
    id: "mudancas",
    title: "Mudanças nestes termos",
    body: (
      <p>
        Estes termos podem ser atualizados, e a data da última atualização fica no topo da página. Se uma mudança afetar o
        que vocês já contrataram, avisamos pelo e-mail da conta antes de ela valer.
      </p>
    )
  },
  {
    id: "lei",
    title: "Lei aplicável",
    body: (
      <p>
        Estes termos seguem as leis brasileiras, incluindo o Código de Defesa do Consumidor. Conflitos podem ser levados ao
        foro do domicílio do consumidor.
      </p>
    )
  },
  {
    id: "contato",
    title: "Contato",
    body: (
      <>
        <p><CompanyIdentity /></p>
        <ul>
          <li>
            WhatsApp:{" "}
            <a href={LEGAL_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
              {formatWhatsapp(COMPANY.whatsapp)}
            </a>
            , {COMPANY.whatsappHours}.
          </li>
          {COMPANY.email ? (
            <li>
              E-mail:{" "}
              <a href={`mailto:${COMPANY.email}`} className={LINK}>
                {COMPANY.email}
              </a>
            </li>
          ) : null}
          {COMPANY.instagram ? (
            <li>
              Instagram:{" "}
              <a
                href={`https://instagram.com/${COMPANY.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK}
              >
                @{COMPANY.instagram}
              </a>
            </li>
          ) : null}
        </ul>
      </>
    )
  }
];

const SUMMARY = [
  "Montar, editar e ver o site pronto é grátis.",
  `Publicar custa ${PUBLISH_FEE_LABEL}, uma única vez, via Pix. Sem mensalidade.`,
  "Os presentes via Pix vão direto para a chave do casal. A Noivar nunca recebe esse dinheiro.",
  `Reembolso integral se pedido em até ${REFUND} depois do pagamento.`,
  `O site fica no ar por pelo menos ${MONTHS} depois da data do casamento.`
];

export default function TermosPage() {
  return (
    <div className="min-h-dvh bg-bg text-ink">
      {LEGAL_DRAFT ? (
        <p role="note" className="bg-bg-2 px-4 py-2 text-center text-[13px] leading-5 text-ink-soft">
          Versão preliminar, em revisão jurídica.
        </p>
      ) : null}

      <header className="border-b border-line">
        <div className="wrap flex h-16 items-center justify-between gap-4">
          <Link href="/" className="font-serif text-2xl italic leading-none">
            Noivar
          </Link>
          <Link href="/privacidade" className="text-sm font-semibold text-ink-soft transition-colors duration-150 hover:text-ink">
            Política de privacidade
          </Link>
        </div>
      </header>

      <main
        id="conteudo"
        className="wrap grid gap-10 py-12 md:py-16 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-20 lg:py-20"
      >
        <aside className="hidden lg:block">
          <nav aria-label="Seções dos termos" className="sticky top-8">
            <p className="t-eyebrow text-ink-soft">Nesta página</p>
            <ol className="mt-5 grid gap-2.5 text-sm leading-5 text-ink-soft">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="transition-colors duration-150 hover:text-ink">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="max-w-[68ch]">
          <p className="t-eyebrow text-ink-soft">Noivar</p>
          <h1 className="t-h1 mt-4">Termos de uso</h1>
          <p className="mt-4 text-sm text-ink-soft">Última atualização: {LEGAL_UPDATED_AT}</p>
          <p className="t-lead mt-8">
            Estes termos valem para quem cria uma conta na Noivar para montar o site do casamento (o casal) e para quem
            visita ou usa esse site (os convidados). Ao criar a conta, vocês concordam com eles e com a{" "}
            <Link href="/privacidade" className={LINK}>
              Política de privacidade
            </Link>
            .
          </p>

          <div className="mt-10 border-y border-line-strong py-6">
            <h2 className="t-eyebrow text-ink-soft">Em resumo</h2>
            <ul className="mt-4 grid gap-2.5 text-base leading-7">
              {SUMMARY.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="mt-3 h-px w-3 shrink-0 bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-soft">O resumo não substitui o texto completo.</p>
          </div>

          <div className="mt-4">
            {SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-titulo`}
                className="scroll-mt-6 border-b border-line py-10 last:border-b-0 [&_li+li]:mt-2 [&_p+p]:mt-4 [&_p+ul]:mt-4 [&_ul+p]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-ink-soft"
              >
                <h2 id={`${section.id}-titulo`} className="t-h2 text-[1.875rem] lg:text-[2.25rem]">
                  {section.title}
                </h2>
                <div className="mt-5 text-[1.0625rem] leading-[1.7]">{section.body}</div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <footer className="border-t border-line">
        <div className="wrap flex flex-col gap-3 py-8 text-sm text-ink-soft md:flex-row md:items-center md:justify-between">
          <p>© Noivar</p>
          <nav aria-label="Documentos" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/termos" aria-current="page" className="font-semibold text-ink">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="transition-colors duration-150 hover:text-ink">
              Política de privacidade
            </Link>
            <CookiePreferencesButton className="rounded-sm transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest" />
          </nav>
        </div>
      </footer>
    </div>
  );
}
