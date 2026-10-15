import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CopyLink } from "@/components/app/CopyLink";
import { Icon } from "@/components/app/icons";
import { StatusBadge } from "@/components/app/StatusBadge";

export type SiteCardData = {
  slug: string;
  coupleNames: string;
  dateLabel: string;
  heroImage: string;
  /** URL absoluta do site (/casamento/<slug>). */
  url: string;
};

/**
 * Cartão do site: capa, nomes do casal, data e endereço. Server e client.
 * `row`: capa ao lado do texto — mais baixo, para caber a lista e o preço na tela.
 */
export function SiteCard({ site, status, row = false }: { site: SiteCardData; status: string; row?: boolean }) {
  return (
    <article className={`panel overflow-hidden ${row ? "grid grid-cols-[6.5rem_minmax(0,1fr)] sm:grid-cols-[15rem_minmax(0,1fr)]" : ""}`}>
      <div className={`relative bg-bg-2 ${row ? "min-h-36 sm:min-h-48" : "aspect-[16/10]"}`}>
        {site.heroImage ? (
          <Image
            src={site.heroImage}
            alt="Foto de capa do site"
            fill
            sizes={row ? "(min-width: 640px) 15rem, 6.5rem" : "(min-width: 1024px) 36rem, 100vw"}
            className="object-cover"
            priority
          />
        ) : null}
        {/* Fundo sólido: os tons translúcidos do selo somem sobre a foto. */}
        <span className={`absolute left-3 top-3 rounded-full bg-surface ${row ? "hidden sm:block" : ""}`}>
          <StatusBadge status={status} />
        </span>
      </div>
      <div className={`p-5 sm:p-6 ${row ? "self-center" : ""}`}>
        <h2 className="font-serif text-[1.75rem] italic leading-[1.05] tracking-[-0.015em] text-balance sm:text-[2.5rem]">
          {site.coupleNames}
        </h2>
        <p className="mt-2 flex items-center gap-1.5 text-[0.9375rem] text-ink">
          <Icon name="calendar" size={17} className="text-ink-soft" />
          {site.dateLabel || "Data a definir"}
        </p>
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-ink-soft">
          <Icon name="link" size={16} className="shrink-0" />
          <span className="truncate">/casamento/{site.slug}</span>
        </p>
      </div>
    </article>
  );
}

/** Estado de acompanhamento/sucesso: texto à esquerda, o site à direita (empilha no celular). */
export function StatusLayout({ site, status, children }: { site: SiteCardData; status: string; children: ReactNode }) {
  return (
    <main className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:px-8 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:content-center lg:gap-16 lg:py-16">
      <div className="hero-rise">{children}</div>
      <div className="hero-rise [animation-delay:120ms]">
        <SiteCard site={site} status={status} />
      </div>
    </main>
  );
}

/** "Seu site está no ar": copiar link, enviar no WhatsApp, ver o site, voltar ao painel. */
export function LiveNow({ site, title }: { site: SiteCardData; title: ReactNode }) {
  const shareText = encodeURIComponent(`Nosso site de casamento está no ar: ${site.url}`);
  return (
    <>
      <span className="grid size-12 place-items-center rounded-full bg-forest text-on-forest">
        <Icon name="heart" size={22} />
      </span>
      <h1 className="mt-5 t-h1 text-balance">{title}</h1>
      <p className="mt-4 max-w-md text-base leading-7 text-ink-soft">
        O link já funciona para os convidados. Enviem no WhatsApp, coloquem no convite e acompanhem as confirmações
        pelo painel.
      </p>
      <div className="mt-7 grid gap-3">
        <CopyLink url={site.url} label="Link do site" />
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primary"
          >
            <Icon name="whatsapp" size={16} />
            Enviar no WhatsApp
          </a>
          <Link href={`/casamento/${site.slug}`} className="btn btn-sm btn-secondary">
            Ver meu site
            <Icon name="chevronRight" size={16} />
          </Link>
          <Link href="/dashboard" className="btn btn-sm btn-ghost">
            Voltar ao painel
          </Link>
        </div>
      </div>
    </>
  );
}
