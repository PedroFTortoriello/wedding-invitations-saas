import Link from "next/link";

/**
 * Barra fixa da prévia do rascunho. A RLS só entrega um rascunho ao dono (ou admin),
 * então a rota pública só a monta para quem pode editar — visitante vê SiteNotPublished.
 * z-index acima das navs fixas dos modelos (até 80) e abaixo dos modais (999).
 */
export function DraftPreviewBar() {
  return (
    <>
      {/* Espaço no fim da página: a barra nunca cobre o rodapé do modelo. */}
      <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom))]" />
      <div
        role="region"
        aria-label="Prévia do site"
        className="fixed inset-x-0 bottom-0 z-90 border-t border-on-forest/15 bg-forest pb-[env(safe-area-inset-bottom)] font-sans text-on-forest"
      >
        <div className="mx-auto flex h-16 max-w-300 items-center justify-between gap-3 px-4">
          <p className="min-w-0 text-[0.8125rem] leading-snug sm:text-sm">
            <span className="font-semibold">Prévia:</span> só vocês veem este site.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/editor"
              className="btn btn-sm border border-on-forest/35 bg-transparent px-3.5 text-on-forest hover:bg-on-forest/10 focus-visible:outline-on-forest"
            >
              Editar
            </Link>
            <Link href="/publicar" className="btn btn-sm btn-inverse px-3.5">
              Publicar
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
