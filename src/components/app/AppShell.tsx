import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { platformName, supportWhatsApp } from "@/lib/platform-data";
import { CookiePreferencesButton } from "@/components/analytics/Analytics";
import { SignOutButton } from "@/components/app/SignOutButton";
import { Icon, type IconName } from "@/components/app/icons";
import { SupportBar } from "@/components/app/SupportBar";
import type { SupportInfo } from "@/lib/acting";
import type { WeddingSite } from "@/types/wedding";

export type NavKey = "dashboard" | "editor" | "guests" | "messages" | "gifts" | "cash-gifts";

/** O que a lateral mostra do casamento: nome, status, foto de capa e contagem regressiva. */
export type ShellWedding = {
  coupleNames: string;
  slug: string;
  status: string;
  heroImage?: string | null;
  weddingDate?: string;
  monogram?: string;
};

type AppShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  active: NavKey;
  /** Ações à direita do título (ex.: "Ver site"). */
  actions?: ReactNode;
  /** Casamento do usuário — mostra nome, status e atalho para o site na lateral. */
  wedding?: ShellWedding | null;
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

/** Item da lateral (fundo forest): texto claro, ativo vira pílula creme. */
const SIDE_ITEM =
  "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[0.9375rem] text-on-forest/80 transition-colors duration-150 hover:bg-on-forest/10 hover:text-on-forest focus-visible:outline-2 focus-visible:outline-on-forest";

/** Dias inteiros até a data (0 se já passou ou se não há data). */
export function daysUntil(iso: string | undefined): number {
  if (!iso) return 0;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - Date.now()) / 86400000));
}

/** O que as páginas passam para a lateral a partir do site do casal. */
export function shellWedding(
  site: Pick<WeddingSite, "coupleNames" | "slug" | "status" | "heroImage" | "weddingDate" | "monogram">
): ShellWedding {
  return {
    coupleNames: site.coupleNames,
    slug: site.slug,
    status: site.status,
    heroImage: site.heroImage,
    weddingDate: site.weddingDate,
    monogram: site.monogram
  };
}

export function AppShell({ children, title, subtitle, active, actions, wedding, support }: AppShellProps) {
  const giftsArea = active === "gifts" || active === "cash-gifts";
  // A barra do suporte (h-12) fica no fluxo; lateral fixa e topo sticky começam abaixo dela.
  const top = support ? "top-12" : "top-0";

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {support ? <SupportBar support={support} /> : null}

      {/* Lateral (desktop) — faixa forest: o painel ganha contraste e o conteúdo creme respira. */}
      <aside className={`fixed bottom-0 left-0 ${top} z-30 hidden w-64 flex-col bg-forest text-on-forest lg:flex`}>
        <div className="px-6 pb-5 pt-7">
          <Link href="/dashboard" className="font-serif text-[1.875rem] italic leading-none">
            {platformName}
          </Link>
        </div>

        {wedding ? <WeddingCard wedding={wedding} /> : null}

        <nav aria-label="Painel" className="mt-4 grid content-start gap-6 overflow-y-auto px-3 pb-4">
          {NAV.map((group, index) => (
            <div key={group.label ?? index} className="grid gap-0.5">
              {group.label ? (
                <p className="px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-on-forest/70">
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
                    className={
                      current
                        ? "flex min-h-10 items-center gap-3 rounded-lg bg-on-forest px-3 text-[0.9375rem] font-semibold text-forest shadow-[0_8px_20px_-12px_rgb(0_0_0/0.6)]"
                        : SIDE_ITEM
                    }
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto grid gap-0.5 border-t border-on-forest/12 px-3 py-3">
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className={SIDE_ITEM}>
            <Icon name="help" />
            Ajuda no WhatsApp
          </a>
          <SignOutButton className={SIDE_ITEM} />
          <CookiePreferencesButton className="min-h-8 rounded-lg px-3 text-left text-[0.8125rem] text-on-forest/70 transition-colors duration-150 hover:bg-on-forest/10 hover:text-on-forest focus-visible:outline-2 focus-visible:outline-on-forest" />
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

        {/* grid gap-5: ritmo vertical único entre os blocos; app-enter: entrada em cascata. */}
        <main className="app-enter mx-auto grid max-w-6xl gap-5 px-4 pb-12 md:px-8">{children}</main>
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

function WeddingCard({ wedding }: { wedding: ShellWedding }) {
  const published = wedding.status === "published";
  const days = daysUntil(wedding.weddingDate);
  return (
    <div className="mx-3 rounded-xl bg-on-forest/8 p-3 ring-1 ring-on-forest/12">
      <div className="flex items-center gap-3">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-on-forest/10">
          {wedding.heroImage ? (
            <Image src={wedding.heroImage} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            <span className="grid h-full place-items-center font-serif text-[1.125rem] italic">{wedding.monogram || "♥"}</span>
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-serif text-[1.125rem] italic leading-tight">{wedding.coupleNames}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[0.75rem] text-on-forest/75">
            <span className={`size-1.5 rounded-full ${published ? "bg-on-forest" : "bg-gold"}`} aria-hidden />
            {published ? "Publicado" : "Rascunho"}
            {days > 0 ? ` · faltam ${days} ${days === 1 ? "dia" : "dias"}` : ""}
          </p>
        </div>
      </div>
      <Link
        href={`/casamento/${wedding.slug}`}
        target="_blank"
        className="mt-3 flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-on-forest/10 text-[0.8125rem] font-semibold text-on-forest transition-colors duration-150 hover:bg-on-forest/18"
      >
        {published ? "Ver site" : "Ver prévia"}
        <Icon name="external" size={14} />
      </Link>
    </div>
  );
}
