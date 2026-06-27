import Image from "next/image";
import Link from "next/link";
import { romanticImages } from "@/lib/demo-wedding";

const models = [
  {
    name: "Clássico Romântico",
    note: "Editorial, cinematográfico e mobile-first.",
    href: "/casamento/pedro-e-rafaela",
    image: romanticImages.hero,
    alt: "Casal sob guarda-chuva transparente em cerimônia ao entardecer, modelo Clássico Romântico"
  },
  {
    name: "Civil Minimalista",
    note: "Preto, branco e bege, com nomes em tipografia editorial.",
    href: "/modelo/civil-minimalista/pedro-e-rafaela",
    image: "/assets/canva-intimate/hero-canva.jpg",
    alt: "Retrato do casal em preto e branco, modelo Civil Minimalista"
  },
  {
    name: "Jardim Clássico",
    note: "Botânico e caligráfico, com capa floral.",
    href: "/modelo/garden-classico/pedro-e-rafaela",
    image: "/assets/canva-garden/hero-garden.jpg",
    alt: "Capa floral marrom e bege do modelo Jardim Clássico"
  }
];

const features = [
  {
    title: "Confirmação de presença",
    text: "Convidados confirmam em segundos e vocês acompanham tudo no painel."
  },
  {
    title: "Presentes via Pix",
    text: "Caem direto na chave do casal, 0% de taxa, sem a plataforma tocar no dinheiro."
  },
  {
    title: "Recados dos convidados",
    text: "Mensagens carinhosas reunidas em um só lugar, prontas para guardar."
  },
  {
    title: "Local, horário e roteiro",
    text: "Tudo o que o convidado precisa saber, sem depender de grupo de WhatsApp."
  }
];

const [featured, ...otherModels] = models;

