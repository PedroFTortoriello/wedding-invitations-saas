import Link from "next/link";
import type { ReactNode } from "react";
import { platformName } from "@/lib/platform-data";
import { AdminSignOut } from "@/components/admin/AdminSignOut";
import { Icon, type IconName } from "@/components/app/icons";

export type AdminNavKey = "overview" | "weddings" | "users" | "revenue" | "templates";

type AdminShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  active: AdminNavKey;
  /** Ações à direita do título. */
  actions?: ReactNode;
};

const NAV: { key: AdminNavKey; href: string; label: string; short: string; icon: IconName }[] = [
  { key: "overview", href: "/admin", label: "Operação", short: "Operação", icon: "chart" },
  { key: "weddings", href: "/admin/casamentos", label: "Casamentos", short: "Casamentos", icon: "heart" },
  { key: "users", href: "/admin/usuarios", label: "Usuários", short: "Usuários", icon: "users" },
  { key: "revenue", href: "/admin/pacotes", label: "Receita Pix", short: "Receita", icon: "wallet" },
  { key: "templates", href: "/admin/templates", label: "Modelos", short: "Modelos", icon: "palette" }
];

function Wordmark({ size }: { size: string }) {
  return (
    <Link href="/admin" className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-on-forest">
      <span className={`font-serif italic leading-none ${size}`}>{platformName}</span>
      <span className="rounded-full border border-on-forest/30 px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-on-forest/90">
        Admin
      </span>
    </Link>
  );
}

export function AdminShell({ children, title, subtitle, active, actions }: AdminShellProps) {
  return (
    <div className="min-h-dvh bg-bg text-ink">
      {/* Lateral (desktop) — verde para o modo admin ser inconfundível */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-forest text-on-forest lg:flex">
        <div className="px-5 pb-6 pt-6">
          <Wordmark size="text-[1.75rem]" />
        </div>

        <nav aria-label="Administração" className="grid content-start gap-0.5 overflow-y-auto px-3 pb-4">
          {NAV.map((item) => {
            const current = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-[0.9375rem] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-on-forest motion-reduce:transition-none ${
                  current ? "bg-on-forest/10 font-semibold text-on-forest" : "text-on-forest/80 hover:bg-on-forest/6 hover:text-on-forest"
                }`}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto grid gap-0.5 border-t border-on-forest/15 px-3 py-3">
          <Link
            href="/dashboard"
            className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-[0.9375rem] text-on-forest/80 transition-colors duration-150 hover:bg-on-forest/10 hover:text-on-forest focus-visible:outline-2 focus-visible:outline-on-forest motion-reduce:transition-none"
          >
            <Icon name="home" />
            Painel do casal
          </Link>
          <AdminSignOut />
        </div>
      </aside>

      {/* Topo (celular/tablet) */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 bg-forest px-4 text-on-forest lg:hidden">
        <Wordmark size="text-[1.5rem]" />
        <AdminSignOut compact />
      </div>

      <div className="pb-24 lg:pb-0 lg:pl-64">
        <header className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pb-6 pt-7 sm:flex-row sm:items-end sm:justify-between md:px-8 lg:pt-10">
          <div className="min-w-0">
            <h1 className="font-serif text-[1.875rem] leading-[1.1] tracking-[-0.01em] text-balance md:text-[2.375rem]">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-[0.9375rem] leading-6 text-ink-soft">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-12 md:px-8">{children}</main>
      </div>

      {/* Abas inferiores (celular/tablet) */}
      <nav
        aria-label="Administração"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {NAV.map((item) => {
          const current = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-forest ${
                current ? "text-forest" : "text-ink-soft"
              }`}
            >
              <span
                className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-150 motion-reduce:transition-none ${
                  current ? "bg-forest/10" : ""
                }`}
              >
                <Icon name={item.icon} size={20} />
              </span>
              <span className="max-w-full truncate px-0.5">{item.short}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
