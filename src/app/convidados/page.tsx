import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { StatusBadge } from "@/components/app/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { addGuestsAction, removeGuestAction } from "./actions";

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
  const confirmed = guestList.filter((guest) => guest.status === "confirmed").length;

  return (
    <AppShell
      title="Convidados e RSVP"
      subtitle="Monte a lista de convidados. No site, cada pessoa confirma presença digitando o nome — só quem está na lista consegue confirmar."
      active="guests"
    >
      <section className="card p-6">
        <p className="t-eyebrow text-ink-soft">Adicionar à lista</p>
        <h2 className="mt-3 t-h1">Novos convidados</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Um nome por linha. Cole a lista inteira de uma vez, se quiser.
        </p>
        <form action={addGuestsAction} className="mt-5 grid gap-3">
          <textarea
            name="names"
            rows={5}
            required
            placeholder={"Mariana Souza\nLucas Ferreira\nTia Ana"}
            className="rounded-2xl border border-[#5b6842]/14 bg-white p-4 text-ink"
          />
          <button type="submit" className="btn btn-primary min-h-12 justify-self-start px-6">
            Adicionar à lista
          </button>
        </form>
      </section>

      <section className="card mt-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="t-eyebrow text-ink-soft">Lista de convidados</p>
            <h2 className="mt-3 t-h1">Controle de presença</h2>
          </div>
          <span className="t-eyebrow text-ink-soft">
            {confirmed}/{guestList.length} confirmado(s)
          </span>
        </div>

        {guestList.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-[#f7f0e5] p-6 text-sm leading-6 text-ink-soft">
            Sua lista está vazia. Adicione os convidados acima — depois eles confirmam presença pelo site.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-3 text-left">
              <thead className="t-eyebrow text-ink-soft">
                <tr>
                  <th className="px-4">Nome</th>
                  <th className="px-4">Status</th>
                  <th className="px-4">Acompanhantes</th>
                  <th className="px-4" />
                </tr>
              </thead>
              <tbody>
                {guestList.map((guest) => (
                  <tr key={guest.id} className="bg-[#f7f0e5]">
                    <td className="rounded-l-2xl px-4 py-4 font-bold">{guest.name}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={guest.status} />
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {guest.companions_confirmed}/{guest.companions_allowed}
                    </td>
                    <td className="rounded-r-2xl px-4 py-4 text-right">
                      <form action={removeGuestAction}>
                        <input type="hidden" name="id" value={guest.id} />
                        <button
                          type="submit"
                          className="text-sm font-bold text-[#8d3d33] underline underline-offset-4"
                          aria-label={`Remover ${guest.name}`}
                        >
                          Remover
                        </button>
                      </form>
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
