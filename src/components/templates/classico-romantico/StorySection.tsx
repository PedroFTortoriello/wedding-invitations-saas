import type { WeddingSite } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type StorySectionProps = {
  wedding: WeddingSite;
};

export function StorySection({ wedding }: StorySectionProps) {
  return (
<section
  className={styles.storySection}
  id="story"
>
  <div className={styles.storyGrid}>
    <div className={styles.storyImageWrap}>
      <img
        src={
          wedding.gallery[2]?.src ??
          wedding.heroImage
        }
        alt={wedding.storyTitle}
        className={styles.storyImage}
      />
    </div>

    <div className={styles.storyContent}>
      <span className={styles.storyEyebrow}>
        Nossa história
      </span>

      <h2>{wedding.storyTitle}</h2>

      <div className={styles.storyTimeline}>
        {wedding.storyMoments.map((moment) => (
          <article
            key={moment.id}
            className={styles.storyItem}
          >
            <span className={styles.storyNumber}>
              {moment.number}
            </span>

            <div>
              <h3>{moment.title}</h3>

              <p>{moment.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </div>
</section>
  );
}