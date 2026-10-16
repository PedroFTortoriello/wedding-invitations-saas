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

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Quais dados a Noivar coleta de casais, convidados e visitantes, para quê, com quem compartilha, quais cookies usa e como exercer seus direitos pela LGPD.",
  alternates: { canonical: "/privacidade" },
  robots: { index: true, follow: true }
};

const LINK =
  "font-semibold underline decoration-ink/40 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-ink motion-reduce:transition-none";

const CONTACT = (
  <a href="#contato" className={LINK}>
    canais de contato
  </a>
);

// Sem Pixel/GA configurados não há aviso de cookies nem botão de preferências.
const MEASURING = Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

/**
 * Cookies reais do sistema: lib/tracking-shared.ts + lib/analytics.ts (noivar_*),
 * @supabase/ssr (sessão), Meta Pixel e GA4 (só depois do "Aceitar").
 */
const COOKIES: { name: string; owner: string; duration: string; purpose: string }[] = [
  {
    name: "noivar_consent",
    owner: "Noivar",
    duration: "180 dias",
    purpose: "Guarda se você aceitou ou recusou os cookies de medição."
  },
  {
    name: "noivar_attr",
    owner: "Noivar",
    duration: "90 dias",
    purpose:
      "Criado só quando você chega por um link de campanha: guarda a campanha (parâmetros utm), a primeira página vista e o site de origem. Os identificadores de clique de anúncio (fbclid e gclid) só entram com o seu aceite."
  },
  {
    name: "noivar_ab_sticky",
    owner: "Noivar",
    duration: "90 dias",
    purpose: "Define qual versão do botão fixo você vê no celular, num teste entre duas versões. Não identifica ninguém."
  },
  {
    name: "sb-…-auth-token",
    owner: "Noivar (Supabase)",
    duration: "Até você sair da conta",
    purpose: "Mantém o casal conectado ao painel. Necessário para o login funcionar."
  },
  {
    name: "_fbp e _fbc",
    owner: "Meta",
    duration: "90 dias",
    purpose: "Só com o seu aceite. Medem visitas, cadastros e pagamentos vindos de anúncios no Facebook e no Instagram."
  },
  {
    name: "_ga e _ga_…",
    owner: "Google",
    duration: "Até 2 anos",
    purpose: "Só com o seu aceite. Distinguem visitas para as estatísticas do Google Analytics."
  }
];

