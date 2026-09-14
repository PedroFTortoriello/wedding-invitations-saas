import { AdminShell } from "@/components/app/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setUserRoleAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await requireAdmin();
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
          {users.map((user) => {
            const isAdmin = user.role === "admin";
            return (
              <article key={user.id} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="t-h2">{user.name || "—"}</h2>
                    <p className="mt-2 text-sm text-on-forest">{user.email ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[#dfe6cc] px-3 py-1 t-eyebrow text-forest">{user.role}</span>
                    {user.id === me.id ? (
                      <span className="text-xs text-on-forest/70">você</span>
                    ) : (
                      <form action={setUserRoleAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value={isAdmin ? "client" : "admin"} />
                        <button
                          type="submit"
                          className="rounded-full border border-white/20 px-4 py-2 text-sm font-black text-on-forest transition hover:bg-white/10"
                        >
                          {isAdmin ? "Remover admin" : "Tornar admin"}
                        </button>
                      </form>
                    )}
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
