import Image from "next/image";
import Link from "next/link";

/**
 * Hero assimétrico: copy à esquerda, foto real do modelo sangrando à direita.
 * Server component, sem JS. A entrada usa a animação CSS `hero-rise` (já no
 * design system): fade + rise escalonado que toca no PRIMEIRO frame, sem esperar
 * hidratação — ao contrário do Framer initial="hidden", que gatava o H1 (o LCP no
 * mobile) atrás do JS e estourava o LCP pra ~5s. A imagem fica opacity 1 + priority
 * (LCP instantâneo); anima só a escala no hover, via CSS. prefers-reduced-motion
 * desliga tudo (regras globais em globals.css).
 */
export function Hero() {
  return (
    <section className="relative grid grid-cols-1 overflow-hidden md:min-h-[100svh] md:grid-cols-[1.02fr_0.98fr] md:items-stretch">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_30%,rgba(91,104,66,0.18),transparent_38rem),radial-gradient(circle_at_88%_8%,rgba(156,123,63,0.16),transparent_30rem)]" />

      <div className="relative z-10 flex flex-col justify-center px-5 pb-14 pt-28 md:pb-20 md:pl-8 md:pr-14 md:pt-24 lg:pl-16">
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

      <div className="relative min-h-[62svh] md:min-h-0">
        <Link
          href="/modelo/classico-romantico/helena-e-lucas"
          className="group relative block h-full w-full overflow-hidden"
        >
          <Image
            src="/assets/landing/hero-classico.jpg"
            alt="Casal sob guarda-chuva transparente em cerimônia ao entardecer, modelo Clássico Romântico"
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent md:bg-gradient-to-l md:from-black/45 md:via-black/5 md:to-transparent" />
          <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between gap-4 md:bottom-9 md:left-9 md:right-9">
            <div>
              <p className="t-eyebrow text-on-forest/80">Demonstração ao vivo</p>
              <p className="mt-2 t-h2 italic text-on-forest">Clássico Romântico</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#fffaf1]/90 px-4 py-2 text-sm font-bold text-forest transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
              Abrir →
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
