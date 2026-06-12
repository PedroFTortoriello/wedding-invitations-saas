import Link from "next/link";
import { platformName } from "@/lib/platform-data";

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  active?: string;
};

const navItems = [
  { href: "/dashboard", label: "Visão geral", key: "dashboard" },
  { href: "/onboarding", label: "Onboarding", key: "onboarding" },
  { href: "/editor", label: "Editor", key: "editor" },
  { href: "/convidados", label: "Convidados", key: "guests" },
  { href: "/presentes", label: "Presentes", key: "gifts" },
  { href: "/mensagens", label: "Mensagens", key: "messages" },
  { href: "/checkout", label: "Presentes em dinheiro", key: "cash-gifts" }
];

export function AppShell({ children, title, subtitle, active }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f0e5] text-[#332820]">
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-72 border-r border-[#5b6842]/10 bg-[#fffaf1]/92 p-5 shadow-[18px_0_60px_rgba(53,64,34,0.08)] backdrop-blur lg:block">
        <Link href="/" className="font-serif text-4xl italic">
          {platformName}
        </Link>
        <p className="mt-2 text-sm leading-6 text-[#5f5148]">SaaS premium para sites editoriais de casamento.</p>
        <nav className="mt-9 grid gap-2">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                active === item.key ? "bg-[#354022] text-white" : "text-[#5f5148] hover:bg-[#5b6842]/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/casamento/pedro-e-rafaela"
          className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#5b6842]/15 bg-white/60 text-sm font-black text-[#354022]"
        >
          Ver site publicado
        </Link>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#5b6842]/10 bg-[#f7f0e5]/88 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.34em] text-[#5b6842]">{platformName}</p>
              <h1 className="mt-2 font-serif text-5xl italic leading-none md:text-6xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5148]">{subtitle}</p>
            </div>
            <div className="flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
                    active === item.key ? "bg-[#354022] text-white" : "bg-[#fffaf1] text-[#5f5148]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
