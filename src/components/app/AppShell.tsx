import Link from "next/link";
import type { ReactNode } from "react";
import { platformName, supportWhatsApp } from "@/lib/platform-data";
import { CookiePreferencesButton } from "@/components/analytics/Analytics";
import { SignOutButton } from "@/components/app/SignOutButton";
import { Icon, type IconName } from "@/components/app/icons";
import { SupportBar } from "@/components/app/SupportBar";
import type { SupportInfo } from "@/lib/acting";

export type NavKey = "dashboard" | "editor" | "guests" | "messages" | "gifts" | "cash-gifts";

type AppShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  active: NavKey;
  /** Ações à direita do título (ex.: "Ver site"). */
  actions?: ReactNode;
  /** Casamento do usuário — mostra nome, status e atalho para o site na lateral. */
  wedding?: { coupleNames: string; slug: string; status: string } | null;
  /** Modo suporte (admin vendo a conta de um cliente): mostra a barra no topo. */
  support?: SupportInfo | null;
};

type NavItem = { key: NavKey; href: string; label: string; icon: IconName };

const NAV: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { key: "dashboard", href: "/dashboard", label: "Visão geral", icon: "home" },
      { key: "editor", href: "/editor", label: "Editor do site", icon: "edit" }
    ]
  },
  {
    label: "Convidados",
    items: [
      { key: "guests", href: "/convidados", label: "Lista e confirmações", icon: "users" },
      { key: "messages", href: "/mensagens", label: "Recados", icon: "message" }
    ]
  },
  {
    label: "Presentes",
    items: [
      { key: "gifts", href: "/presentes", label: "Cotas do site", icon: "gift" },
      { key: "cash-gifts", href: "/checkout", label: "Recebimentos", icon: "wallet" }
    ]
  }
];

/** No celular cabem 5 abas: Cotas e Recebimentos viram uma só ("Presentes") com abas na página. */
const MOBILE_TABS: { keys: NavKey[]; href: string; label: string; icon: IconName }[] = [
  { keys: ["dashboard"], href: "/dashboard", label: "Início", icon: "home" },
  { keys: ["editor"], href: "/editor", label: "Editor", icon: "edit" },
  { keys: ["guests"], href: "/convidados", label: "Convidados", icon: "users" },
  { keys: ["messages"], href: "/mensagens", label: "Recados", icon: "message" },
  { keys: ["gifts", "cash-gifts"], href: "/presentes", label: "Presentes", icon: "gift" }
];

const SUPPORT_URL = `https://wa.me/${supportWhatsApp}?text=${encodeURIComponent("Olá! Preciso de ajuda com o Noivar.")}`;

