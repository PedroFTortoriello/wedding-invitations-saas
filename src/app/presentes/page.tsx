import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { rowToWeddingSite } from "@/lib/wedding";
import { formatCurrency } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

export default async function GiftsPage() {
  const row = await getOwnedWeddingRow();
  if (!row) {
    redirect("/onboarding");
  }

  const site = rowToWeddingSite(row);
  const supabase = await createClient();
  const { data: gifts } = await supabase
    .from("cash_gifts")
    .select("*")
    .eq("wedding_id", row.id)
    .order("created_at", { ascending: false });

  const received = gifts ?? [];
  const grossReceived = received
    .filter((gift) => gift.status === "paid")
    .reduce((total, gift) => total + Number(gift.gross_amount), 0);
  const activeGifts = site.gifts.filter((gift) => gift.active);

  return (
    <AppShell
      title="Presentes em dinheiro"
      subtitle="Cotas simbólicas e presentes Pix — 100% para o casal, sem taxa da plataforma."
      active="gifts"
    >
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <article className="card-forest p-6 text-on-forest">
          <p className="t-eyebrow text-on-forest">Modelo</p>
          <h2 className="mt-3 t-h2">0% de taxa · 100% para o casal</h2>
        </article>
        <article className="card p-6">
          <p className="t-eyebrow text-ink-soft">Recebido</p>
          <h2 className="mt-3 t-h2">{formatCurrency(grossReceived)}</h2>
        </article>
        <article className="card p-6">
          <p className="t-eyebrow text-ink-soft">Chave Pix</p>
          <h2 className="mt-3 t-h2 break-all">{site.pixKey || "—"}</h2>
        </article>
      </section>

      <p className="t-eyebrow text-ink-soft">Cotas do site ({activeGifts.length})</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {activeGifts.map((gift) => (
          <article key={gift.id} className="card p-6">
            <p className="t-eyebrow text-ink-soft">Ativo</p>
            <h2 className="mt-3 t-h2">{gift.title}</h2>
            <p className="mt-3 text-sm font-black text-forest">{gift.price}</p>
            <p className="mt-3 min-h-12 text-sm leading-6 text-ink-soft">{gift.description}</p>
          </article>
        ))}
      </div>

      <section className="mt-6 card p-6">
        <p className="t-eyebrow text-ink-soft">Recebimentos</p>
        {received.length === 0 ? (
          <p className="mt-5 text-sm leading-6 text-ink-soft">
            Os presentes em dinheiro enviados pelos convidados aparecem aqui.
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {received.map((gift) => (
              <div
                key={gift.id}
                className="grid gap-3 rounded-3xl bg-[#f7f0e5] p-4 md:grid-cols-[1fr_auto_auto] md:items-center"
              >
                <div>
                  <strong>{gift.guest_name}</strong>
                  <p className="text-sm text-ink-soft">{gift.message ?? "Presente em dinheiro via Pix"}</p>
                </div>
                <span className="text-sm font-black">{formatCurrency(Number(gift.gross_amount))}</span>
                <span className="text-sm font-black text-forest">100% para o casal</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
