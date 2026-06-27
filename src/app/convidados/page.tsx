import { AppShell } from "@/components/app/AppShell";
import { StatusBadge } from "@/components/app/StatusBadge";
import { demoGuests } from "@/lib/platform-data";

export default function GuestsPage() {
  return (
    <AppShell
      title="Convidados e RSVP"
      subtitle="Gerencie convidados, acompanhantes, restricoes alimentares e confirmacoes recebidas."
      active="guests"
    >
      <section className="rounded-[1.6rem] border border-[#5b6842]/12 bg-[#fffaf1] p-6 shadow-[0_18px_52px_rgba(53,64,34,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-ink-soft">Lista RSVP</p>
            <h2 className="mt-3 font-serif text-5xl leading-none">Controle de presença</h2>
          </div>
          <button className="rounded-full bg-[#354022] px-5 py-3 text-sm font-black text-white" type="button">
            Adicionar convidado
          </button>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-3 text-left">
            <thead className="text-xs font-black uppercase tracking-[0.2em] text-ink-soft">
              <tr>
                <th className="px-4">Nome</th>
                <th className="px-4">Contato</th>
                <th className="px-4">Status</th>
                <th className="px-4">Acompanhantes</th>
                <th className="px-4">Restricao</th>
              </tr>
            </thead>
            <tbody>
              {demoGuests.map((guest) => (
                <tr key={guest.id} className="bg-[#f7f0e5]">
                  <td className="rounded-l-2xl px-4 py-4 font-bold">{guest.name}</td>
                  <td className="px-4 py-4 text-sm text-ink-soft">{guest.contact}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={guest.status} />
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {guest.companionsConfirmed}/{guest.companionsAllowed}
                  </td>
                  <td className="rounded-r-2xl px-4 py-4 text-sm text-ink-soft">{guest.dietaryRestriction ?? guest.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
