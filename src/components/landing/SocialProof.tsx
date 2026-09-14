import Image from "next/image";
import Link from "next/link";
import { romanticImages } from "@/lib/demo-wedding";

// Os 3 modelos com asset real e site ao vivo — a prova é abri-los, não ler sobre eles.
// Ordem do DOM = Civil (líder P&B), Jardim, Clássico. No mobile empilham nessa ordem.
type Model = {
  name: string;
  image: string;
  href: string;
  alt: string;
  delay: string;
  mono?: boolean;
};

const MODELS: readonly Model[] = [
  {
    name: "Civil Minimalista",
   
    image: "/assets/canva-intimate/hero-canva.jpg",
    href: "/modelo/civil-minimalista/helena-e-lucas",
    alt: "Retrato do casal em preto e branco, modelo Civil Minimalista",
    delay: "0ms",
    // O template Civil renderiza em P&B; preview fiel = grayscale (e o alt fica verdadeiro).
    mono: true
  },
  {
    name: "Jardim Clássico",
   
    image: "/assets/canva-garden/hero-garden.jpg",
    href: "/modelo/garden-classico/helena-e-lucas",
    alt: "Capa floral marrom e bege do modelo Jardim Clássico",
    delay: "90ms"
  },
  {
    name: "Clássico Romântico",

    image: romanticImages.hero,
    href: "/modelo/classico-romantico/helena-e-lucas",
    alt: "Casal sob guarda-chuva transparente em cerimônia ao entardecer, modelo Clássico Romântico",
    delay: "160ms"
  }
];

// Flagship — o modelo em destaque, largura total no topo da vitrine. Identidade
// escura e cinematográfica que salta sobre o creme da página.
const FLAGSHIP: Model = {
  name: "Cinema Noir",
  image: romanticImages.luxuryVenue,
  href: "/modelo/cinema-noir/helena-e-lucas",
  alt: "Salão de festas em luz âmbar ao entardecer, modelo Cinema Noir",
  delay: "0ms"
};

// Coleção premium — os modelos novos, em destaque acima da vitrine. Cada um abre
// a demonstração ao vivo completa, do convite aos presentes.
const PREMIUM: readonly Model[] = [
  {
    name: "Pé na Areia",
   
    image: romanticImages.hands,
    href: "/modelo/pe-na-areia/helena-e-lucas",
    alt: "Casal de mãos dadas ao pôr do sol, modelo Pé na Areia",
    delay: "0ms"
  },
  {
    name: "Editorial Luxury",
    image: romanticImages.blackWhiteWide,
    href: "/modelo/editorial-luxury/helena-e-lucas",
    alt: "Casal em retrato editorial preto e branco, modelo Editorial Luxury",
    delay: "90ms",
    // Identidade em P&B; preview fiel = grayscale (e o alt continua verdadeiro).
    mono: true
  },
  {
    name: "Jardim Romântico",
   
    image: romanticImages.ceremonyAisle,
    href: "/modelo/jardim-romantico/helena-e-lucas",
    alt: "Corredor de cerimônia com flores brancas, modelo Jardim Romântico",
    delay: "180ms"
  }
];

// Fatos verificáveis — escala MODESTA (Features já gasta o "0%" gigante em t-display).
const FACTS: readonly { term: string; line: string }[] = [
  { term: "0%", line: "de taxa nos presentes — cada Pix cai 100% na chave do casal." },
  { term: "R$149,90", line: "taxa única para publicar — sem mensalidade, sem renovação." },
  { term: "1 link", line: "RSVP, recados, contagem regressiva e presentes no mesmo endereço." },
  { term: "Tempo real", line: "o painel mostra quem vem, na hora." }
];

/**
 * Tile de modelo ao vivo. Reveal vive no WRAPPER (data-reveal, à prova de no-JS);
 * o hover é CSS (group-hover): a placa sobe e a imagem dá um leve zoom — sem JS de
 * animação. `tall` = placa líder que preenche as 2 linhas; os largos usam aspecto
 * fixo e ancoram a altura das linhas da grade.
 */
