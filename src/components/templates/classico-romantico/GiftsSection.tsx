import type { WeddingGift } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type GiftsSectionProps = {
  gifts: WeddingGift[];
};

export function GiftsSection({ gifts }: GiftsSectionProps) {
  return (
    <div className={styles["modal-gift-list"]}>
      {gifts
        .filter((gift) => gift.active)
        .map((gift) => (
          <a
            key={gift.id}
            className={`${styles["gift-card"]} ${styles.revealed}`}
            href={gift.link}
            target={gift.link.startsWith("#") ? undefined : "_blank"}
            rel={gift.link.startsWith("#") ? undefined : "noopener noreferrer"}
          >
            {gift.image ? <img className={styles["gift-image"]} src={gift.image} alt="" /> : null}
            <div className={styles["gift-card-head"]}>
              <h3>{gift.title}</h3>
              <p className={styles["gift-price"]}>{gift.price}</p>
            </div>
            <p className={styles["gift-description"]}>{gift.description}</p>
            <span className={styles["gift-link"]}>Ver presente</span>
          </a>
        ))}
    </div>
  );
}
