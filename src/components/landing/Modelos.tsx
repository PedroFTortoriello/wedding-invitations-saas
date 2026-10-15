import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { SHOWCASE, demoPath, modeloAsset, switchCss, type ShowcaseId } from "@/components/landing/showcase";

const SCOPE = "modelos";
const HOST = new URL(process.env.APP_URL || "http://localhost:3000").host;

function Swatch({ colors }: { colors: readonly string[] }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 gap-1">
      {colors.map((color) => (
        <span key={color} className="size-3 rounded-full border border-ink/15" style={{ background: color }} />
      ))}
    </span>
  );
}

/** MacBook prata com a barra do navegador mostrando o endereço que o casal recebe. */
function MacBook({ children }: { children: ReactNode }) {
  return (
    <div className="macbook">
      <div className="macbook-lid">
        <div className="macbook-screen">
          <div className="macbook-bar" aria-hidden="true">
            <span className="macbook-lights">
              <i />
              <i />
              <i />
            </span>
            <span className="macbook-url">
              <svg viewBox="0 0 12 14" width="8" height="9" fill="currentColor" className="shrink-0">
                <path d="M3 6V4a3 3 0 0 1 6 0v2h.5A1.5 1.5 0 0 1 11 7.5v5A1.5 1.5 0 0 1 9.5 14h-7A1.5 1.5 0 0 1 1 12.5v-5A1.5 1.5 0 0 1 2.5 6H3Zm1.5 0h3V4a1.5 1.5 0 0 0-3 0v2Z" />
              </svg>
              <span>{HOST}/casamento/helena-e-lucas</span>
            </span>
          </div>
          <div className="macbook-view">{children}</div>
        </div>
      </div>
      <div className="macbook-base" />
    </div>
  );
}

function IPhone({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`iphone ${className}`}>
      <div className="iphone-frame">
        <div className="iphone-screen">{children}</div>
      </div>
    </div>
  );
}

function Actions({ id, label }: { id: ShowcaseId; label: string }) {
  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
      <Link
        href={demoPath(id)}
        prefetch={false}
        aria-label={`Ver o site completo no modelo ${label}`}
        className="btn btn-primary min-h-11 px-5 text-[15px]"
      >
        Ver o site completo <span aria-hidden="true">→</span>
      </Link>
      {/* Hover sobe 2px: transform (não translate) porque o .btn já transiciona
          transform e o reduced motion global zera .btn:hover. */}
      <Link
        href={`/cadastro?modelo=${id}`}
        prefetch={false}
        data-cta="modelos"
        className="btn btn-secondary min-h-11 px-5 text-[15px] hover:transform-[translateY(-2px)]"
      >
        Usar este modelo
      </Link>
    </div>
  );
}

const demoLabel = (label: string) => `Abrir o site de exemplo no modelo ${label}`;

/**
 * Modelos — o visitante escolhe um visual e abre a demo completa. Server component, sem JS:
 *   desktop  rádios (data-template-switch) + MacBook e iPhone; as regras :has() de switchCss
 *            mostram só os [data-tpl] do marcado. Os aparelhos são um link para a demo e,
 *            no hover/foco (.tour), a página inteira do modelo rola nas duas telas.
 *   mobile   .snap-row com um iPhone por modelo (sem data-tpl), cada um levando à demo.
 * Os dois blocos usam display:none por breakpoint; imagens lazy ocultas não baixam.
 * "Usar este modelo" tem href fixo por modelo, então não leva data-cta-modelo.
 * Proibido na copy: número de modelos, "Novo", "flagship".
 */