function ModelTile({ model, tall }: { model: Model; tall?: boolean }) {
  const wrapper = tall ? "md:col-span-6 md:row-span-2 md:flex md:flex-col" : "md:col-span-6";
  const media = tall
    ? "relative aspect-[4/5] overflow-hidden rounded-2xl transition-transform duration-200 ease-out group-hover:-translate-y-1 motion-reduce:transition-none md:aspect-auto md:min-h-0 md:flex-1"
    : "relative aspect-[16/11] overflow-hidden rounded-2xl transition-transform duration-200 ease-out group-hover:-translate-y-1 motion-reduce:transition-none";

  return (
    <div data-reveal style={{ transitionDelay: model.delay }} className={wrapper}>
      <Link href={model.href} className="group block md:flex md:min-h-0 md:flex-1 md:flex-col">
        <div className={media}>
          <Image
            src={model.image}
            alt={model.alt}
            fill
            loading="lazy"
            sizes="(min-width: 768px) 50vw, 100vw"
            className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
              model.mono ? "grayscale" : ""
            }`}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
            <div>
              <p className="t-eyebrow text-on-forest">Demonstração ao vivo</p>
              <p className="mt-2 t-h3 italic text-on-forest">{model.name}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#fffaf1]/90 px-4 py-2 text-sm font-bold text-forest transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
              Abrir →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

/**
 * Tile destacado da coleção premium. Mesma linguagem do ModelTile (reveal no
 * wrapper, hover em CSS), lado a lado e com placa "Novo" — formato landscape
 * fixo que funciona para todos os modelos novos.
 */
function PremiumTile({ model }: { model: Model }) {
  return (
    <div data-reveal style={{ transitionDelay: model.delay }}>
      <Link href={model.href} className="group block">
        <div className="relative aspect-[16/11] overflow-hidden rounded-2xl transition-transform duration-200 ease-out group-hover:-translate-y-1 motion-reduce:transition-none">
          <Image
            src={model.image}
            alt={model.alt}
            fill
            loading="lazy"
            sizes="(min-width: 768px) 50vw, 100vw"
            className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
              model.mono ? "grayscale" : ""
            }`}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
            <div>
              <p className="t-eyebrow text-on-forest">Novo · Demonstração ao vivo</p>
              <p className="mt-2 t-h3 italic text-on-forest">{model.name}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#fffaf1]/90 px-4 py-2 text-sm font-bold text-forest transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
              Abrir →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

/**
 * Tile do flagship — largura total, recorte cinematográfico largo e placa em
 * destaque. Mesma linguagem (reveal no wrapper, hover CSS) num formato editorial
 * que abre a vitrine com o modelo mais premium.
 */
function FlagshipTile({ model }: { model: Model }) {
  return (
    <div data-reveal>
      <Link href={model.href} className="group block">
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl transition-transform duration-200 ease-out group-hover:-translate-y-1 motion-reduce:transition-none sm:aspect-[16/9] lg:aspect-[21/8]">
          <Image
            src={model.image}
            alt={model.alt}
            fill
            priority
            sizes="(min-width: 768px) 100vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          {/* Grade escura para a identidade Cinema Noir saltar sobre o creme da LP. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
          <div className="absolute inset-x-6 bottom-6 flex flex-wrap items-end justify-between gap-4 md:inset-x-10 md:bottom-10">
            <div className="max-w-xl">
              <p className="t-eyebrow text-on-forest">Novo · Modelo em destaque</p>
              <p className="mt-2 t-h1 italic text-on-forest">{model.name}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#fffaf1]/90 px-5 py-2.5 text-sm font-bold text-forest transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
              Abrir a experiência →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

/**
 * Prova social honesta: os 3 sites reais ao vivo SÃO o argumento. Fundo creme
 * claro (bg) — parede de galeria que faz a fotografia saltar e cria o ritmo de
 * tom bg-2 (Features) → bg (aqui) → forest (Pricing). O painel forest contido no
 * fim é a ponte de cor que prepara o Pricing. Server component, sem JS de animação.
 */
export function SocialProof() {
  return (
    <section id="modelos" className="section bg-bg">
      <div className="wrap">
        {/* Header curto, encostado na galeria — sem kicker (o Hero detém o único). */}
        <header className="measure" data-reveal>
          <h2 className="text-balance t-h1 italic">A prova são os modelos. Abra um.</h2>
          <p className="mt-5 t-lead text-ink">
            Sete modelos de verdade, no ar agora — do novo flagship Cinema Noir à coleção
            premium. Navegue como um convidado faria: confirmação de presença, recados e
            presentes, tudo funcionando.
          </p>
        </header>

        {/* Flagship em largura total — abre a vitrine com o modelo mais premium. */}
        <div className="mt-12">
          <FlagshipTile model={FLAGSHIP} />
        </div>

        {/* Coleção premium — os modelos novos, em destaque acima da vitrine. */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PREMIUM.map((model) => (
            <PremiumTile key={model.name} model={model} />
          ))}
        </div>

        {/* Galeria assimétrica: placa alta P&B à esquerda, dois largos coloridos à direita. */}
        <div className="mt-8 grid gap-4 md:grid-cols-12 md:grid-rows-2 md:auto-rows-fr md:items-stretch">
          <ModelTile model={MODELS[0]} tall />
          <ModelTile model={MODELS[1]} />
          <ModelTile model={MODELS[2]} />
        </div>

        {/* Painel de confiança contido — ponte de cor para o Pricing forest.
            Reveal só aqui (um nível): o painel inteiro entra junto. card-accent =
            o detalhe dourado fino do design system (gold só em detalhe). */}
        <div data-reveal className="mt-12">
          <div className="card-forest card-accent rounded-2xl">
            <dl className="grid gap-6 divide-on-forest/15 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
              {FACTS.map((fact) => (
                <div key={fact.term} className="sm:px-6">
                  <dt className="font-bold text-on-forest">{fact.term}</dt>
                  <dd className="mt-1 leading-7 text-on-forest/85">{fact.line}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
