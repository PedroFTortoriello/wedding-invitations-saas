import Link from "next/link";
import { SHOWCASE_IDS, type ShowcaseId } from "./showcase";

const SECOES = [
  { label: "Modelos", href: "#modelos" },
  { label: "Site feito pela IA", href: "#ia" },
  { label: "Presentes", href: "#presentes" },
  { label: "Preço", href: "#preco" },
  { label: "Dúvidas", href: "#duvidas" }
];

/**
 * Nav da landing, server e sem JS. Mobile: estática, só wordmark + Entrar (mais
 * espaço no fold). Desktop: sticky com fundo sólido e hairline fixa, âncoras e CTA.
 */
export function LandingNav({ modelo = SHOWCASE_IDS[0] }: { modelo?: ShowcaseId }) {
  return (
    <header className="border-b border-line bg-bg lg:sticky lg:top-0 lg:z-40">
      <div className="wrap flex h-14 items-center justify-between gap-6 lg:h-16">
        {/* prefetch off: o prefetch de /login puxa o client do Supabase (~64 KB) antes do scroll. */}
        <Link href="/" prefetch={false} className="rounded-sm font-serif text-[1.75rem] leading-none text-ink italic">
          Noivar
        </Link>

        <nav aria-label="Seções" className="hidden lg:block">
          <ul className="flex items-center gap-8 text-[15px] font-semibold text-ink">
            {SECOES.map((s) => (
              <li key={s.href}>
                <a href={s.href} className={NAV_LINK}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" prefetch={false} className={`${NAV_LINK} -mr-3 px-3 py-3 text-[15px] font-semibold text-ink lg:mr-0 lg:px-0`}>
            Entrar
          </Link>
          {/* <a>, não <Link>: o LandingBehavior reescreve o href com o modelo escolhido. */}
          <a
            href={`/cadastro?modelo=${modelo}`}
            data-cta="nav"
            data-cta-modelo
            className="btn btn-sm btn-primary hidden lg:inline-flex"
          >
            Montar grátis
          </a>
        </div>
      </div>
    </header>
  );
}

const NAV_LINK =
  "rounded-sm underline decoration-transparent underline-offset-[6px] transition-colors duration-150 hover:decoration-ink/40 motion-reduce:transition-none";
