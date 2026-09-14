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

  const gallery = [
    wedding.heroImage,
    wedding.gallery[3]?.src,
    wedding.gallery[4]?.src
  ].filter(Boolean);

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

        <div className={styles.heroContent}>
          <h1>{wedding.coupleNames}</h1>

          <p>Vão se casar</p>

          <a href="#confirmacao" data-reveal>
            Confirmar presença
          </a>
        </div>

        <div className={styles.heroMeta} data-reveal style={{ transitionDelay: "120ms" }}>
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
            alt="Foto do casal"
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
          alt="Local do casamento"
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
          {gallery.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Galeria ${index + 1}`}
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

        <a href="#presentes" data-reveal style={{ transitionDelay: "180ms" }}>
          Ver lista de presentes
        </a>
      </section>
    </main>
  );
}