export function Modelos() {
  return (
    <section id="modelos" aria-labelledby="modelos-titulo" className="bg-bg py-12 text-ink lg:py-24">
      <div className="wrap">
        <div data-reveal className="lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8">
          <h2 id="modelos-titulo" className="t-h1 text-balance lg:col-span-7">
            Escolham o modelo. <span className="italic">Troquem quando quiserem.</span>
          </h2>
          <p className="mt-4 t-lead lg:col-span-5 lg:mt-0">
            Todos pelo mesmo preço. Na troca, textos e fotos continuam, por isso vocês veem aqui o mesmo casamento em
            cada modelo.
          </p>
        </div>

        {/* Desktop: rádios (1–4), aparelhos e ações (5–12). */}
        <div data-tpl-scope={SCOPE} data-reveal className="mt-14 hidden lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-10">
          <style>{switchCss(SCOPE, SHOWCASE.map((t) => t.id))}</style>

          <div className="lg:col-span-4">
            <fieldset data-template-switch={SCOPE} className="m-0 min-w-0 border-0 p-0">
              <legend className="sr-only">Escolham um modelo</legend>
              {SHOWCASE.map((t, i) => (
                <label
                  key={t.id}
                  className="block cursor-pointer border-l-2 border-transparent py-3.5 pl-5 text-ink-soft transition-colors duration-150 hover:text-ink has-checked:border-forest has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-forest motion-reduce:transition-none"
                >
                  <input type="radio" name="modelos-modelo" value={t.id} defaultChecked={i === 0} className="sr-only" />
                  <span className="flex items-center justify-between gap-4">
                    <span className="t-h2">{t.label}</span>
                    <Swatch colors={t.swatch} />
                  </span>
                  <span className="mt-1 block text-[15px] leading-snug">{t.tagline}</span>
                </label>
              ))}
            </fieldset>
          </div>

          <div className="lg:col-span-8">
            {SHOWCASE.map((t) => {
              const id = t.id as ShowcaseId;
              return (
                <div
                  key={id}
                  data-tpl={id}
                  className="motion-safe:transition-opacity motion-safe:duration-180 motion-safe:starting:opacity-0"
                >
                  <Link
                    href={demoPath(id)}
                    prefetch={false}
                    aria-label={demoLabel(t.label)}
                    className="tour relative block rounded-xl pb-[2%] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-forest"
                  >
                    <div className="w-[92%]">
                      <MacBook>
                        <Image src={modeloAsset(id, "desktop-full")} alt="" fill sizes="(min-width: 1280px) 620px, 48vw" />
                      </MacBook>
                    </div>
                    <IPhone className="absolute bottom-0 right-0 w-[21%]">
                      <Image src={modeloAsset(id, "mobile-full")} alt="" fill sizes="(min-width: 1280px) 160px, 13vw" />
                    </IPhone>
                  </Link>
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
                    <Actions id={id} label={t.label} />
                    {/* A rolagem só existe com mouse e sem reduced motion (globals.css .tour). */}
                    <p className="max-w-[17rem] text-sm leading-snug text-ink-soft">
                      <span className="hidden [@media(hover:hover)]:motion-safe:inline">
                        Passem o mouse nas telas para percorrer o site inteiro, ou cliquem para abrir.
                      </span>
                      <span className="[@media(hover:hover)]:motion-safe:hidden">Cliquem nas telas para abrir o site completo.</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: carrossel scroll-snap sem JS, fora do .wrap. py-1: o overflow do .snap-row
          cortaria o anel de foco (2px + offset 2px) dos botões. */}
      <ul className="snap-row mt-7 list-none py-1 lg:hidden" aria-label="Modelos">
        {SHOWCASE.map((t, i) => {
          const id = t.id as ShowcaseId;
          return (
            <li key={id} data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
              {/* Atalho de toque: "Ver o site completo" logo abaixo é o link acessível. */}
              <Link
                href={demoPath(id)}
                prefetch={false}
                tabIndex={-1}
                aria-hidden="true"
                className="flex justify-center rounded-md bg-bg-2 px-6 pb-8 pt-6"
              >
                <IPhone className="w-[62%]">
                  {/* Primeira tela do modelo no celular: o mesmo arquivo do hero (cache compartilhado). */}
                  <Image src={`/assets/landing/capa/${id}-phone.webp`} alt="" fill sizes="(min-width: 768px) 240px, 46vw" />
                </IPhone>
              </Link>
              <div className="mt-3 flex items-center justify-between gap-3">
                <h3 className="t-h2">{t.label}</h3>
                <Swatch colors={t.swatch} />
              </div>
              <p className="mt-1 text-[15px] leading-snug text-ink-soft">{t.tagline}</p>
              <div className="mt-4">
                <Actions id={id} label={t.label} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
