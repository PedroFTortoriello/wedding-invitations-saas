"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const links = [
  { label: "Modelos", href: "#modelos" },
  { label: "Recursos", href: "#recursos" },
  { label: "Preço", href: "#preco" },
  { label: "Dúvidas", href: "#duvidas" }
];

/**
 * Navbar fixa em pílula. Fica translúcida no topo e ganha fundo + sombra ao
 * rolar. Menu mobile é um disclosure por CSS (grid-rows 0fr↔1fr + opacity) — sem
 * lib de animação; `inert` quando fechado tira o menu do foco/AT/clique.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha o menu mobile ao voltar para desktop.
  useEffect(() => {
    if (!open) return;
    const onResize = () => window.innerWidth >= 768 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 py-4">
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-full border px-5 py-3 backdrop-blur transition-[background-color,box-shadow,border-color] duration-200 ${
          scrolled
            ? "border-forest/15 bg-[#fffaf1]/90 shadow-[0_18px_50px_rgba(53,64,34,0.14)]"
            : "border-transparent bg-[#fffaf1]/55 shadow-none"
        }`}
      >
        <Link href="/" className="font-serif text-2xl italic leading-none">
          Noivar
        </Link>

        <div className="hidden items-center gap-8 text-sm font-bold text-ink md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-forest">
              {l.label}
            </a>
          ))}
          <Link href="/login" className="transition-colors hover:text-forest">
            Entrar
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/cadastro" className="btn btn-primary !text-on-forest min-h-10 px-5 text-sm">
            Criar meu site
          </Link>
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-forest/15 text-forest md:hidden"
          >
            <span className="relative block h-3 w-4" aria-hidden>
              <span
                className={`absolute left-0 block h-[2px] w-4 bg-current transition-transform duration-200 ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-[2px] w-4 bg-current transition-opacity duration-200 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-[2px] w-4 bg-current transition-transform duration-200 ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Menu mobile — disclosure por CSS (grid-rows + opacity). inert quando
          fechado: fora do foco/AT/clique, sem precisar desmontar. */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`grid overflow-hidden transition-all duration-200 ease-out motion-reduce:transition-none md:hidden ${
          open ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mx-auto max-w-6xl rounded-3xl border border-forest/15 bg-[#fffaf1]/95 p-3 shadow-[0_18px_50px_rgba(53,64,34,0.16)] backdrop-blur">
            <div className="flex flex-col">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3 text-base font-bold text-ink transition-colors hover:bg-forest/5"
                >
                  {l.label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-base font-bold text-ink transition-colors hover:bg-forest/5"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
