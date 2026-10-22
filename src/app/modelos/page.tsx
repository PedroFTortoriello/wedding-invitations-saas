import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fechamento, Footer } from "@/components/landing/Footer";
import { LandingNav } from "@/components/landing/LandingNav";
import { IPhone } from "@/components/landing/Modelos";
import { LANDING_FONTS, demoPath } from "@/components/landing/showcase";
import { templateAsset } from "@/lib/template-assets";
import {
  ACTIVE_TEMPLATES,
  TEMPLATE_FAMILIES,
  TEMPLATE_STYLES,
  templatesOfFamily,
  type TemplateFamilyId,
  type TemplateStyle
} from "@/lib/templates/catalog";

export const metadata: Metadata = {
  title: "Modelos de site de casamento",
  description:
    "A biblioteca de modelos da Noivar: editoriais, botânicos, minimalistas, clássicos, destination, românticos, artísticos, modernos, campestres e brasileiros. Todos personalizáveis, com troca a qualquer momento.",
  alternates: { canonical: "/modelos" }
};

const SCOPE = "vitrine";

/**
 * Filtro sem JS: dois grupos de rádios (família e estilo) e regras :has() que escondem
 * o que não bate. Um cartão tem data-styles="a b c"; uma família some quando nenhum
 * cartão dela sobra. Sem :has() (navegador antigo) tudo fica visível.
 * Os ids são constantes do catálogo, nunca entrada de usuário (vai num <style>).
 */
function filterCss() {
  const root = `[data-vitrine-scope="${SCOPE}"]`;
  const rules: string[] = [];
  for (const family of TEMPLATE_FAMILIES) {
    rules.push(`${root}:has(input[name="familia"][value="${family.id}"]:checked) [data-family]:not([data-family="${family.id}"]){display:none}`);
  }
  for (const style of Object.keys(TEMPLATE_STYLES)) {
    rules.push(`${root}:has(input[name="estilo"][value="${style}"]:checked) [data-styles]:not([data-styles~="${style}"]){display:none}`);
    rules.push(`${root}:has(input[name="estilo"][value="${style}"]:checked) [data-family]:not(:has([data-styles~="${style}"])){display:none}`);
  }
  return rules.join("\n");
}

const CHIP =
  "inline-flex min-h-10 cursor-pointer items-center rounded-full border border-line px-4 text-sm font-semibold text-ink-soft transition-colors duration-150 hover:border-line-strong hover:text-ink has-checked:border-forest has-checked:bg-forest has-checked:text-on-forest has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-forest motion-reduce:transition-none";

