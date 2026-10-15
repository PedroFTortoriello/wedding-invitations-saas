import Image from "next/image";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import styles from "./garden-classico.module.css";

type GardenClassicTemplateProps = {
  wedding: WeddingSite;
};

const DEFAULT_SCHEDULE: ReadonlyArray<[string, string]> = [
  ["17:00", "Fotos de boas-vindas e coquetéis"],
  ["18:00", "Cerimônia no jardim"],
  ["19:00", "Jantar sob luzes suaves"],
  ["21:00", "Dança e brinde da noite"]
];

export function GardenClassicTemplate({
  wedding
}: GardenClassicTemplateProps) {
  const location = wedding.locations[0];

  // Até 3 fotos do casal, primeiro as que ainda não aparecem na página (hero, "O começo",
  // local); hero e retrato só entram se faltar foto na galeria.
  const shown = new Set([wedding.heroImage, wedding.footerImage, location?.image]);
  const photos = [
    ...wedding.gallery,
    { id: "hero", src: wedding.heroImage, alt: "Foto do casal" },
    { id: "footer", src: wedding.footerImage, alt: "Foto do casal" }
  ].filter((photo, index, all) => photo.src && all.findIndex((p) => p.src === photo.src) === index);
  const gallery = [
    ...photos.filter((photo) => !shown.has(photo.src)),
    ...photos.filter((photo) => shown.has(photo.src))
  ].slice(0, 3);

  const schedule = wedding.schedule.length
    ? wedding.schedule
    : DEFAULT_SCHEDULE.map(([time, title]) => ({ id: time, time, title }));

  return (
    <main className={styles.template}>
      <section
        className={styles.hero}
        aria-label={`Casamento no jardim de ${wedding.coupleNames}`}
      >
        <Image
          src={wedding.heroImage}
          alt=""
          width={1600}
          height={2400}
          priority
          className={styles.heroImage}
        />

        <div className={styles.heroOverlay} />

        {/* Primeira dobra: .hero-rise (CSS puro, visível sem JS), não reveal no scroll. */}
        <div className={styles.heroContent}>
          <h1 className="hero-rise">{wedding.coupleNames}</h1>

          <p className="hero-rise" style={{ animationDelay: "120ms" }}>
            Vão se casar
          </p>

          <a href="#confirmacao" className="hero-rise" style={{ animationDelay: "240ms" }}>
            Confirmar presença
          </a>
        </div>

        <div className={`${styles.heroMeta} hero-rise`} style={{ animationDelay: "360ms" }}>
          <time dateTime={wedding.weddingDate}>
            {wedding.weddingDateLabel},{" "}
            {wedding.weddingTime}
          </time>

          <span>
            {location?.venue ??
              "Local do jardim"}
          </span>
        </div>
      </section>

      <section className={styles.about}>
        <div className={styles.aboutImage} data-reveal>
          <Image
            src={wedding.footerImage}
            alt={`Foto de ${wedding.coupleNames}`}
            width={900}
            height={1200}
            loading="lazy"
          />
        </div>

        <article data-reveal style={{ transitionDelay: "90ms" }}>
          <p>O COMEÇO</p>

          <h2>DO NOSSO PARA SEMPRE</h2>

          <span>{wedding.welcomeText}</span>

          <span>
            {
              wedding.storyMoments[0]
                ?.description
            }
          </span>
        </article>
      </section>

      <section className={styles.photoBreak} data-reveal>
        <Image
          src={
            wedding.locations[0]?.image ??
            wedding.heroImage
          }
          alt={location?.venue ? `Local do casamento: ${location.venue}` : "Local do casamento"}
          width={1600}
          height={1067}
          sizes="100vw"
          loading="lazy"
        />
      </section>

      <section className={styles.program}>
        <div data-reveal>
          <p>Programação</p>

          <h2>
            Celebração no jardim
          </h2>
        </div>

        <ul>
          {schedule.map((item, index) => (
            <li key={item.id} data-reveal style={{ transitionDelay: `${index * 70}ms` }}>
              <strong>{item.time}</strong>

              <span>{item.title}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.details}>
        <article data-reveal>
          <p>Detalhes</p>

          <h2>
            {location?.city ??
              "Indaiatuba, SP"}
          </h2>

          <span>{location?.note}</span>

          <a
            href={location?.mapUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
          >
            Abrir mapa
          </a>
        </article>

        <div className={styles.gallery}>
          {gallery.map((photo, index) => (
            <Image
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={720}
              height={960}
              loading="lazy"
              data-reveal
              style={{ transitionDelay: `${index * 70}ms` }}
            />
          ))}
        </div>
      </section>

      <section
        id="presentes"
        className={styles.gifts}
      >
        <article data-reveal>
          <p>Presentes</p>

          <h2>Lista de presentes</h2>

          <span>
            Escolha uma cota e presenteie via Pix — direto na chave do
            casal, sem taxas.
          </span>
        </article>

        <GiftRegistry wedding={wedding} variant="jardim" />
      </section>

      <GuestForms wedding={wedding} variant="garden" mode="both" sectionId="confirmacao" />

      <section className={styles.rsvp}>
        <p data-reveal>{wedding.monogram}</p>

        <h2 data-reveal style={{ transitionDelay: "90ms" }}>
          Esperamos você para celebrar
          conosco
        </h2>

        {/* Reveal no wrapper: no próprio <a> ele apagaria a transição do hover. */}
        <div data-reveal style={{ transitionDelay: "180ms" }}>
          <a href="#presentes">Ver lista de presentes</a>
        </div>
      </section>
    </main>
  );
}

