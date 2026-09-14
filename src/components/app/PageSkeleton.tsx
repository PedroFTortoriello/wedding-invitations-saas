import { AppShell } from "@/components/app/AppShell";

type PageSkeletonProps = {
  title: string;
  subtitle: string;
  active: string;
};

/**
 * Esqueleto das páginas do painel, usado nos loading.tsx. As páginas são
 * force-dynamic: sem este fallback o clique "congela" até o servidor terminar de
 * buscar os dados. Com ele, a moldura do AppShell (mesmo título e aba ativa)
 * aparece na hora e só o miolo espera — e o <Link> já pré-busca este esqueleto.
 */
export function PageSkeleton({ title, subtitle, active }: PageSkeletonProps) {
  return (
    <AppShell title={title} subtitle={subtitle} active={active}>
      <div role="status" className="grid animate-pulse gap-6 motion-reduce:animate-none">
        <span className="sr-only">Carregando…</span>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <SkeletonCard key={item} lines={1} />
          ))}
        </div>
        <SkeletonCard lines={3} tall />
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    </AppShell>
  );
}

function SkeletonCard({ lines, tall = false }: { lines: number; tall?: boolean }) {
  return (
    <div className={`card p-6 ${tall ? "min-h-56" : ""}`} aria-hidden>
      <div className="h-3 w-24 rounded-full bg-[#5b6842]/16" />
      <div className="mt-4 h-7 w-2/5 rounded-full bg-[#5b6842]/12" />
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="mt-3 h-3 w-4/5 rounded-full bg-[#5b6842]/10" />
      ))}
    </div>
  );
}
