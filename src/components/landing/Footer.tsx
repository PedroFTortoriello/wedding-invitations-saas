import Link from "next/link";

// Navegação espelha a navbar (âncoras na página) + conta.
const NAVEGAR = [
  { label: "Modelos", href: "#modelos" },
  { label: "Recursos", href: "#recursos" },
  { label: "Preço", href: "#preco" },
  { label: "Dúvidas", href: "#duvidas" }
];
const CONTA = [
  { label: "Entrar", href: "/login" },
  { label: "Criar conta", href: "/cadastro" }
];

/**
 * Footer — o fecho definitivo da página, em forest (bookend com o Pricing).
 * Wordmark editorial + um nudge calmo (a página já tem CTA de sobra acima),
 * navegação espelhando a navbar, e a barra legal. Server component (sem
 * framer/estado): mais leve. Reveal de entrada via data-reveal global.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-forest text-on-forest">
      <div className="wrap section-tight">
        <div data-reveal className="grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-start">
          {/* Wordmark + sign-off + nudge calmo (link, não mais um botão grande). */}
          <div>
            <p className="font-serif text-5xl italic leading-none md:text-6xl">Noivar</p>
            <p className="measure mt-6 leading-7 text-on-forest/80">
              O convite digital à altura da celebração — confirmação de presença, recados e
              presentes via Pix que vão 100% para o casal, tudo num link só.
            </p>
            <Link
              href="/cadastro"
              className="mt-7 inline-flex min-h-11 items-center font-bold underline decoration-on-forest/40 underline-offset-4 transition-colors duration-200 hover:decoration-on-forest motion-reduce:transition-none"
            >
              Criar meu site →
            </Link>
          </div>

          {/* Navegação do rodapé, em dois grupos. */}
          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <p className="font-bold text-on-forest/70">Navegar</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {NAVEGAR.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="text-on-forest/85 transition-colors duration-200 hover:text-on-forest"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-on-forest/70">Conta</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {CONTA.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-on-forest/85 transition-colors duration-200 hover:text-on-forest"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        {/* Barra legal. */}
        <div className="mt-14 flex flex-col gap-2 border-t border-on-forest/15 pt-6 text-sm text-on-forest/70 md:flex-row md:items-center md:justify-between">
          <p>© {year} Noivar · Sites premium para casamentos</p>
          <p>Feito no Brasil</p>
        </div>
      </div>
    </footer>
  );
}
