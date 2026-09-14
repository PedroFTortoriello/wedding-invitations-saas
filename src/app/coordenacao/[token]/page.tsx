import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/app/StatusBadge";
import { MetricCard } from "@/components/app/MetricCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { WEDDING_RENDER_COLUMNS, rowToWeddingSite, type WeddingRenderRow } from "@/lib/wedding";

export const dynamic = "force-dynamic";

/**
 * Painel só-leitura da cerimonialista (Nível 1). Rota pública: resolve o
 * casamento pelo token opaco via service-role (bypass RLS — o token é o
 * segredo). Não expõe Pix, não permite edição, e vale para rascunho/publicado.
 */
export default async function CoordinationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("weddings")
    .select(WEDDING_RENDER_COLUMNS)
    .eq("coordinator_token", token)
    .maybeSingle<WeddingRenderRow>();

  if (!row) notFound();

  const site = rowToWeddingSite(row);
  const [{ data: guests }, { data: messages }] = await Promise.all([
    admin.from("guests").select("*").eq("wedding_id", row.id).order("name", { ascending: true }),
    admin.from("messages").select("*").eq("wedding_id", row.id).order("created_at", { ascending: false })
  ]);

  const guestList = guests ?? [];
  const messageList = messages ?? [];
  const confirmed = guestList.filter((g) => g.status === "confirmed");
  const pending = guestList.filter((g) => g.status === "pending").length;
  // Total de pessoas confirmadas = o convidado + seus acompanhantes confirmados.
  const headcount = confirmed.reduce((n, g) => n + 1 + g.companions_confirmed, 0);

  return (
    <main className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:px-8">
        <header className="grid gap-2">
          <p className="t-eyebrow text-ink-soft">Painel da cerimonialista · somente leitura</p>
          <h1 className="t-h1 italic">{site.coupleNames}</h1>
          <p className="text-sm leading-6 text-ink-soft">
            {site.weddingDateLabel}
            {site.locations[0]?.city ? ` · ${site.locations[0].city}` : ""}
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Confirmados" value={`${confirmed.length}/${guestList.length}`} helper="Convidados que confirmaram presença." />
          <MetricCard label="Total de pessoas" value={String(headcount)} helper="Confirmados + acompanhantes." />
          <MetricCard label="Pendentes" value={String(pending)} helper="Ainda não responderam." />
          <MetricCard label="Recados" value={String(messageList.length)} helper="Mensagens dos convidados." />
        </div>

        {site.locations.some((l) => l.venue || l.city || l.note) ? (
          <section className="card p-6">
            <p className="t-eyebrow text-ink-soft">Locais</p>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {site.locations.map((l) => (
                <li key={l.id} className="border-t border-[#5b6842]/10 pt-4 first:border-0 first:pt-0 md:border-0 md:pt-0">
                  <p className="font-bold text-ink">{l.title || l.venue || "Local"}</p>
                  {l.venue ? <p className="text-sm text-ink-soft">{l.venue}</p> : null}
                  {l.city ? <p className="text-sm text-ink-soft">{l.city}</p> : null}
                  {l.address ? <p className="text-sm text-ink-soft">{l.address}</p> : null}
                  {l.note ? <p className="mt-1 text-sm leading-6 text-ink-soft">{l.note}</p> : null}
                  {l.mapUrl ? (
                    <a
                      href={l.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm font-bold text-forest underline underline-offset-4"
                    >
                      Ver no mapa ↗
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <p className="t-eyebrow text-ink-soft">Convidados</p>
            <span className="t-eyebrow text-ink-soft">
              {confirmed.length}/{guestList.length} confirmado(s)
            </span>
          </div>
          {guestList.length === 0 ? (
            <p className="mt-5 text-sm leading-6 text-ink-soft">A lista de convidados ainda está vazia.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] border-separate border-spacing-y-3 text-left">
                <thead className="t-eyebrow text-ink-soft">
                  <tr>
                    <th className="px-4">Nome</th>
                    <th className="px-4">Status</th>
                    <th className="px-4">Acompanhantes</th>
                    <th className="px-4">Restrição alimentar</th>
                  </tr>
                </thead>
                <tbody>
                  {guestList.map((g) => (
                    <tr key={g.id} className="bg-[#f7f0e5]">
                      <td className="rounded-l-2xl px-4 py-4 font-bold">{g.name}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={g.status} />
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {g.companions_confirmed}/{g.companions_allowed}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4 text-sm text-ink-soft">{g.dietary_restriction || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card p-6">
          <p className="t-eyebrow text-ink-soft">Recados dos convidados</p>
          {messageList.length === 0 ? (
            <p className="mt-5 text-sm leading-6 text-ink-soft">Nenhum recado ainda.</p>
          ) : (
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {messageList.map((m) => (
                <li key={m.id} className="border-t border-[#5b6842]/10 pt-4 first:border-0 first:pt-0 md:border-0 md:pt-0">
                  <p className="text-sm leading-6 text-ink">“{m.message}”</p>
                  <p className="mt-2 text-xs font-bold text-ink-soft">— {m.guest_name}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="pb-4 text-center text-xs text-ink-soft">
          Acesso somente leitura fornecido pelo casal. Para alterações, fale com {site.coupleNames}.
        </p>
      </div>
    </main>
  );
}
