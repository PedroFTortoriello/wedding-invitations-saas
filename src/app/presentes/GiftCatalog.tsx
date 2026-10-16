"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/app/icons";
import { formatBRL } from "@/lib/gift-price";
import type { Database } from "@/lib/supabase/types";
import { addCatalogGiftAction, type GiftActionState } from "./actions";

export type CatalogItem = Pick<
  Database["public"]["Tables"]["gift_catalog"]["Row"],
  "id" | "category" | "title" | "description" | "price" | "image"
>;

const initial: GiftActionState = {};

/** Catálogo de cotas prontas em /presentes: categorias + grade, "Adicionar" com um clique. */
export function GiftCatalog({
  items,
  addedIds,
  weddingId,
  defaultOpen
}: {
  items: CatalogItem[];
  /** catalogId das cotas que o casal já tem: o card mostra "Na lista". */
  addedIds: string[];
  weddingId: string;
  /** Lista vazia: o catálogo já abre aberto. */
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const categories = [...new Set(items.map((item) => item.category))];
  const [category, setCategory] = useState(categories[0]);
  const added = new Set(addedIds);
  const visible = items.filter((item) => item.category === category);

  return (
    <section className="panel mb-5 overflow-hidden" aria-labelledby="catalog-title">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-text">Catálogo</p>
          <h2 id="catalog-title" className="mt-1 text-base font-semibold text-ink">
            Escolher do catálogo
          </h2>
          <p className="mt-0.5 text-sm leading-5 text-ink-soft">
            {items.length} cotas prontas, com foto e valor sugerido. Adicione com um clique e ajuste depois.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="catalog-body"
          className={`btn btn-sm shrink-0 ${open ? "btn-ghost" : "btn-secondary"}`}
        >
          {open ? "Fechar catálogo" : "Ver catálogo"}
        </button>
      </div>

      {open ? (
        <div id="catalog-body" className="border-t border-line">
          <div role="group" aria-label="Categorias" className="flex flex-wrap gap-2 px-5 pt-4">
            {categories.map((name) => {
              const count = items.filter((item) => item.category === name).length;
              const current = name === category;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={current}
                  onClick={() => setCategory(name)}
                  className={`min-h-9 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest motion-reduce:transition-none ${
                    current
                      ? "border-forest bg-forest text-on-forest"
                      : "border-line-strong bg-field text-ink hover:border-forest/50"
                  }`}
                >
                  {name} <span className={current ? "text-on-forest/80" : "text-ink-soft"}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* key: trocar de categoria remonta a grade e os cards entram de novo (com stagger). */}
          <ul key={category} className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((item, index) => (
              <CatalogCard
                key={item.id}
                item={item}
                added={added.has(item.id)}
                weddingId={weddingId}
                delay={Math.min(index, 8) * 35}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function CatalogCard({
  item,
  added,
  weddingId,
  delay
}: {
  item: CatalogItem;
  added: boolean;
  weddingId: string;
  delay: number;
}) {
  const [state, formAction, pending] = useActionState(addCatalogGiftAction, initial);
  const price = item.price ? formatBRL(Number(item.price)) : "Valor livre";

  return (
    <li
      className="transition-[opacity,translate] duration-300 ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-field transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgb(26_30_21/0.09)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
        <div className="relative aspect-4/3 bg-bg-2">
          <Image
            src={item.image}
            alt=""
            fill
            sizes="(min-width: 1280px) 240px, (min-width: 640px) 30vw, 46vw"
            className="object-cover"
          />
          {added ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-forest px-2 py-0.5 text-xs font-semibold text-on-forest">
              <Icon name="check" size={13} />
              Na lista
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="text-sm font-semibold leading-5 text-ink">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-5 text-ink-soft">{item.description}</p>
          <p className="mt-auto pt-2 text-sm font-semibold tabular-nums text-forest">{price}</p>
          {added ? (
            <p className="mt-2 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[0.625rem] bg-forest/8 text-sm font-semibold text-forest">
              <Icon name="check" size={15} />
              Adicionado
            </p>
          ) : (
            <form action={formAction} className="mt-2">
              <input type="hidden" name="weddingId" value={weddingId} />
              <input type="hidden" name="catalogId" value={item.id} />
              <button
                type="submit"
                disabled={pending}
                aria-busy={pending}
                aria-label={`Adicionar ${item.title} à lista`}
                className="btn btn-sm btn-secondary min-h-9 w-full disabled:opacity-60"
              >
                {pending ? (
                  "Adicionando…"
                ) : (
                  <>
                    <Icon name="plus" size={15} />
                    Adicionar
                  </>
                )}
              </button>
            </form>
          )}
          {state.error ? (
            <p role="alert" className="mt-1.5 text-[0.8125rem] font-medium leading-5 text-danger">
              {state.error}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}