export function AppShell({ children, title, subtitle, active, actions, wedding, support }: AppShellProps) {
  const giftsArea = active === "gifts" || active === "cash-gifts";
  // A barra do suporte (h-12) fica no fluxo; lateral fixa e topo sticky começam abaixo dela.
  const top = support ? "top-12" : "top-0";

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {support ? <SupportBar support={support} /> : null}

      {/* Lateral (desktop) */}
      <aside className={`fixed bottom-0 left-0 ${top} z-30 hidden w-64 flex-col border-r border-line bg-bg-2 lg:flex`}>
        <div className="px-5 pb-4 pt-6">
          <Link href="/dashboard" className="font-serif text-[1.75rem] italic leading-none">
            {platformName}
          </Link>
        </div>

        {wedding ? <WeddingCard wedding={wedding} /> : null}

        <nav aria-label="Painel" className="mt-2 grid content-start gap-5 overflow-y-auto px-3 pb-4">
          {NAV.map((group, index) => (
            <div key={group.label ?? index} className="grid gap-0.5">
              {group.label ? (
                <p className="px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  {group.label}
                </p>
              ) : null}
              {group.items.map((item) => {
                const current = item.key === active;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-[0.9375rem] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-forest ${
                      current
                        ? "bg-surface font-semibold text-ink shadow-[0_0_0_1px_var(--color-line)]"
                        : "text-ink-soft hover:bg-forest/6 hover:text-ink"
                    }`}
                  >
                    <Icon name={item.icon} className={current ? "text-forest" : undefined} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto grid gap-0.5 border-t border-line px-3 py-3">
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-[0.9375rem] text-ink-soft transition-colors duration-150 hover:bg-forest/6 hover:text-ink"
          >
            <Icon name="help" />
            Ajuda no WhatsApp
          </a>
          <SignOutButton />
          <CookiePreferencesButton className="min-h-8 rounded-lg px-3 text-left focus-visible:outline-2 focus-visible:outline-forest text-[0.8125rem] text-ink-soft transition-colors duration-150 hover:bg-forest/6 hover:text-ink" />
        </div>
      </aside>

      {/* Topo (celular/tablet) */}
      <div className={`sticky ${top} z-30 flex h-14 items-center justify-between gap-2 border-b border-line bg-bg/95 px-4 backdrop-blur-sm lg:hidden`}>
        <Link href="/dashboard" className="font-serif text-[1.5rem] italic leading-none">
          {platformName}
        </Link>
        <div className="flex items-center">
          {wedding ? (
            <Link
              href={`/casamento/${wedding.slug}`}
              target="_blank"
              className="icon-btn"
              aria-label="Abrir meu site em nova aba"
            >
              <Icon name="external" />
            </Link>
          ) : null}
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="Ajuda no WhatsApp">
            <Icon name="help" />
          </a>
          <SignOutButton compact />
        </div>
      </div>

      <div className="pb-24 lg:pb-0 lg:pl-64">
        <header className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-6 pt-7 sm:flex-row sm:items-end sm:justify-between md:px-8 lg:pt-10">
          <div className="min-w-0">
            <h1 className="font-serif text-[1.875rem] leading-[1.1] tracking-[-0.01em] text-balance md:text-[2.375rem]">
              {title}
            </h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-[0.9375rem] leading-6 text-ink-soft">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>

        {giftsArea ? (
          <nav aria-label="Presentes" className="mx-auto mb-6 max-w-6xl px-4 md:px-8 lg:hidden">
            <div className="flex gap-1 border-b border-line">
              {[
                { key: "gifts", href: "/presentes", label: "Cotas do site" },
                { key: "cash-gifts", href: "/checkout", label: "Recebimentos" }
              ].map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.href}
                  aria-current={tab.key === active ? "page" : undefined}
                  className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold ${
                    tab.key === active ? "border-forest text-ink" : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}

        <main className="mx-auto max-w-6xl px-4 pb-12 md:px-8">{children}</main>
        <div className="mx-auto -mt-6 max-w-6xl px-4 md:px-8 lg:hidden">
          <CookiePreferencesButton className="min-h-11 rounded text-[0.8125rem] text-ink-soft underline focus-visible:outline-2 focus-visible:outline-forest underline-offset-4 hover:text-ink" />
        </div>
      </div>

      {/* Abas inferiores (celular/tablet) */}
      <nav
        aria-label="Painel"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
      >
        {MOBILE_TABS.map((tab) => {
          const current = tab.keys.includes(active);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold ${
                current ? "text-forest" : "text-ink-soft"
              }`}
            >
              <span
                className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-150 ${
                  current ? "bg-forest/10" : ""
                }`}
              >
                <Icon name={tab.icon} size={20} />
              </span>
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function WeddingCard({ wedding }: { wedding: NonNullable<AppShellProps["wedding"]> }) {
  const published = wedding.status === "published";
  return (
    <div className="mx-3 mb-3 rounded-xl border border-line bg-surface px-3 py-3">
      <p className="truncate font-serif text-[1.25rem] italic leading-tight">{wedding.coupleNames}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-soft">
          <span className={`size-2 rounded-full ${published ? "bg-forest" : "bg-[#b8892f]"}`} aria-hidden />
          {published ? "Publicado" : "Rascunho"}
        </span>
        <Link
          href={`/casamento/${wedding.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.8125rem] font-semibold text-forest hover:bg-forest/6"
        >
          Ver site
          <Icon name="external" size={14} />
        </Link>
      </div>
    </div>
  );
}
