import type { WeddingSite } from "@/types/wedding";
import { GiftsSection } from "./GiftsSection";
import styles from "./classic-romantic.module.css";

type CashGiftPixSectionProps = {
  wedding: WeddingSite;
};

export function CashGiftPixSection({ wedding }: CashGiftPixSectionProps) {
  return (
    <section className={styles["cash-gift-section"]} id="presentes">
      <div className={styles["cash-gift-heading"]}>
        <p>lista de presentes</p>
        <h2>um carinho para os próximos capítulos</h2>
        <span>
          Cotas simbólicas, experiências e gestos delicados para participar do começo dessa nova fase com intenção.
        </span>
      </div>
      <GiftsSection gifts={wedding.gifts} />
    </section>
  );
}
