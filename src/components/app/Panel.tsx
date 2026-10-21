import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/app/icons";

/** Cabeçalho de painel: título curto em sans + link opcional "ver tudo". */
export function PanelHeader({
  title,
  description,
  href,
  linkLabel,
  aside
}: {
  title: string;
  description?: ReactNode;
  href?: string;
  linkLabel?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-5 text-ink-soft">{description}</p> : null}
      </div>
      {aside}
      {href && linkLabel ? (
        <Link
          href={href}
          className="-mr-1.5 inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-1 text-sm font-semibold text-forest hover:bg-forest/6"
        >
          {linkLabel}
          <Icon name="chevronRight" size={15} />
        </Link>
      ) : null}
    </div>
  );
}

/** Estado vazio que ensina: o que aparece aqui e como chegar lá. */
export function EmptyState({
  icon,
  title,
  children,
  action
}: {
  icon: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-2 px-6 py-12 text-center">
      <span className="grid size-16 place-items-center rounded-full border border-gold/40 p-1.5">
        <span className="grid size-full place-items-center rounded-full bg-forest/8 text-forest">
          <Icon name={icon} size={22} />
        </span>
      </span>
      <p className="mt-2 font-serif text-[1.375rem] leading-tight text-ink text-balance">{title}</p>
      {children ? <p className="max-w-sm text-sm leading-5 text-ink-soft">{children}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter((part) => part.length > 1 && /^[a-zà-ú]/i.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-full bg-forest/8 text-[0.8125rem] font-semibold text-forest"
      aria-hidden
    >
      {initials || "·"}
    </span>
  );
}