function Chips({ name, legend, options }: { name: string; legend: string; options: { value: string; label: string }[] }) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="t-eyebrow mb-2 text-ink-soft">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        <label className={CHIP}>
          <input type="radio" name={name} value="todos" defaultChecked className="sr-only" />
          Todos
        </label>
        {options.map((option) => (
          <label key={option.value} className={CHIP}>
            <input type="radio" name={name} value={option.value} className="sr-only" />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Swatch({ colors }: { colors: readonly string[] }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 gap-1">
      {colors.map((color) => (
        <span key={color} className="size-3 rounded-full border border-ink/15" style={{ background: color }} />
      ))}
    </span>
  );
}

/**
 * Biblioteca pública dos modelos: uma faixa por família, o convite em um iPhone (a
 * página inteira rola no hover, como na landing) e as ações de ver a demo completa ou
 * começar com o modelo. Server component, sem JS.
 */
export default function ModelosPage() {
  const families = TEMPLATE_FAMILIES.filter((family) => templatesOfFamily(family.id).length);

  return (
    <>
      {LANDING_FONTS.map((href) => (
        <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="" />
      ))}
      <LandingNav />
      <main id="conteudo" className="overflow-x-clip bg-bg text-ink">
        <section className="section-tight border-b border-line">
          <div className="wrap lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8">
            <div className="lg:col-span-7">
              <p className="t-eyebrow text-gold-text">Biblioteca de modelos</p>
              <h1 className="t-display mt-3 text-balance">
                Um convite com cara de vocês. <span className="italic">Nenhum parecido com o outro.</span>
              </h1>
            </div>
            <div className="mt-5 lg:col-span-5 lg:mt-0">
              <p className="t-lead">
                {ACTIVE_TEMPLATES.length} modelos em {families.length} famílias, cada um com composição, tipografia e
                paleta próprias. Todos recebem as fotos, os textos, a data, o local, a lista de presentes e a confirmação
                de presença de vocês, e dá para trocar de modelo a qualquer momento sem perder nada.
              </p>
            </div>
          </div>
        </section>

        <div data-vitrine-scope={SCOPE}>
          <style>{filterCss()}</style>

          <section aria-label="Filtros" className="border-b border-line bg-bg-2">
            <div className="wrap grid gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
              <Chips name="familia" legend="Família" options={families.map((f) => ({ value: f.id, label: f.label }))} />
              <Chips
                name="estilo"
                legend="Estilo"
                options={(Object.keys(TEMPLATE_STYLES) as TemplateStyle[]).map((style) => ({ value: style, label: TEMPLATE_STYLES[style] }))}
              />
            </div>
          </section>

          {families.map((family, familyIndex) => (
            <FamilySection key={family.id} id={family.id} label={family.label} blurb={family.blurb} alternate={familyIndex % 2 === 1} />
          ))}
        </div>

        <Fechamento />
      </main>
      <Footer />
    </>
  );
}

function FamilySection({ id, label, blurb, alternate }: { id: TemplateFamilyId; label: string; blurb: string; alternate: boolean }) {
  const templates = templatesOfFamily(id);
  return (
    <section data-family={id} aria-labelledby={`familia-${id}`} className={`border-b border-line py-10 lg:py-14 ${alternate ? "bg-bg-2" : "bg-bg"}`}>
      <div className="wrap">
        <header data-reveal className="max-w-2xl">
          <h2 id={`familia-${id}`} className="t-h1 text-balance">
            {label}
          </h2>
          <p className="mt-2 t-lead text-ink-soft">{blurb}</p>
        </header>

        <ul className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, i) => (
            <li key={template.id} data-styles={template.styles.join(" ")} data-reveal style={{ transitionDelay: `${i * 60}ms` }} className="min-w-0">
              <Link
                href={demoPath(template.id)}
                prefetch={false}
                aria-label={`Abrir o site de exemplo no modelo ${template.name}`}
                className="tour block rounded-xl bg-bg-2 px-8 pb-8 pt-7 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
                style={{ background: `linear-gradient(160deg, ${template.swatch[0]} 0%, ${template.swatch[1]} 100%)` }}
              >
                <IPhone className="mx-auto w-[64%] max-w-[15rem]">
                  <Image src={templateAsset(template.id, "full")} alt="" fill sizes="(min-width: 1024px) 220px, 55vw" />
                </IPhone>
              </Link>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="t-h2">{template.name}</h3>
                  <p className="mt-1 text-[15px] leading-snug text-ink">{template.tagline}</p>
                </div>
                <Swatch colors={template.swatch} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{template.description}</p>
              <p className="mt-2 text-[13px] text-ink-soft">
                <span className="font-semibold text-ink">{template.fonts[0]}</span> · {template.fonts[1]}
                {template.tone === "dark" ? " · fundo escuro" : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link href={demoPath(template.id)} prefetch={false} className="btn btn-primary min-h-11 px-5 text-[15px]">
                  Ver o site completo <span aria-hidden="true">→</span>
                </Link>
                <Link href={`/cadastro?modelo=${template.id}`} prefetch={false} data-cta="modelos" className="btn btn-secondary min-h-11 px-5 text-[15px]">
                  Usar este modelo
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
