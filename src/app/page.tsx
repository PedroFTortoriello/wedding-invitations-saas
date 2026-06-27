import Image from "next/image";
import Link from "next/link";
import { demoWedding, romanticImages } from "@/lib/demo-wedding";
import { cashGiftRevenueModel } from "@/lib/platform-data";

const benefits = [
  {
    title: "Design premium",
    text: "Um site criado para casais que querem mais do que um convite: querem uma experiência memorável para família e amigos., movimento e composição dignos do convite."
  },
  {
    title: "Confirmação elegante",
    text: "Confirmações de presença com uma experiência simples para convidados e noivos."
  },
  {
    title: "Informações do evento",
    text: "Local, horário, presentes, mensagens e detalhes importantes em um link único."
  },
  {
    title: "Link exclusivo",
    text: "Um endereço bonito para compartilhar no WhatsApp, no convite ou nas redes."
  }
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden bg-[#fbf7ef] text-ink">
      <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4">
        <nav className="mx-auto flex max-w-full items-center justify-between rounded-full border border-[#5b6842]/15 bg-[#fffaf1]/85 px-5 py-3 shadow-[0_18px_50px_rgba(53,64,34,0.12)] backdrop-blur">
          <Link href="/" className="font-serif text-2xl italic">
            Vows
          </Link>
          <div className="hidden items-center gap-8 text-sm font-bold text-ink md:flex">
            <a href="#templates">Modelos</a>
            <a href="#recursos">Recursos</a>
            <a href="#receita">Presentes em dinheiro</a>
          </div>
          <Link
            href="/cadastro"
            className="inline-flex min-h-10 items-center rounded-full bg-[#354022] px-5 text-sm font-bold !text-white"
          >
            Criar meu site
          </Link>
        </nav>
      </header>

      <section className="relative grid grid-cols-1 overflow-hidden md:min-h-[100svh] md:grid-cols-2 md:items-stretch">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_28%,rgba(91,104,66,0.16),transparent_40rem),radial-gradient(circle_at_82%_12%,rgba(220,181,142,0.24),transparent_32rem)]" />

        <div className="relative z-10 flex flex-col justify-center px-5 pb-12 pt-28 md:pb-16 md:pl-8 md:pr-12 md:pt-24 lg:pl-16">
          <p className="hero-rise [animation-delay:0ms] t-eyebrow text-ink-soft">
            Sites premium para casamentos
          </p>
          <h1 className="hero-rise mt-6 max-w-xl t-display italic [animation-delay:80ms]">
            Um site de casamento que faz seus convidados sentirem o evento antes mesmo do grande dia.
          </h1>
          <p className="hero-rise mt-7 max-w-xl t-lead text-ink [animation-delay:160ms]">
            Layouts inspirados em revistas de casamento de luxo, com tipografia refinada, fotografia em destaque e uma estética cinematográfica.
          </p>
          <div className="hero-rise mt-9 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <Link
              href="/cadastro"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-forest px-8 text-base font-black !text-on-forest transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(44,58,36,0.3)]"
            >
              Criar meu site
            </Link>
            <Link
              href="/casamento/pedro-e-rafaela"
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-forest/25 bg-white/50 px-8 text-base font-black text-forest transition-colors duration-200 hover:bg-white/80"
            >
              Ver demonstração
            </Link>
          </div>
        </div>

        <Link
          href="/casamento/pedro-e-rafaela"
          className="hero-rise group relative block min-h-[60svh] overflow-hidden [animation-delay:320ms] md:min-h-0"
        >
          <Image
            src={demoWedding.heroImage}
            alt="Prévia do modelo Clássico Romântico"
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent md:bg-gradient-to-l md:from-black/45 md:via-black/5 md:to-transparent" />
          <div className="absolute bottom-7 left-7 right-7 md:bottom-9 md:left-9 md:right-9">
            <p className="t-eyebrow text-on-forest/85">Modelo</p>
            <h2 className="mt-2 t-h2 italic text-on-forest">Clássico Romântico</h2>
          </div>
        </Link>
      </section>

      <section id="recursos" className="mx-auto grid max-w-7xl gap-5 px-5 py-24 md:grid-cols-4 md:px-8">
        {benefits.map((benefit) => (
          <article
            key={benefit.title}
            className="rounded-[1.6rem] border border-[#5b6842]/12 bg-[#fffaf1]/80 p-7 shadow-[0_18px_48px_rgba(53,64,34,0.08)]"
          >
            <h3 className="t-h2">{benefit.title}</h3>
            <p className="mt-4 leading-7 text-ink">{benefit.text}</p>
          </article>
        ))}
      </section>

      <section id="templates" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-8">
        <div>
          <p className="mb-4 t-eyebrow text-ink-soft">
            Primeiro modelo oficial
          </p>
          <h2 className="t-display italic">Clássico Romântico</h2>
          <p className="mt-6 max-w-xl t-lead text-ink">
            O site original vira a prova visual da plataforma: um modelo editorial, romântico,
            responsivo e preparado para receber dados dinâmicos de cada casal.
          </p>
          <Link
            href="/casamento/pedro-e-rafaela"
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#354022] px-7 font-bold !text-white"
          >
            Abrir demonstração romântica
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[romanticImages.toast, romanticImages.hands, romanticImages.ceremonyAisle].map(
            (src, index) => (
              <div key={src} className={index === 1 ? "pt-10" : ""}>
                <Image
                  src={src}
                  alt="Detalhe visual do modelo"
                  width={420}
                  height={560}
                  className="aspect-[0.78] rounded-[1.4rem] object-cover shadow-2xl"
                />
              </div>
            )
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-[1.05fr_0.95fr] md:px-8">
        <Link
          href="/modelo/civil-minimalista/pedro-e-rafaela"
          className="group overflow-hidden rounded-[2rem] bg-[#020202] p-3 shadow-[0_28px_90px_rgba(2,2,2,0.22)]"
        >
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.45rem]">
            <Image
              src="/assets/canva-intimate/hero-canva.jpg"
              alt="Prévia do modelo Civil Minimalista"
              width={1600}
              height={1066}
              className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/42" />
            <div className="absolute inset-x-8 top-8 grid grid-cols-2 t-display uppercase tracking-[-0.08em] text-on-forest">
              <span className="text-right">Pedro</span>
              <span className="pl-8">Rafaela</span>
            </div>
          </div>
        </Link>
        <div className="self-center">
          <p className="mb-4 t-eyebrow text-ink-soft">Novo modelo de site</p>
          <h2 className="t-display italic">Civil Minimalista</h2>
          <p className="mt-6 max-w-xl t-lead text-ink">
            Um modelo inspirado no site do Canva enviado: preto, branco e bege, nomes gigantes em tipografia editorial,
            fotos reais em preto e branco e seções horizontais premium.
          </p>
          <Link
            href="/modelo/civil-minimalista/pedro-e-rafaela"
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#020202] px-7 font-bold !text-on-forest"
          >
            Abrir demonstração do modelo
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-[0.95fr_1.05fr] md:px-8">
        <div className="self-center">
          <p className="mb-4 t-eyebrow text-ink-soft">Novo modelo jardim</p>
          <h2 className="t-display italic">Jardim Clássico</h2>
          <p className="mt-6 max-w-xl t-lead text-ink">
            Modelo inspirado no casamento no jardim do Canva: marrom, bege, botânico, capa floral, tipografia caligráfica,
            confirmação de presença em destaque e programa do evento com atmosfera de jardim.
          </p>
          <Link
            href="/modelo/garden-classico/pedro-e-rafaela"
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#304254] px-7 font-bold !text-on-forest"
          >
            Abrir demonstração Jardim
          </Link>
        </div>
        <Link
          href="/modelo/garden-classico/pedro-e-rafaela"
          className="group overflow-hidden rounded-[2rem] bg-[#cdc1ab] p-3 shadow-[0_28px_90px_rgba(109,96,78,0.22)]"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.45rem]">
            <Image
              src="/assets/canva-garden/hero-garden.jpg"
              alt="Prévia do modelo Jardim Clássico"
              width={1600}
              height={2400}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[#2d2b25]/34" />
            <div className="absolute inset-x-7 top-1/2 -translate-y-1/2 text-center text-on-forest">
              <h3 className="t-h1 italic">Pedro & Rafaela</h3>
              <p className="mt-4 font-serif text-2xl uppercase tracking-[0.12em]">Vão se casar</p>
            </div>
          </div>
        </Link>
      </section>

      <section id="receita" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-8 rounded-[2rem] bg-[#354022] p-8 text-white md:grid-cols-[0.9fr_1.1fr] md:p-12">
          <div>
            <p className="mb-4 t-eyebrow text-on-forest">
              {cashGiftRevenueModel.highlight}
            </p>
            <h2 className="t-display italic">{cashGiftRevenueModel.title}</h2>
            <p className="mt-6 max-w-xl t-lead text-on-forest">{cashGiftRevenueModel.subtitle}</p>
          </div>
          <div className="grid content-center gap-4">
            {cashGiftRevenueModel.features.map((feature) => (
              <article key={feature} className="rounded-3xl border border-white/12 bg-white/8 p-5">
                <h3 className="t-h2">{feature}</h3>
              </article>
            ))}
   <Link
  href="/checkout"
  className="mt-2 inline-flex min-h-13 w-fit items-center rounded-full bg-[#fffaf1] px-8 !text-forest"
>
Criar nosso site agora
</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
