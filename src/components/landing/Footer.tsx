import { CookiePreferencesButton } from "@/components/analytics/Analytics";
import { SHOWCASE_IDS, type ShowcaseId } from "@/components/landing/showcase";
import { COMPANY, whatsappLink } from "@/lib/company";
import { formatWhatsapp } from "@/lib/legal";
import { PUBLISH_FEE_LABEL } from "@/lib/platform-data";

const LINK = "inline-flex min-h-11 items-center hover:underline hover:underline-offset-4 lg:min-h-8";

/**
 * Fechamento (faixa forest): último filho do <main>, para o H2 e o CTA principal
 * ficarem no landmark que o skip link e o leitor de tela usam. Server component.
 *
 * `modelo` é só o href sem JS; o LandingBehavior troca o ?modelo no [data-cta-modelo].
 */
export function Fechamento({ modelo = SHOWCASE_IDS[0] }: { modelo?: ShowcaseId }) {
  return (
    <section aria-labelledby="fechamento-titulo" className="section-tight bg-forest text-on-forest">
      <div className="wrap grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-x-12">
        <h2 id="fechamento-titulo" data-reveal className="t-h1 text-balance lg:col-span-7">
          Montem hoje. <em className="italic">Publiquem quando estiver do jeito de vocês.</em>
        </h2>
        <div data-reveal className="lg:col-span-5">
          <a
            id="fechamento-cta"
            data-cta="fechamento"
            data-cta-modelo
            href={`/cadastro?modelo=${modelo}`}
            className="btn btn-inverse min-h-14 w-full duration-150 lg:w-auto lg:px-10"
          >
            Montar nosso site grátis
          </a>
          <p className="mt-4 flex flex-col text-sm text-on-forest/80 lg:flex-row lg:gap-2">
            <span>Grátis para montar</span>
            <span aria-hidden className="hidden lg:inline">
              ·
            </span>
            <span>{PUBLISH_FEE_LABEL} uma vez, só para publicar</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Rodapé (creme), depois do </main>. Sem razão social, CNPJ e endereço (pedido do dono):
 * a identificação da empresa fica em /termos e /privacidade. No celular o rodapé reserva
 * espaço para o CTA fixo e não repete as âncoras da página (é um scroll só).
 */
export function Footer({ modelo = SHOWCASE_IDS[0] }: { modelo?: ShowcaseId }) {
  const signup = `/cadastro?modelo=${modelo}`;

  return (
    <footer className="bg-bg pb-[calc(5rem+env(safe-area-inset-bottom))] pt-12 text-ink lg:pb-10 lg:pt-16">
      <div className="wrap">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-5">
            <p className="font-serif text-3xl italic leading-none">Noivar</p>
            <p className="mt-3 max-w-[42ch] text-[0.9375rem] leading-6">
              Sites de casamento com confirmação pela lista, recados e presentes via Pix que vão 100% para o casal.
            </p>
          </div>

          <nav aria-label="Rodapé" className="lg:col-span-4">
            <ul className="grid grid-cols-2 gap-x-6 text-[0.9375rem] lg:grid-cols-1">
              <li className="max-lg:hidden">
                <a href="#modelos" className={LINK}>
                  Modelos
                </a>
              </li>
              <li className="max-lg:hidden">
                <a href="#presentes" className={LINK}>
                  Presentes
                </a>
              </li>
              <li className="max-lg:hidden">
                <a href="#preco" className={LINK}>
                  Preço
                </a>
              </li>
              <li className="max-lg:hidden">
                <a href="#duvidas" className={LINK}>
                  Dúvidas
                </a>
              </li>
              <li>
                <a href="/login" className={LINK}>
                  Entrar
                </a>
              </li>
              <li>
                <a data-cta="rodape" data-cta-modelo href={signup} className={`${LINK} font-semibold`}>
                  Montar nosso site
                </a>
              </li>
            </ul>
          </nav>

          <ul className="text-[0.9375rem] lg:col-span-3">
            {COMPANY.email ? (
              <li>
                <a href={`mailto:${COMPANY.email}`} className={LINK}>
                  {COMPANY.email}
                </a>
              </li>
            ) : null}
            <li>
              <a
                href={whatsappLink("Olá! Estou vendo a Noivar para o nosso casamento.")}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK}
              >
                WhatsApp {formatWhatsapp(COMPANY.whatsapp)}
              </a>
              <p className="text-[0.8125rem] text-ink-soft first-letter:uppercase">{COMPANY.whatsappHours}</p>
            </li>
            {COMPANY.instagram ? (
              <li>
                <a
                  href={`https://www.instagram.com/${COMPANY.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK}
                >
                  @{COMPANY.instagram}
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        {/* Barra legal. Celular: notas em linha própria, links lado a lado.
            Desktop: "·" antes de TODO item, e a margem negativa num wrapper com overflow
            escondido corta o "·" que abre cada linha (sem ponto solto quando quebra). */}
        <div className="mt-8 border-t border-line pt-4 lg:mt-12 lg:overflow-hidden lg:pb-1">
          <ul className="flex flex-wrap items-center gap-x-5 text-[0.8125rem] leading-5 text-ink-soft lg:-ml-4 lg:gap-x-0 lg:gap-y-1 lg:[&>li]:before:inline-block lg:[&>li]:before:w-4 lg:[&>li]:before:text-center lg:[&>li]:before:content-['·'_/_'']">
            <li>
              <a href="/termos" className={LINK}>
                Termos de uso
              </a>
            </li>
            <li>
              <a href="/privacidade" className={LINK}>
                Política de privacidade
              </a>
            </li>
            {/* Sem Pixel/GA configurado o botão não renderiza: o <li> vazio some. */}
            <li className="empty:hidden">
              <CookiePreferencesButton className="inline-flex min-h-11 items-center hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest lg:min-h-8" />
            </li>
            <li className="py-1 max-lg:basis-full lg:py-0">Taxas de mercado citadas: consulta de setembro de 2026.</li>
            <li className="py-1 max-lg:basis-full lg:py-0">© {new Date().getFullYear()} Noivar</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
