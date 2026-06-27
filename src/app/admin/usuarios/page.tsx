import { AdminShell } from "@/components/app/AdminShell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, role, created_at")
    .order("created_at", { ascending: false });

  const users = profiles ?? [];

  return (
    <AdminShell title="Usuários" subtitle="Clientes e administradores cadastrados." active="users">
      {users.length === 0 ? (
        <p className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5 text-sm text-on-forest">
          Nenhum usuário cadastrado ainda.
        </p>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <article key={user.id} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="t-h2">{user.name || "—"}</h2>
                  <p className="mt-2 text-sm text-on-forest">{user.email ?? "—"}</p>
                </div>
                <span className="rounded-full bg-[#dfe6cc] px-3 py-1 t-eyebrow text-forest">{user.role}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
