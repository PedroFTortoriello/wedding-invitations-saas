import Link from "next/link";
import { AdminShell } from "@/components/app/AdminShell";
import { StatusBadge } from "@/components/app/StatusBadge";
import { demoWeddings } from "@/lib/platform-data";

export default function AdminWeddingsPage() {
  return (
    <AdminShell title="Casamentos" subtitle="Gerencie sites criados, status de publicação e links públicos." active="weddings">
      <div className="grid gap-4">
        {demoWeddings.map((wedding) => (
          <article key={wedding.id} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="t-h2">{wedding.coupleNames}</h2>
                <p className="mt-2 text-sm text-on-forest">/casamento/{wedding.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={wedding.status} />
                <Link href={`/casamento/${wedding.slug}`} className="rounded-full bg-[#dfe6cc] px-4 py-2 text-sm font-black text-forest">
                  Abrir
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
