import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, shellWedding } from "@/components/app/AppShell";
import { Notice } from "@/components/app/Notice";
import { EmptyState } from "@/components/app/Panel";
import { getActingContext } from "@/lib/acting";
import { logServerError } from "@/lib/funnel";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { rowToWeddingSite } from "@/lib/wedding";
import { GiftCatalog } from "./GiftCatalog";
import { GiftManager, GiftRow } from "./GiftManager";

export const dynamic = "force-dynamic";

export default async function GiftsPage() {
  const ctx = await getActingContext();
  const row = await getOwnedWeddingRow(ctx);
  if (!row) {
    redirect("/onboarding");
  }

  const site = rowToWeddingSite(row);
  const cotas = site.gifts;
  const activeCount = cotas.filter((gift) => gift.active).length;

  // Sem a migration 0018 (ou com erro) a página segue sem o catálogo.
  const { data: catalog, error: catalogError } = await ctx.db
    .from("gift_catalog")
    .select("id, category, title, description, price, image")
    .eq("active", true)
    .order("sort");
  if (catalogError) await logServerError("presentes.catalog", catalogError, { userId: ctx.ownerId, path: "/presentes" });
  const catalogItems = catalog ?? [];
  const hasCatalog = catalogItems.length > 0;

  return (
    <AppShell
      title="Cotas de presente"
      subtitle="O que aparece na lista de presentes do site. No Pix, 100% do valor vai para vocês."
      active="gifts"
      wedding={shellWedding(site)}
      support={ctx.support}
    >
      {site.pixKey ? null : (
        <Notice tone="warn">
          Sem chave Pix, os convidados não conseguem presentear.{" "}
          <Link href="/editor?secao=pix" className="font-semibold underline underline-offset-2">
            Cadastrar a chave Pix
          </Link>
        </Notice>
      )}

      {ctx.support ? (
        <Notice tone="info">Modo suporte: dá para criar e editar cotas, mas remover uma cota fica bloqueado.</Notice>
      ) : null}

      {hasCatalog ? (
        <GiftCatalog
          items={catalogItems}
          addedIds={cotas.flatMap((gift) => (gift.catalogId ? [gift.catalogId] : []))}
          weddingId={row.id}
          defaultOpen={cotas.length === 0}
        />
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="panel min-w-0" aria-labelledby="cotas-title">
          <div className="flex items-baseline justify-between gap-3 px-5 pt-5">
            <h2 id="cotas-title" className="text-base font-semibold">
              No site agora
            </h2>
            {cotas.length ? (
              <span className="text-sm text-ink-soft">
                {activeCount} de {cotas.length} {cotas.length === 1 ? "visível" : "visíveis"}
              </span>
            ) : null}
          </div>

          {cotas.length === 0 ? (
            <EmptyState icon="gift" title="Nenhuma cota criada">
              {hasCatalog ? "Escolha no catálogo acima ou crie a sua" : "Crie a primeira"} em “Nova cota”: uma lua
              de mel, um jantar especial ou um valor livre. Dá para puxar nome, valor e foto de um link de loja.
            </EmptyState>
          ) : (
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {cotas.map((gift) => (
                <GiftRow key={gift.id} gift={gift} templateId={site.templateId} support={Boolean(ctx.support)} />
              ))}
            </ul>
          )}

          <p className="border-t border-line px-5 py-3.5 text-[0.8125rem] leading-5 text-ink-soft">
            Quer aceitar cartão também?{" "}
            <Link href="/dashboard#cartao" className="font-semibold text-forest hover:underline">
              Conecte o Mercado Pago
            </Link>
            . Os valores recebidos ficam em{" "}
            <Link href="/checkout" className="font-semibold text-forest hover:underline">
              Recebimentos
            </Link>
            .
          </p>
        </section>

        <GiftManager templateId={site.templateId} weddingId={row.id} support={Boolean(ctx.support)} />
      </div>
    </AppShell>
  );
}