export default function LandingPage() {
  return (
    <main className="overflow-hidden bg-bg text-ink">
      <header className="fixed inset-x-0 top-0 z-50 px-4 py-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-[#5b6842]/15 bg-[#fffaf1]/85 px-5 py-3 shadow-[0_18px_50px_rgba(53,64,34,0.12)] backdrop-blur">
          <Link href="/" className="font-serif text-2xl italic">
            Vows
          </Link>
          <div className="hidden items-center gap-8 text-sm font-bold text-ink md:flex">
            <a href="#modelos" className="transition-colors hover:text-forest">
              Modelos
            </a>
            <a href="#preco" className="transition-colors hover:text-forest">
              Preço
            </a>
            <Link href="/login" className="transition-colors hover:text-forest">
              Entrar
            </Link>
          </div>
          <Link href="/cadastro" className="btn btn-primary !text-on-forest min-h-10 px-5 text-sm">
            Criar meu site
          </Link>
        </nav>
      </header>

      {/* Hero — composição assimétrica, imagem sangrando até a borda */}
      <section className="relative grid grid-cols-1 overflow-hidden md:min-h-[100svh] md:grid-cols-[1.02fr_0.98fr] md:items-stretch">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_30%,rgba(91,104,66,0.18),transparent_38rem),radial-gradient(circle_at_88%_8%,rgba(156,123,63,0.16),transparent_30rem)]" />

        <div className="relative z-10 flex flex-col justify-center px-5 pb-14 pt-28 md:pb-20 md:pl-8 md:pr-14 md:pt-24 lg:pl-16">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-2 top-44 hidden origin-top-left -rotate-90 t-eyebrow text-gold lg:block"
          >
            Feito no Brasil · 2026
          </span>

          <p className="hero-rise t-eyebrow text-gold [animation-delay:0ms]">Sites premium para casamentos</p>
          <h1 className="hero-rise mt-6 max-w-2xl text-balance t-display italic [animation-delay:80ms]">
            Seus convidados sentem o casamento antes mesmo do grande dia.
          </h1>
          <p className="hero-rise mt-7 max-w-xl t-lead text-ink [animation-delay:160ms]">
            Modelos com tipografia editorial, fotografia em destaque e uma estética
            cinematográfica — o convite digital à altura da celebração.
          </p>
          <div className="hero-rise mt-9 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <Link href="/cadastro" className="btn btn-primary !text-on-forest min-h-14 px-8">
              Criar meu site
            </Link>
            <a href="#modelos" className="btn btn-secondary min-h-14 px-8 text-base">
              Ver os modelos
            </a>
          </div>
          <p className="hero-rise mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-ink-soft [animation-delay:320ms]">
            <span>0% de taxa nos presentes</span>
            <span aria-hidden className="text-gold">
              ·
            </span>
            <span>uma taxa única para publicar</span>
          </p>
        </div>

        <Link
          href={featured.href}
          className="hero-rise group relative block min-h-[62svh] overflow-hidden [animation-delay:360ms] md:min-h-0"
        >
          <Image
            src={featured.image}
            alt={featured.alt}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent md:bg-gradient-to-l md:from-black/45 md:via-black/5 md:to-transparent" />
          <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between gap-4 md:bottom-9 md:left-9 md:right-9">
            <div>
              <p className="t-eyebrow text-on-forest/80">Demonstração</p>
              <h2 className="mt-2 t-h2 italic text-on-forest">{featured.name}</h2>
            </div>
            <span className="shrink-0 rounded-full bg-[#fffaf1]/90 px-4 py-2 text-sm font-bold text-forest transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
              Abrir →
            </span>
          </div>
        </Link>
      </section>

      {/* Modelos — a prova visual carrega a página */}
      <section id="modelos" className="section bg-bg">
        <div className="wrap">
          <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between" data-reveal>
            <div>
              <p className="t-eyebrow text-gold">Modelos editoriais</p>
              <h2 className="mt-4 max-w-xl text-balance t-display italic">Cada detalhe pensado como num convite impresso.</h2>
            </div>
            <p className="measure t-lead text-ink md:text-right">
              Escolha o modelo, edite os dados do casal e publique. Toque para abrir uma
              demonstração ao vivo de cada um.
            </p>
          </header>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {otherModels.map((model, index) => (
              <Link
                key={model.name}
                href={model.href}
                data-reveal
                style={{ transitionDelay: `${index * 90}ms` }}
                className="group relative block overflow-hidden rounded-[1.6rem] shadow-[0_24px_70px_-40px_rgba(53,64,34,0.45)]"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={model.image}
                    alt={model.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-[#fffaf1]/85 px-3 py-1 t-eyebrow text-forest">
                    Demonstração
                  </span>
                  <div className="absolute inset-x-5 bottom-5">
                    <h3 className="t-h3 italic text-on-forest">{model.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-on-forest/85">{model.note}</p>
                    <span className="mt-3 inline-block text-sm font-bold text-on-forest underline-offset-4 group-hover:underline">
                      Ver demonstração →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Preço transparente — confiança como argumento */}
      <section id="preco" className="section-tight bg-forest text-on-forest">
        <div className="wrap">
          <header className="measure" data-reveal>
            <p className="t-eyebrow text-on-forest/65">Preço honesto</p>
            <h2 className="mt-4 t-h1 italic">Sem mensalidade. Sem letra miúda.</h2>
          </header>

          <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
            <div data-reveal className="border-t border-on-forest/20 pt-6">
              <p className="t-display">0%</p>
              <h3 className="mt-3 t-h3">de taxa nos presentes</h3>
              <p className="mt-3 measure leading-7 text-on-forest/85">
                Os presentes em dinheiro caem 100% na chave Pix de vocês, direto na conta.
                A plataforma nunca toca no dinheiro.
              </p>
            </div>
            <div data-reveal style={{ transitionDelay: "90ms" }} className="border-t border-on-forest/20 pt-6">
              <p className="t-display">R$ 149,90</p>
              <h3 className="mt-3 t-h3">uma vez, para publicar</h3>
              <p className="mt-3 measure leading-7 text-on-forest/85">
                Uma taxa única quando o site fica pronto para ir ao ar. Edite à vontade
                antes — você só paga para publicar.
              </p>
            </div>
          </div>

          <div className="mt-12" data-reveal>
            <Link href="/cadastro" className="btn btn-inverse px-8">
              Criar nosso site
            </Link>
          </div>
        </div>
      </section>

      {/* Tudo em um link — lista editorial, sem cards idênticos */}
      <section className="section bg-bg-2">
        <div className="wrap grid gap-12 md:grid-cols-[0.92fr_1.08fr] md:items-center">
          <div data-reveal>
            <p className="t-eyebrow text-gold">Tudo em um link</p>
            <h2 className="mt-4 max-w-md text-balance t-display italic">O casamento inteiro num só endereço.</h2>
            <p className="mt-6 measure t-lead text-ink">
              Um link bonito para o convite e o WhatsApp, com tudo o que família e amigos
              precisam — da confirmação de presença aos presentes.
            </p>
            <div className="mt-8 overflow-hidden rounded-[1.6rem]">
              <Image
                src={romanticImages.reception}
                alt="Mesa posta com flores brancas em recepção de casamento"
                width={1200}
                height={760}
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          </div>

          <ul data-reveal className="grid gap-0">
            {features.map((feature, index) => (
              <li
                key={feature.title}
                data-reveal
                style={{ transitionDelay: `${index * 70}ms` }}
                className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 border-t border-[#5b6842]/15 py-6 first:border-t-0 first:pt-0"
              >
                <span aria-hidden className="font-serif text-2xl italic text-gold">
                  &amp;
                </span>
                <div>
                  <h3 className="t-h3">{feature.title}</h3>
                  <p className="mt-2 leading-7 text-ink-soft">{feature.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final */}
      <section className="section-tight bg-bg">
        <div className="wrap">
          <div className="card-accent rounded-[2rem] bg-[#fffaf1] px-7 py-14 text-center shadow-[0_30px_80px_-50px_rgba(53,64,34,0.5)] md:px-12 md:py-20" data-reveal>
            <p className="t-eyebrow text-gold">Comecem hoje</p>
            <h2 className="mx-auto mt-5 max-w-2xl text-balance t-display italic">
              O para sempre de vocês merece um começo à altura.
            </h2>
            <p className="mx-auto mt-6 max-w-xl t-lead text-ink">
              Crie a conta, escolha um modelo e veja o site ganhar vida em minutos.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/cadastro" className="btn btn-primary !text-on-forest min-h-14 px-8">
                Criar meu site
              </Link>
              <a href="#modelos" className="btn btn-secondary min-h-14 px-8 text-base">
                Ver os modelos
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#5b6842]/12 bg-bg">
        <div className="wrap flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-serif text-2xl italic">Vows</p>
            <p className="mt-2 text-sm text-ink-soft">Sites premium para casamentos.</p>
          </div>
          <nav className="flex flex-wrap gap-x-7 gap-y-2 text-sm font-bold text-ink-soft">
            <a href="#modelos" className="transition-colors hover:text-forest">
              Modelos
            </a>
            <a href="#preco" className="transition-colors hover:text-forest">
              Preço
            </a>
            <Link href="/login" className="transition-colors hover:text-forest">
              Entrar
            </Link>
            <Link href="/cadastro" className="transition-colors hover:text-forest">
              Criar conta
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