// Texto ancorado no que o sistema faz hoje. Mudou coleta, cookie ou fornecedor no
// código? Mude aqui e em LEGAL_UPDATED_AT.
const SECTIONS: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "quem-somos",
    title: "Quem somos e a quem esta política se aplica",
    body: (
      <>
        <p><CompanyIdentity /></p>
        <p>
          Esta política explica como a Noivar trata dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei
          13.709/2018, LGPD). Ela vale para três grupos:
        </p>
        <ul>
          <li>
            <strong className="font-semibold">o casal</strong>, que cria a conta e monta o site. Aqui a Noivar é a
            controladora dos dados;
          </li>
          <li>
            <strong className="font-semibold">os convidados</strong>, que usam o site do casal. Quem decide o que coletar e
            para quê é o casal; a Noivar trata esses dados em nome dele, como operadora;
          </li>
          <li>
            <strong className="font-semibold">os visitantes</strong> das páginas da Noivar, como esta.
          </li>
        </ul>
      </>
    )
  },
  {
    id: "dados",
    title: "Quais dados coletamos",
    body: (
      <>
        <h3 className="t-h3 text-[1.375rem]">Do casal</h3>
        <ul>
          <li>Conta: nome do casal, e-mail e senha. A senha fica guardada de forma cifrada (hash), nunca em texto.</li>
          <li>
            WhatsApp, se vocês informarem: usado só para falar sobre o site e o pagamento. Ele nunca aparece no site
            publicado.
          </li>
          <li>
            Conteúdo do site: nomes, data, locais, história, fotos, lista de presentes, chave Pix e nome do titular. A chave
            Pix vai dentro do código Pix que os convidados copiam.
          </li>
          <li>
            Fotos enviadas: ficam num armazenamento de acesso público, para o site conseguir mostrá-las. Quem tiver o
            endereço exato de uma imagem consegue abri-la, mesmo antes da publicação.
          </li>
          <li>
            Site feito pela IA, se vocês usarem: o que escreveram no briefing e as fotos escolhidas, guardados para
            preencher uma nova geração.
          </li>
          <li>
            Pagamento da taxa: identificador da cobrança, valor, situação e data. Os dados pedidos na página de pagamento
            são tratados pela AbacatePay; a Noivar não recebe dados bancários.
          </li>
          <li>
            Presentes no cartão, se vocês conectarem o Mercado Pago: identificador, apelido e e-mail da conta Mercado Pago,
            as credenciais de acesso (guardadas cifradas) e quem paga a taxa do cartão.
          </li>
        </ul>

        <h3 className="t-h3 text-[1.375rem]">Dos convidados, em nome do casal</h3>
        <ul>
          <li>Nomes da lista de convidados, cadastrados pelo casal, e a resposta de presença.</li>
          <li>Recados: nome e mensagem.</li>
          <li>
            Presentes: nome, recado, valor e situação. No cartão, também o número de parcelas e o identificador do
            pagamento no Mercado Pago. Os dados do cartão são digitados no Mercado Pago e nunca chegam à Noivar.
          </li>
        </ul>
        <p>
          Nos sites dos casais e no link da cerimonialista não há aviso de cookies, Meta Pixel, Google Analytics nem
          estatísticas de visita.
        </p>

        <h3 className="t-h3 text-[1.375rem]">De quem navega nas páginas da Noivar</h3>
        <ul>
          <li>Campanha de origem, primeira página vista e site de origem, quando você chega por um link de campanha.</li>
          <li>
            Estatísticas agregadas de visita, sem cookies e sem precisar de aceite, pela Vercel Web Analytics: página vista,
            site de origem, país, navegador e tipo de aparelho.
          </li>
          <li>
            Com o seu aceite: identificadores de anúncio (cookies _fbp e _fbc, fbclid e gclid), navegador (user agent) e
            endereço IP, enviados à Meta, e estatísticas de visita no Google Analytics.
          </li>
          <li>
            Marcos de uso do produto, ligados à conta: cadastro, site criado, início do pagamento, pagamento e publicação,
            além de registros de erro. Esses registros não guardam e-mail, telefone, chave Pix nem dados de convidados.
          </li>
        </ul>
      </>
    )
  },
  {
    id: "finalidades",
    title: "Para que usamos e com qual base legal",
    body: (
      <ul>
        <li>
          Criar a conta, montar, publicar e manter o site no ar, cobrar a taxa e publicar o site quando o pagamento é
          confirmado: execução do contrato (LGPD, art. 7º, V).
        </li>
        <li>Guardar registros de pagamento: cumprimento de obrigação legal (art. 7º, II).</li>
        <li>
          Mostrar ao casal as confirmações, os recados e os presentes dos convidados: em nome do casal, que responde pela
          base legal desse tratamento.
        </li>
        <li>
          Atendimento, segurança, prevenção a fraudes, correção de erros e contagem de campanhas sem identificar ninguém
          (parâmetros utm e teste do botão fixo): legítimo interesse (art. 7º, IX).
        </li>
        <li>
          Medir anúncios com Meta Pixel, API de Conversões da Meta e Google Analytics: consentimento (art. 7º, I), dado no
          aviso de cookies e revogável a qualquer momento.
        </li>
      </ul>
    )
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <>
        <p>
          Os cookies de medição (Meta e Google) só são gravados depois que você toca em Aceitar no aviso. Se você recusar,
          eles não carregam, e os que existirem são apagados.
        </p>
        <dl className="mt-6 border-t border-line">
          {COOKIES.map((cookie) => (
            <div key={cookie.name} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
              <dt>
                <span className="block font-semibold">{cookie.name}</span>
                <span className="block text-sm leading-6 text-ink-soft">
                  {cookie.owner} · {cookie.duration}
                </span>
              </dt>
              <dd className="text-base leading-7">{cookie.purpose}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6">
          {MEASURING
            ? "Para mudar ou retirar o seu aceite, use o botão abaixo ou apague os cookies do navegador."
            : "Para retirar o seu aceite, apague os cookies do navegador."}
        </p>
        {MEASURING ? (
          <p>
            <CookiePreferencesButton className="btn btn-sm btn-secondary" />
          </p>
        ) : null}
      </>
    )
  },
  {
    id: "compartilhamento",
    title: "Com quem compartilhamos",
    body: (
      <>
        <p>A Noivar não vende dados pessoais. Compartilhamos apenas o necessário com:</p>
        <ul>
          <li>
            <strong className="font-semibold">Supabase</strong>: banco de dados, login e armazenamento das fotos.
          </li>
          <li>
            <strong className="font-semibold">Vercel</strong>: hospedagem da plataforma e dos sites.
          </li>
          <li>
            <strong className="font-semibold">AbacatePay</strong>: cobrança via Pix da taxa de publicação.
          </li>
          <li>
            <strong className="font-semibold">Mercado Pago</strong>: presentes no cartão, só quando o casal conecta a conta.
          </li>
          <li>
            <strong className="font-semibold">Anthropic</strong>: o modelo de IA (Claude) que monta o site, só quando o
            casal usa o Site feito pela IA. Recebe o briefing e as fotos escolhidas para gerar os textos.
          </li>
          <li>
            <strong className="font-semibold">Meta</strong> (Facebook e Instagram): medição de anúncios, só com aceite. No
            cadastro, no início do pagamento e no pagamento, recebe o e-mail e o identificador da conta embaralhados por
            hash, nunca em texto.
          </li>
          <li>
            <strong className="font-semibold">Google</strong>: estatísticas de visita no Google Analytics, só com aceite.
          </li>
          <li>
            <strong className="font-semibold">Quem o casal escolher</strong>: por exemplo, a cerimonialista, pelo link só de
            leitura que o casal gera e pode desativar.
          </li>
          <li>
            <strong className="font-semibold">Autoridades</strong>, quando a lei ou uma ordem judicial exigir.
          </li>
        </ul>
        <p>
          Alguns desses fornecedores podem tratar dados fora do Brasil. Nesses casos, a transferência segue as regras do
          art. 33 da LGPD.
        </p>
      </>
    )
  },
  {
    id: "retencao",
    title: "Por quanto tempo guardamos",
    body: (
      <ul>
        <li>
          Conta e site: enquanto a conta existir. O site publicado fica no ar por, no mínimo,{" "}
          {COMPANY.siteMonthsAfterWedding} meses depois da data do casamento.
        </li>
        <li>
          Ao excluir a conta, apagamos o site, as fotos, a lista de convidados, as confirmações, os recados, os presentes
          registrados e a conexão com o Mercado Pago. Os marcos de uso do produto ficam, sem ligação com a conta.
        </li>
        <li>Registros de pagamento da taxa: pelo prazo exigido pela legislação fiscal.</li>
        <li>
          Identificadores de anúncio guardados nos nossos registros (_fbp, _fbc, navegador, fbclid e gclid): apagados
          depois de 30 dias.
        </li>
        <li>Cookies: pelo prazo indicado na lista acima.</li>
      </ul>
    )
  },
  {
    id: "direitos",
    title: "Seus direitos",
    body: (
      <>
        <p>Pela LGPD (art. 18), você pode pedir:</p>
        <ul>
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a lei;</li>
          <li>portabilidade dos dados;</li>
          <li>eliminação dos dados tratados com base no consentimento, e informação sobre as consequências de não consentir;</li>
          <li>informação sobre com quem compartilhamos seus dados;</li>
          <li>revogação do consentimento e oposição a tratamentos feitos sem ele.</li>
        </ul>
        <p>
          O casal corrige e apaga a maior parte dos dados direto no painel. Para o resto, fale com a gente pelos {CONTACT}.
          Podemos pedir uma confirmação de identidade, como uma mensagem do e-mail da conta, e respondemos em até 15 dias.
        </p>
        <p>
          Se você é convidado, também pode falar direto com o casal, que decide sobre os dados do site dele. Se você nos
          procurar, ajudamos a encaminhar o pedido.
        </p>
        <p>
          Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD), em{" "}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className={LINK}>
            gov.br/anpd
          </a>
          .
        </p>
      </>
    )
  },
  {
    id: "seguranca",
    title: "Segurança",
    body: (
      <>
        <ul>
          <li>Toda a comunicação com a plataforma é cifrada (HTTPS).</li>
          <li>Regras de acesso no banco de dados garantem que cada casal só veja os dados do próprio casamento.</li>
          <li>As credenciais do Mercado Pago são guardadas cifradas.</li>
          <li>O acesso administrativo é restrito a pessoas autorizadas da equipe, para suporte e operação.</li>
        </ul>
        <p>
          Nenhum sistema é totalmente imune a incidentes. Se um incidente puder causar risco ou dano relevante, avisamos
          as pessoas afetadas e a ANPD, como a lei determina.
        </p>
      </>
    )
  },
  {
    id: "criancas",
    title: "Crianças e adolescentes",
    body: (
      <p>
        A conta na Noivar é só para maiores de 18 anos. Se o casal incluir nomes ou fotos de crianças e adolescentes no
        site, deve ter a autorização dos pais ou responsáveis.
      </p>
    )
  },
  {
    id: "mudancas",
    title: "Mudanças nesta política",
    body: (
      <p>
        Esta política pode ser atualizada, e a data da última atualização fica no topo da página. Mudanças relevantes são
        avisadas pelo e-mail da conta.
      </p>
    )
  },
  {
    id: "contato",
    title: "Contato",
    body: (
      <>
        <p>
          <CompanyIdentity /> Para assuntos de privacidade e para exercer seus direitos, use um destes canais:
        </p>
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
        </ul>
      </>
    )
  }
];

