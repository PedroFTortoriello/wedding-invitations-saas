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
    <main className="overflow-hidden bg-[#fbf7ef] text-[#332820]">
      <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4">
        <nav className="mx-auto flex max-w-full items-center justify-between rounded-full border border-[#5b6842]/15 bg-[#fffaf1]/85 px-5 py-3 shadow-[0_18px_50px_rgba(53,64,34,0.12)] backdrop-blur">
          <Link href="/" className="font-serif text-2xl italic">
            Vows
          </Link>
          <div className="hidden items-center gap-8 text-sm font-bold text-[#493c34] md:flex">
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

      <section className="relative mx-auto grid min-h-screen max-w-full items-center gap-12 px-5 pb-20 pt-32 md:grid-cols-[1fr_0.82fr] md:px-8">
        <div className="absolute inset-x-0 top-0 -z-0 h-[44rem] bg-[radial-gradient(circle_at_24%_12%,rgba(91,104,66,0.18),transparent_34rem),radial-gradient(circle_at_80%_18%,rgba(220,181,142,0.28),transparent_28rem)]" />
        <div className="relative z-10">
          <p className="mb-6 text-xs font-black uppercase tracking-[0.42em] text-[#5b6842]">
            Sites premium para casamentos
          </p>
<h1 className="max-w-4xl font-serif text-[clamp(1.7rem,5.4vw,5.8rem)] italic leading-[0.88] tracking-[-0.03em]">
  Um site de casamento que faz seus convidados sentirem o evento antes mesmo do grande dia.
</h1>
          <p className="mt-8 max-w-2xl text-xl leading-8 text-[#51443b]">
          Layouts inspirados em revistas de casamento de luxo, com tipografia refinada, fotografia em destaque e uma estética cinematográfica.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#354022] px-8 text-base font-black !text-white"
            >
              Criar meu site
            </Link>
            <Link
              href="/casamento/pedro-e-rafaela"
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-[#5b6842]/20 bg-white/45 px-8 text-base font-black text-[#354022]"
            >
              Ver demonstração
            </Link>
          </div>
        </div>

        <Link
          href="/casamento/pedro-e-rafaela"
          className="relative z-10 mx-auto block w-full max-w-[28rem] rounded-[2rem] border border-white/70 bg-[#fffaf1] p-3 shadow-[0_32px_90px_rgba(53,64,34,0.22)] transition duration-500 hover:-translate-y-2"
        >
          <div className="overflow-hidden rounded-[1.45rem]">
            <Image
              src={demoWedding.heroImage}
              alt="Prévia do modelo Clássico Romântico"
              width={900}
              height={1200}
              priority
              className="aspect-[0.78] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-7 left-8 right-8 rounded-3xl border border-[#5b6842]/10 bg-[#fffaf1]/95 p-5 shadow-2xl backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5b6842]">Modelo</p>
            <h2 className="mt-2 font-serif text-4xl italic leading-none">Clássico Romântico</h2>
          </div>
        </Link>
      </section>

      <section id="recursos" className="mx-auto grid max-w-7xl gap-5 px-5 py-24 md:grid-cols-4 md:px-8">
        {benefits.map((benefit) => (
          <article
            key={benefit.title}
            className="rounded-[1.6rem] border border-[#5b6842]/12 bg-[#fffaf1]/80 p-7 shadow-[0_18px_48px_rgba(53,64,34,0.08)]"
          >
            <h3 className="font-serif text-4xl leading-none">{benefit.title}</h3>
            <p className="mt-4 leading-7 text-[#51443b]">{benefit.text}</p>
          </article>
        ))}
      </section>

      <section id="templates" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-8">
        <div>
          <p className="mb-4 text-xs font-black uppercase tracking-[0.38em] text-[#5b6842]">
            Primeiro modelo oficial
          </p>
          <h2 className="font-serif text-6xl italic leading-none md:text-8xl">Clássico Romântico</h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#51443b]">
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
            <div className="absolute inset-x-8 top-8 grid grid-cols-2 font-serif text-5xl uppercase leading-none tracking-[-0.08em] text-[#eeede7] md:text-7xl">
              <span className="text-right">Pedro</span>
              <span className="pl-8">Rafaela</span>
            </div>
          </div>
        </Link>
        <div className="self-center">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.38em] text-[#5b6842]">Novo modelo de site</p>
          <h2 className="font-serif text-6xl italic leading-none md:text-8xl">Civil Minimalista</h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#51443b]">
            Um modelo inspirado no site do Canva enviado: preto, branco e bege, nomes gigantes em tipografia editorial,
            fotos reais em preto e branco e seções horizontais premium.
          </p>
          <Link
            href="/modelo/civil-minimalista/pedro-e-rafaela"
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#020202] px-7 font-bold !text-[#eeede7]"
          >
            Abrir demonstração do modelo
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-[0.95fr_1.05fr] md:px-8">
        <div className="self-center">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.38em] text-[#6d604e]">Novo modelo jardim</p>
          <h2 className="font-serif text-6xl italic leading-none md:text-8xl">Jardim Clássico</h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#51443b]">
            Modelo inspirado no casamento no jardim do Canva: marrom, bege, botânico, capa floral, tipografia caligráfica,
            confirmação de presença em destaque e programa do evento com atmosfera de jardim.
          </p>
          <Link
            href="/modelo/garden-classico/pedro-e-rafaela"
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#304254] px-7 font-bold !text-[#faf1e1]"
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
            <div className="absolute inset-x-7 top-1/2 -translate-y-1/2 text-center text-[#faf1e1]">
              <h3 className="font-serif text-6xl italic leading-none">Pedro & Rafaela</h3>
              <p className="mt-4 font-serif text-2xl uppercase tracking-[0.12em]">Vão se casar</p>
            </div>
          </div>
        </Link>
      </section>

      <section id="receita" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-8 rounded-[2rem] bg-[#354022] p-8 text-white md:grid-cols-[0.9fr_1.1fr] md:p-12">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.38em] text-[#dfe6cc]">
              {cashGiftRevenueModel.minimumFeeLabel}
            </p>
            <h2 className="font-serif text-6xl italic leading-none md:text-8xl">{cashGiftRevenueModel.title}</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/84">{cashGiftRevenueModel.subtitle}</p>
          </div>
          <div className="grid content-center gap-4">
            {cashGiftRevenueModel.features.map((feature) => (
              <article key={feature} className="rounded-3xl border border-white/12 bg-white/8 p-5">
                <h3 className="font-serif text-4xl leading-none">{feature}</h3>
              </article>
            ))}
   <Link
  href="/checkout"
  className="mt-2 inline-flex min-h-13 w-fit items-center rounded-full bg-[#fffaf1] px-8 !text-[#354022]"
>
Criar nosso site agora
</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
