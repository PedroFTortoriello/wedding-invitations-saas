import type { ReactNode } from "react";
import Image from "next/image";
import { SHOWCASE, SHOWCASE_IDS, switchCss, type ShowcaseId } from "./showcase";
import { PUBLISH_FEE_LABEL } from "@/lib/platform-data";
import s from "./capa.module.css";

/**
 * Hero "capa de revista": capa tipográfica centralizada e, embaixo, o produto revelado
 * como foto de capa (computador + celular) pousado na costura creme/forest, que continua
 * nos Passos. Server component. A troca de modelo é só CSS (rádios + switchCss); com JS,
 * o LandingBehavior leva a escolha ao href de [data-cta-modelo]. Sem JS, o CTA leva o
 * modelo inicial.
 */

const VARIANTS = {
  home: {
    initial: "jardim-romantico",
    title: (
      <>
        O site do casamento, <em>com cara de revista.</em>
      </>
    )
  },
  // /lp/presentes: casa com anúncio de Pix.
  presentes: {
    initial: "jardim-romantico",
    title: (
      <>
        O site do casamento em que o Pix chega <em>inteiro.</em>
      </>
    )
  }
} satisfies Record<string, { initial: ShowcaseId; title: ReactNode }>;

/** Alt literal: cada captura mostra uma parte diferente do site. */
const ALT: Record<ShowcaseId, { desktop: string; phone: string }> = {
  "jardim-romantico": {
    desktop:
      "Site de casamento no modelo Jardim Romântico aberto no computador, na seção Nossa história: título um amor que virou casa e foto do casal em moldura de arco",
    phone: "O mesmo site no celular: capa com a foto do casal e os nomes Helena Ribeiro e Lucas Moreira"
  },
  "editorial-luxury": {
    desktop:
      "Site de casamento no modelo Editorial Luxury aberto no computador, na seção Nossa história: título um amor que virou casa e foto do casal em preto e branco",
    phone: "O mesmo site no celular: capa Especial Casamento com os nomes Helena Ribeiro e Lucas Moreira"
  },
  "garden-classico": {
    desktop:
      "Site de casamento no modelo Jardim Clássico aberto no computador: foto do casal em moldura de arco e o título do site em letras altas",
    phone: "O mesmo site no celular: nomes Helena Ribeiro e Lucas Moreira sobre a foto e o botão Confirmar presença"
  },
  "cinema-noir": {
    desktop:
      "Site de casamento no modelo Cinema Noir aberto no computador, em fundo escuro: título um amor que virou casa e foto do casal diante dos faróis de um carro antigo, à noite",
    phone: "O mesmo site no celular: capa escura com a data, os nomes Helena Ribeiro e Lucas Moreira e o local"
  }
};

const capa = (id: ShowcaseId, device: "desktop" | "phone") => `/assets/landing/capa/${id}-${device}.webp`;

export function Hero({ variant = "home" }: { variant?: keyof typeof VARIANTS }) {
  const { initial, title } = VARIANTS[variant];
  // Modelo inicial primeiro: é o que fica sem suporte a :has().
  const ids: ShowcaseId[] = [initial, ...SHOWCASE_IDS.filter((id) => id !== initial)];
  const label = (id: ShowcaseId) => SHOWCASE.find((t) => t.id === id)?.label ?? id;

  return (
    <section id="inicio" data-tpl-scope="hero" aria-labelledby="hero-titulo" className={s.hero}>
      <style dangerouslySetInnerHTML={{ __html: switchCss("hero", ids) }} />
      <div className={`wrap ${s.cover}`}>
        <h1 id="hero-titulo" className={`hero-rise ${s.title}`}>
          {title}
        </h1>
        <p className={`hero-rise ${s.sub}`} style={{ animationDelay: "80ms" }}>
          Confirmação de presença, recados e presentes via Pix num link só.
        </p>

        <dl className={`hero-rise ${s.facts}`} style={{ animationDelay: "160ms" }}>
          <div>
            <dt>Montar e ver o site pronto</dt>
            <dd>R$ 0</dd>
          </div>
          <div>
            <dt>Publicar, uma&nbsp;vez</dt>
            <dd>{PUBLISH_FEE_LABEL}</dd>
          </div>
          <div>
            <dt>Taxa nos presentes via Pix</dt>
            <dd>0%</dd>
          </div>
        </dl>

        <div className={`hero-rise ${s.actions}`} style={{ animationDelay: "240ms" }}>
          {/* <a>, não <Link>: o LandingBehavior reescreve o href com o modelo escolhido. */}
          <a
            id="hero-cta"
            data-cta="hero"
            data-cta-modelo
            href={`/cadastro?modelo=${initial}`}
            className={`btn btn-primary ${s.cta}`}
          >
            Montar nosso site grátis
          </a>
          <p className={s.micro}>
            <span>Não pedimos cartão para começar.</span>
            <a href="#modelos">Ver os modelos</a>
            <a href="#ia">Ou deixem a IA montar</a>
          </p>
        </div>
      </div>

      <div className={s.stage}>
        <fieldset data-template-switch="hero" className={s.switch}>
          <legend>Escolham um modelo</legend>
          {ids.map((id) => {
            const swatch = SHOWCASE.find((t) => t.id === id)?.swatch ?? [];
            return (
              <label key={id} className={s.pill}>
                <input type="radio" name="hero-modelo" value={id} defaultChecked={id === initial} className="sr-only" />
                <span aria-hidden className={s.dots}>
                  {swatch.map((color) => (
                    <i key={color} style={{ background: color }} />
                  ))}
                </span>
                {label(id)}
              </label>
            );
          })}
        </fieldset>

        <div className={s.devices}>
          <div className={s.screen}>
            <p className={s.bar} aria-hidden>
              /casamento/helena-e-lucas
            </p>
            <div className={s.shot}>
              {ids.map((id) => (
                <Image
                  key={id}
                  data-tpl={id}
                  src={capa(id, "desktop")}
                  alt={ALT[id].desktop}
                  width={2160}
                  height={1215}
                  sizes="(min-width: 1180px) 992px, (min-width: 768px) calc(100vw - 10rem), 86vw"
                  {...(id === initial ? { preload: true, fetchPriority: "high" as const } : { className: s.swap })}
                />
              ))}
            </div>
          </div>
          <div className={s.phone}>
            <div className={s.phoneShot}>
              {ids.map((id) => (
                <Image
                  key={id}
                  data-tpl={id}
                  src={capa(id, "phone")}
                  alt={ALT[id].phone}
                  width={640}
                  height={1385}
                  sizes="(min-width: 768px) 220px, 32vw"
                  className={id === initial ? undefined : s.swap}
                />
              ))}
            </div>
          </div>
        </div>

        <p className={s.caption}>
          {ids.map((id) => (
            <span key={id} data-tpl={id}>
              Modelo {label(id)} · fotos e textos de exemplo
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
