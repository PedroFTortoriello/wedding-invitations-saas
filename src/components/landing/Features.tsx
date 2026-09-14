/**
 * Recursos — composição assimétrica (sem grid de cards idênticos). O card de
 * presentes é a âncora escura e alta; RSVP e Recados são cards claros com
 * conteúdo próprio. Server component: reveal no scroll via data-reveal (global)
 * e hover via .card-interactive (CSS) — sem JS de animação.
 */
export function Features() {
  return (
    <section id="recursos" className="section bg-bg-2">
      <div className="wrap">
        <header className="measure" data-reveal>
          <h2 className="text-balance t-h1 italic">Tudo o que o casamento precisa, em um link só.</h2>
          <p className="mt-5 t-lead text-ink">
            Da confirmação de presença aos presentes — sem grupo de WhatsApp, sem planilha,
            sem taxa escondida.
          </p>
        </header>

        <div className="mt-12 grid gap-4 md:grid-cols-2 md:auto-rows-fr">
          {/* Âncora: presentes com 0% de taxa */}
          <div data-reveal className="md:row-span-2">
            <article className="card-forest card-interactive flex h-full flex-col justify-between">
              <div>
                <p className="t-display leading-none text-on-forest">0%</p>
                <h3 className="mt-3 t-h2 italic text-on-forest">de taxa nos presentes</h3>
              </div>
              <p className="mt-8 leading-7 text-on-forest/85">
                Cada presente em dinheiro cai 100% na chave Pix de vocês, direto na conta.
                A plataforma nunca toca no dinheiro — sem intermediário e sem desconto.
              </p>
            </article>
          </div>

          {/* RSVP */}
          <div data-reveal style={{ transitionDelay: "90ms" }}>
            <article className="card card-interactive flex h-full flex-col">
              <h3 className="t-h3">Confirmação de presença</h3>
              <p className="mt-2 leading-7 text-ink-soft">
                Convidados confirmam em segundos e vocês acompanham tudo no painel, em tempo real.
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-6 text-sm font-bold">
                <span className="rounded-full bg-forest/10 px-3 py-1 text-forest">Vou</span>
                <span className="rounded-full bg-forest/10 px-3 py-1 text-forest">Não vou</span>
                <span className="rounded-full bg-forest/10 px-3 py-1 text-forest">Com acompanhante</span>
              </div>
            </article>
          </div>

          {/* Recados */}
          <div data-reveal style={{ transitionDelay: "160ms" }}>
            <article className="card card-interactive flex h-full flex-col">
              <h3 className="t-h3">Recados dos convidados</h3>
              <p className="mt-2 leading-7 text-ink-soft">
                Mensagens carinhosas reunidas num só lugar, prontas para guardar de lembrança.
              </p>
              <figure className="mt-auto border-t border-forest/12 pt-5">
                <blockquote className="font-serif text-lg italic leading-snug text-ink">
                  “Que a vida de vocês seja tão linda quanto esse dia.”
                </blockquote>
                <figcaption className="mt-1 text-sm text-ink-soft">— Tia Lúcia</figcaption>
              </figure>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
