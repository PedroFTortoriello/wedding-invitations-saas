import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { StatusBadge } from "@/components/app/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { getOwnedWeddingRow } from "@/lib/wedding-server";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const row = await getOwnedWeddingRow();
  if (!row) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data: guests } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", row.id)
    .order("created_at", { ascending: false });

  const guestList = guests ?? [];

  return (
    <AppShell
      title="Convidados e RSVP"
      subtitle="Acompanhe convidados, acompanhantes, restrições alimentares e confirmações recebidas."
      active="guests"
    >
      <section className="card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="t-eyebrow text-ink-soft">Lista RSVP</p>
            <h2 className="mt-3 t-h1">Controle de presença</h2>
          </div>
          <span className="t-eyebrow text-ink-soft">{guestList.length} convidado(s)</span>
        </div>

        {guestList.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-[#f7f0e5] p-6 text-sm leading-6 text-ink-soft">
            Ainda não há confirmações. Quando os convidados responderem ao RSVP no site, eles aparecem aqui.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-3 text-left">
              <thead className="t-eyebrow text-ink-soft">
                <tr>
                  <th className="px-4">Nome</th>
                  <th className="px-4">Contato</th>
                  <th className="px-4">Status</th>
                  <th className="px-4">Acompanhantes</th>
                  <th className="px-4">Restrição</th>
                </tr>
              </thead>
              <tbody>
                {guestList.map((guest) => (
                  <tr key={guest.id} className="bg-[#f7f0e5]">
                    <td className="rounded-l-2xl px-4 py-4 font-bold">{guest.name}</td>
                    <td className="px-4 py-4 text-sm text-ink-soft">{guest.contact ?? "—"}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={guest.status} />
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {guest.companions_confirmed}/{guest.companions_allowed}
                    </td>
                    <td className="rounded-r-2xl px-4 py-4 text-sm text-ink-soft">
                      {guest.dietary_restriction ?? guest.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
