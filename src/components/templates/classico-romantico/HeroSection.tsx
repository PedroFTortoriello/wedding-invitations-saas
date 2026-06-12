import type { WeddingSite } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type HeroSectionProps = {
  wedding: WeddingSite;
};

export function HeroSection({ wedding }: HeroSectionProps) {
  const location = wedding.locations[0];
  const floatClasses = [
    styles["float-portugal"],
    styles["float-dance"],
    styles["float-cliff"],
    styles["float-shoes"]
  ];

  return (
    <section className={styles["hero-scroll"]} id="hero" aria-label="Apresentação do casamento" data-hero-section>
      <div className={styles["hero-scene"]}>
        <div className={styles["hero-card"]} data-hero-card>
          <img src={wedding.heroImage} alt={`Foto principal de ${wedding.coupleNames}`} />
          <div className={styles["hero-overlay"]} />
          <div className={styles["hero-kicker"]}>
            <span>{wedding.weddingDateLabel}</span>
            <span>{location?.city ?? "Celebração"}</span>
          </div>
          <h1 data-hero-title>{wedding.coupleNames}</h1>
          <div className={styles["hero-actions"]}>
            <a href="#details">Ver detalhes</a>
            <a href="#presentes">Lista de presentes</a>
          </div>
          <div className={styles["hero-scrollline"]} data-hero-line>
            <div className={styles.rule} />
            <div className={styles["scroll-note"]}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 13l5 5 5-5M12 6v12" />
              </svg>
              <span>Role para explorar</span>
            </div>
          </div>
        </div>

        <div className={styles["floating-gallery"]} aria-hidden="true">
          {wedding.floatingImages.map((image, index) => (
            <img
              key={image.id}
              className={`${styles["float-photo"]} ${floatClasses[index] ?? ""}`}
              data-float
              src={image.src}
              alt=""
            />
          ))}
        </div>
      </div>
    </section>
  );
}
