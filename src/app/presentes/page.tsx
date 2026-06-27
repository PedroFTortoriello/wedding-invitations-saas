import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { rowToWeddingSite } from "@/lib/wedding";
import { formatCurrency } from "@/lib/platform-data";
import { GiftManager } from "./GiftManager";
import { removeGiftAction, toggleGiftAction } from "./actions";

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

  const cotas = site.gifts;
  const activeCount = cotas.filter((gift) => gift.active).length;

  return (
    <AppShell
      title="Presentes em dinheiro"
      subtitle="Crie as cotas do seu site. Os presentes via Pix vão 100% para o casal, sem taxa da plataforma."
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
          {site.pixKey ? null : (
            <p className="mt-2 text-sm leading-6 text-ink-soft">Configure sua chave Pix no editor para receber.</p>
          )}
        </article>
      </section>

      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <GiftManager />

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <p className="t-eyebrow text-ink-soft">Cotas do site</p>
            <span className="t-eyebrow text-ink-soft">{activeCount} ativa(s)</span>
          </div>

          {cotas.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-[#f7f0e5] p-5 text-sm leading-6 text-ink-soft">
              Você ainda não criou nenhuma cota. Adicione a primeira no formulário ao lado — pode ser uma lua de mel,
              um jantar especial ou uma cota de valor livre.
            </p>
          ) : (
            <ul className="mt-5 grid gap-3">
              {cotas.map((gift) => (
                <li
                  key={gift.id}
                  className="grid gap-3 rounded-3xl bg-[#f7f0e5] p-4 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="truncate text-ink">{gift.title}</strong>
                      {gift.active ? null : (
                        <span className="rounded-full bg-[#5b6842]/12 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.14em] text-ink-soft">
                          Oculta
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-black text-forest">{gift.price}</p>
                    {gift.description ? <p className="mt-1 text-sm leading-6 text-ink-soft">{gift.description}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <form action={toggleGiftAction}>
                      <input type="hidden" name="giftId" value={gift.id} />
                      <button type="submit" className="btn btn-secondary min-h-10 px-4 text-sm">
                        {gift.active ? "Ocultar" : "Ativar"}
                      </button>
                    </form>
                    <form action={removeGiftAction}>
                      <input type="hidden" name="giftId" value={gift.id} />
                      <button type="submit" className="btn btn-secondary min-h-10 px-4 text-sm">
                        Remover
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 card p-6">
        <p className="t-eyebrow text-ink-soft">Recebimentos</p>
        {received.length === 0 ? (
          <p className="mt-5 text-sm leading-6 text-ink-soft">
            Os presentes em dinheiro enviados pelos convidados aparecem aqui (confirme o recebimento em “Presentes em dinheiro”).
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
