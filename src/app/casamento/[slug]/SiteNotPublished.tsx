import Link from "next/link";
import { platformName } from "@/lib/platform-data";

/**
 * Mesmo visual do 404 global (src/app/not-found.tsx), mas para o slug que EXISTE
 * e ainda não foi publicado — o visitante vê que o endereço está reservado, não
 * um "página não encontrada" seco. Renderizado pela rota pública quando a RLS
 * esconde o rascunho do visitante. Ver getWeddingStatusBySlug.
 */
export function SiteNotPublished({ coupleNames }: { coupleNames?: string }) {
  const who = coupleNames?.trim();
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbf7ef] px-6 text-center text-ink">
      <div className="max-w-xl">
        <p className="mb-4 t-eyebrow text-ink-soft">Site em breve</p>
        <h1 className="t-display italic">O site ainda não foi publicado</h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-7 text-ink-soft">
          {who ? `O convite de ${who} ` : "Este convite "}
          está a caminho, mas os noivos ainda não concluíram a publicação. O
          endereço já está reservado — volte em breve.
        </p>
        <Link href="/" className="btn btn-primary mt-8 text-sm">
          Conhecer o {platformName}
        </Link>
      </div>
    </main>
  );
}
