import type { WeddingGalleryImage, WeddingSite } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type GallerySectionProps = {
  wedding: WeddingSite;
  onSelectImage: (image: WeddingGalleryImage) => void;
};

export function GallerySection({ wedding, onSelectImage }: GallerySectionProps) {
  const [featured, ...images] = wedding.gallery;

  if (!featured) {
    return null;
  }

  return (
    <section className={styles["editorial-gallery"]} aria-label="Galeria do casal">
      <div className={styles["gallery-copy"]}>
        <p>editorial do casal</p>
        <h2>imagens que contam antes das palavras</h2>
        <span>
          Uma seleção mais cinematográfica, delicada e luminosa para aproximar convidados da atmosfera do casamento.
        </span>
      </div>

      <button
        className={styles["gallery-feature"]}
        type="button"
        onClick={() => onSelectImage(featured)}
        aria-label={`Ampliar ${featured.alt}`}
      >
        <img src={featured.src} alt={featured.alt} />
      </button>

      <div className={styles["gallery-strip"]}>
        {images.slice(0, 6).map((image, index) => (
          <button
            key={image.id}
            className={index % 3 === 1 ? styles["gallery-offset"] : ""}
            type="button"
            onClick={() => onSelectImage(image)}
            aria-label={`Ampliar ${image.alt}`}
          >
            <img src={image.src} alt={image.alt} />
          </button>
        ))}
      </div>
    </section>
  );
}
