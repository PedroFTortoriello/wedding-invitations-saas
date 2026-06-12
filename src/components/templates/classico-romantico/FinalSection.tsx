import type { WeddingSite } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type FinalSectionProps = {
  wedding: WeddingSite;
};

export function FinalSection({ wedding }: FinalSectionProps) {
  return (
    <section className={styles.vision}>
      <p>{wedding.finalText}</p>
    </section>
  );
}