const SUMMARY = [
  "A Noivar não vende dados pessoais.",
  "Meta Pixel e Google Analytics só carregam depois do seu aceite, e nunca nos sites dos casais.",
  "Os dados dos convidados servem só para o casal organizar o casamento.",
  "Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento."
];

export default function PrivacidadePage() {
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
          <Link href="/termos" className="text-sm font-semibold text-ink-soft transition-colors duration-150 hover:text-ink">
            Termos de uso
          </Link>
        </div>
      </header>

      <main
        id="conteudo"
        className="wrap grid gap-10 py-12 md:py-16 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-20 lg:py-20"
      >
        <aside className="hidden lg:block">
          <nav aria-label="Seções da política" className="sticky top-8">
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
          <h1 className="t-h1 mt-4">Política de privacidade</h1>
          <p className="mt-4 text-sm text-ink-soft">Última atualização: {LEGAL_UPDATED_AT}</p>
          <p className="t-lead mt-8">
            O que a Noivar faz com os dados de quem monta um site de casamento, de quem é convidado e de quem visita
            nossas páginas. As regras de uso da plataforma estão nos{" "}
            <Link href="/termos" className={LINK}>
              Termos de uso
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
                className="scroll-mt-6 border-b border-line py-10 last:border-b-0 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3:first-child]:mt-0 [&_li+li]:mt-2 [&_p+p]:mt-4 [&_p+ul]:mt-4 [&_ul+p]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-ink-soft"
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
            <Link href="/termos" className="transition-colors duration-150 hover:text-ink">
              Termos de uso
            </Link>
            <Link href="/privacidade" aria-current="page" className="font-semibold text-ink">
              Política de privacidade
            </Link>
            <CookiePreferencesButton className="rounded-sm transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest" />
          </nav>
        </div>
      </footer>
    </div>
  );
}
