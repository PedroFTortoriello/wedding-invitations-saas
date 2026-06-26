import type { WeddingSite } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type HeroSectionProps = {
  wedding: WeddingSite;
};

export function HeroSection({ wedding }: HeroSectionProps) {
  const location = wedding.locations[0];

  return (
    <section className={styles["hero-scroll"]} id="hero" aria-label="Apresentação do casamento">
      <div className={styles["hero-scene"]}>
        <div className={styles["hero-card"]}>
          <img src={wedding.heroImage} alt={`Foto principal de ${wedding.coupleNames}`} />
          <div className={styles["hero-overlay"]} />
          <div className={styles["hero-kicker"]}>
            <span>{wedding.weddingDateLabel}</span>
            <span>{location?.city ?? "Celebração"}</span>
          </div>
          <h1>{wedding.coupleNames}</h1>
          <div className={styles["hero-actions"]}>
            <a href="#details">Ver detalhes</a>
            <a href="#presentes">Lista de presentes</a>
          </div>
          <div className={styles["hero-scrollline"]}>
            <div className={styles.rule} />
            <div className={styles["scroll-note"]}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 13l5 5 5-5M12 6v12" />
              </svg>
              <span>Role para explorar</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
