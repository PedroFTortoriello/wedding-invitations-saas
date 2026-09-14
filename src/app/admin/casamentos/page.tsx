import Link from "next/link";
import { AdminShell } from "@/components/app/AdminShell";
import { StatusBadge } from "@/components/app/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { releasePublicationAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminWeddingsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: weddings } = await supabase
    .from("weddings")
    .select("id, slug, status, couple_names, publish_paid_at, created_at, owner_id")
    .order("created_at", { ascending: false });

  const list = weddings ?? [];

  // E-mail do dono por casamento — para localizar o casal pelo e-mail ao liberar.
  const ownerIds = [...new Set(list.map((w) => w.owner_id))];
  const owners = ownerIds.length
    ? (await supabase.from("profiles").select("id, email").in("id", ownerIds)).data ?? []
    : [];
  const emailByOwner = new Map(owners.map((o) => [o.id, o.email]));

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
          {list.map((wedding) => {
            const isPublished = wedding.status === "published";
            const ownerEmail = emailByOwner.get(wedding.owner_id);
            return (
              <article key={wedding.id} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="t-h2">{wedding.couple_names}</h2>
                    {ownerEmail ? <p className="mt-2 text-sm text-on-forest/85">{ownerEmail}</p> : null}
                    <p className="mt-1 text-sm text-on-forest/70">
                      /casamento/{wedding.slug}
                      {wedding.publish_paid_at ? " · taxa quitada" : " · taxa em aberto"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={wedding.status} />
                    {!isPublished ? (
                      <form action={releasePublicationAction}>
                        <input type="hidden" name="weddingId" value={wedding.id} />
                        <button
                          type="submit"
                          className="rounded-full bg-[#dfe6cc] px-4 py-2 text-sm font-black text-forest transition hover:brightness-95"
                        >
                          Liberar publicação
                        </button>
                      </form>
                    ) : null}
                    <Link
                      href={`/casamento/${wedding.slug}`}
                      className="rounded-full border border-white/20 px-4 py-2 text-sm font-black text-on-forest transition hover:bg-white/10"
                    >
                      Abrir
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
