import Link from "next/link";
import { platformName } from "@/lib/platform-data";

type AdminShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  active?: string;
};

const adminNav = [
  { href: "/admin", label: "Dashboard", key: "dashboard" },
  { href: "/admin/usuarios", label: "Usuarios", key: "users" },
  { href: "/admin/casamentos", label: "Casamentos", key: "weddings" },
  { href: "/admin/templates", label: "Modelos", key: "templates" },
  { href: "/admin/pacotes", label: "Receita Pix", key: "cash-gifts" }
];

export function AdminShell({ children, title, subtitle, active }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#2c231e] text-on-forest">
      <header className="border-b border-white/10 px-4 py-5 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="font-serif text-4xl italic">
              {platformName} Admin
            </Link>
            <h1 className="mt-5 font-serif text-6xl italic leading-none">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-forest">{subtitle}</p>
          </div>
          <nav className="flex gap-2 overflow-x-auto">
            {adminNav.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
                  active === item.key ? "bg-[#dfe6cc] text-forest" : "bg-white/10 text-on-forest"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
