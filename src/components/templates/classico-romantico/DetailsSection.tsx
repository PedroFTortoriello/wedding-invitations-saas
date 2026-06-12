import type { WeddingDetailCard, WeddingSite } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type DetailsSectionProps = {
  wedding: WeddingSite;
  onSelectDetail: (detail: WeddingDetailCard) => void;
};

export function DetailsSection({ wedding, onSelectDetail }: DetailsSectionProps) {
  const activeCards = wedding.detailCards.filter((card) => card.active);

  return (
    <section className={styles.details} id="details">
      <div className={styles["details-heading"]}>
        <h2>{wedding.detailsTitle}</h2>
        <p>{wedding.detailsSubtitle}</p>
      </div>
      <div className={styles["detail-grid"]}>
        {activeCards.map((card) => {
          const isLocation = card.type === "location";
          const isMenu = card.type === "menu";
          return (
            <button
              key={card.id}
              className={`${styles["detail-card"]} ${isLocation ? styles["detail-card-local"] : ""} ${
                isMenu ? styles["detail-card-menu"] : ""
              }`}
              type="button"
              data-detail-card
              onClick={() => onSelectDetail(card)}
            >
              <img src={card.image} alt="" />
              {isLocation ? (
                <div className={styles["local-card-copy"]}>
                  <span>{card.title}</span>
                  <strong>{wedding.locations[0]?.venue}</strong>
                  <small>{card.subtitle}</small>
                </div>
              ) : (
                <>
                  <span>{card.title}</span>
                  <small>{card.subtitle}</small>
                </>
              )}
              <i aria-hidden="true">+</i>
            </button>
          );
        })}
      </div>
    </section>
  );
}
