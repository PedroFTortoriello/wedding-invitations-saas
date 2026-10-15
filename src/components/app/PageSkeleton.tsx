import { AppShell, type NavKey } from "@/components/app/AppShell";
import { readSupportCookie } from "@/lib/support-session";

type PageSkeletonProps = {
  title: string;
  subtitle?: string;
  active: NavKey;
};

/**
 * Esqueleto das páginas do painel, usado nos loading.tsx. As páginas são
 * force-dynamic: sem este fallback o clique "congela" até o servidor terminar de
 * buscar os dados. Com ele, a moldura do AppShell (mesmo título e aba ativa)
 * aparece na hora e só o miolo espera — e o <Link> já pré-busca este esqueleto.
 */
export async function PageSkeleton({ title, subtitle, active }: PageSkeletonProps) {
  // Modo suporte: a barra não some durante a navegação. Só confere a assinatura (sem banco),
  // então o nome da conta chega com a página.
  const session = await readSupportCookie();
  const support = session
    ? { adminId: session.adminId, targetUserId: session.targetUserId, targetLabel: "…", expiresAt: session.exp }
    : null;
  return (
    <AppShell title={title} subtitle={subtitle} active={active} support={support}>
      <div role="status" className="grid animate-pulse gap-5 motion-reduce:animate-none">
        <span className="sr-only">Carregando…</span>
        <div className="panel h-44" aria-hidden />
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <SkeletonPanel rows={4} />
          <SkeletonPanel rows={3} />
        </div>
      </div>
    </AppShell>
  );
}

function SkeletonPanel({ rows }: { rows: number }) {
  return (
    <div className="panel p-5" aria-hidden>
      <div className="h-4 w-32 rounded bg-forest/10" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="mt-5 flex items-center gap-3">
          <div className="size-9 rounded-full bg-forest/8" />
          <div className="h-3 flex-1 rounded bg-forest/8" />
        </div>
      ))}
    </div>
  );
}
