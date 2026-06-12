import type { WeddingSite } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type FooterSectionProps = {
  wedding: WeddingSite;
};

export function FooterSection({ wedding }: FooterSectionProps) {
  return (
    <footer className={styles["site-footer"]}>
      <img src={wedding.footerImage} alt={`Foto final de ${wedding.coupleNames}`} />
      <div />
      <p>{wedding.footerText}</p>
    </footer>
  );
}
