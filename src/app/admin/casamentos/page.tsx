import Link from "next/link";
import { AdminShell } from "@/components/app/AdminShell";
import { StatusBadge } from "@/components/app/StatusBadge";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminWeddingsPage() {
  const supabase = await createClient();
  const { data: weddings } = await supabase
    .from("weddings")
    .select("id, slug, status, couple_names, publish_paid_at, created_at")
    .order("created_at", { ascending: false });

  const list = weddings ?? [];

  return (
    <AdminShell
      title="Casamentos"
      subtitle="Sites criados, status de publicação e links públicos."
      active="weddings"
    >
      {list.length === 0 ? (
        <p className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5 text-sm text-on-forest">
          Nenhum casamento criado ainda.
        </p>
      ) : (
        <div className="grid gap-4">
          {list.map((wedding) => (
            <article key={wedding.id} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="t-h2">{wedding.couple_names}</h2>
                  <p className="mt-2 text-sm text-on-forest">
                    /casamento/{wedding.slug}
                    {wedding.publish_paid_at ? " · taxa paga" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={wedding.status} />
                  <Link
                    href={`/casamento/${wedding.slug}`}
                    className="rounded-full bg-[#dfe6cc] px-4 py-2 text-sm font-black text-forest"
                  >
                    Abrir
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
