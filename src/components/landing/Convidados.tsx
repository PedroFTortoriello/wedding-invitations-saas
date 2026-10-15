import Image from "next/image";

const BEATS = [
  {
    title: "Só confirma quem foi convidado.",
    text: "O convidado digita o nome, escolhe na lista de vocês e toca em Confirmar presença. Quem não está na lista não consegue confirmar.",
    caption: "Modelo Editorial Luxury",
    src: "/assets/landing/convidados-confirmacao.webp",
    width: 780,
    height: 932,
    alt: "Seção Confirme sua presença do modelo Editorial Luxury, com o campo Nome completo (Digite para buscar seu nome), o botão Confirmar presença e o link Não poderei ir"
  },
  {
    title: "Data, programação e mapa.",
    // O recorte mostra só a contagem; o texto diz o que mais vem no site.
    text: "Contagem regressiva até o dia. No site também entram os horários do dia e o local com botão para abrir no mapa.",
    caption: "Modelo Jardim Romântico",
    src: "/assets/landing/convidados-agenda.webp",
    width: 780,
    height: 904,
    alt: "Contagem regressiva do modelo Jardim Romântico: faltam 79 dias, 23 horas, 26 minutos e 57 segundos para 5 de dezembro de 2026, às 16:30"
  },
  {
    title: "E deixa um recado.",
    text: "Os recados ficam guardados no painel de vocês, para ler antes, durante e depois do dia.",
    caption: "Modelo Cinema Noir",
    src: "/assets/landing/convidados-recado.webp",
    width: 764,
    height: 888,
    alt: "Formulário Deixe um recado do modelo Cinema Noir, com os campos Seu nome e Recado e o botão Enviar recado"
  }
];

// Degraus do desktop (0/48/96px).
const STEP_OFFSET = ["", "lg:mt-12", "lg:mt-24"];

/**
 * Convidados — "penetra", convidado mais velho e cerimonialista respondidos com
 * UI real dos modelos (nada de chips inventados). Server component.
 * Desktop: texto em 1–4 e os 3 recortes em escada em 5–12. Mobile: .snap-row de
 * 3 slides (a lista vira carrossel com o mesmo markup) e a linha da
 * cerimonialista depois.
 */
export function Convidados() {
  const closing = (
    <>
      <p className="m-0 leading-[1.55]">
        E um link só de leitura para a cerimonialista acompanhar confirmados e recados, sem ver o Pix e sem editar nada.
      </p>
      <p className="mt-3 text-[13px] leading-normal text-ink-soft">Telas reais dos modelos, com dados de demonstração.</p>
    </>
  );

  return (
    <section id="convidados" aria-labelledby="convidados-titulo" className="bg-bg-2 py-12 text-ink lg:py-24">
      {/* No desktop este bloco faz o papel do .wrap (1200px, 40px de respiro); no
          celular o .snap-row precisa da largura total, então o .wrap fica só no texto. */}
      <div className="lg:mx-auto lg:grid lg:max-w-300 lg:grid-cols-12 lg:gap-x-8 lg:px-10">
        <div className="wrap lg:col-span-4 lg:flex lg:flex-col lg:px-0">
          <div data-reveal>
            <h2 id="convidados-titulo" className="t-h1 text-balance">
              Do lado de lá <span className="italic">do link.</span>
            </h2>
            <p className="mt-4 t-lead">É assim que o site chega no celular dos convidados.</p>
          </div>
          <div data-reveal className="mt-10 hidden border-t border-ink/15 pt-6 lg:mt-auto lg:block">
            {closing}
          </div>
        </div>

        {/* tabIndex + nome: no celular a lista rola de lado e não tem nada focável dentro. */}
        <ol
          tabIndex={0}
          aria-label="Telas que os convidados veem"
          className="snap-row mt-6 list-none lg:col-span-8 lg:mt-0 lg:grid-flow-row lg:grid-cols-3 lg:items-start lg:gap-x-8 lg:overflow-visible lg:p-0"
        >
          {BEATS.map((beat, i) => (
            <li key={beat.title} data-reveal style={{ transitionDelay: `${i * 60}ms` }} className={STEP_OFFSET[i]}>
              <figure className="m-0">
                {/* Recorte ≤ 360px de altura no slide de 76vw; no desktop, largura da coluna. */}
                <div className="overflow-hidden rounded-md border border-ink/15 max-lg:max-h-90">
                  <Image
                    src={beat.src}
                    alt={beat.alt}
                    width={beat.width}
                    height={beat.height}
                    sizes="(min-width: 1024px) 240px, 384px"
                    className="block h-auto w-full"
                  />
                </div>
                <figcaption className="mt-2 text-[13px] leading-normal text-ink-soft">{beat.caption}</figcaption>
              </figure>
              <h3 className="mt-3 t-h3">{beat.title}</h3>
              <p className="mt-1.5 text-[15px] leading-[1.55] lg:text-base">{beat.text}</p>
            </li>
          ))}
        </ol>

        <div data-reveal className="wrap mt-6 lg:hidden">
          {closing}
        </div>
      </div>
    </section>
  );
}
