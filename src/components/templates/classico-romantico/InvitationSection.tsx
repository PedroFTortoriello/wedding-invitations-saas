import type { WeddingSite } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type InvitationSectionProps = {
  wedding: WeddingSite;
};

export function InvitationSection({ wedding }: InvitationSectionProps) {
  return (
    <section className={styles.invitation} aria-label="Convite" data-invitation>
      <p>
        {wedding.invitationWords.map((word) => (
          <span key={word} data-invitation-word>
            {word}
          </span>
        ))}
      </p>
    </section>
  );
}
