import type { WeddingDetailCard, WeddingSite } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type DetailsSectionProps = {
  wedding: WeddingSite;
  onSelectDetail: (detail: WeddingDetailCard) => void;
};

export function DetailsSection({ wedding, onSelectDetail }: DetailsSectionProps) {
  const location = wedding.locations[0];
  const hasLocation = Boolean(location && (location.venue || location.city));

  // O "Local" vem do local principal (locations[0]) e SEMPRE aparece quando há
  // venue/cidade — mesmo que o casal não tenha criado um cartão de detalhe.
  // Se já existir um cartão do tipo "location", ele tem prioridade (mantém body/imagem próprios).
  const locationCard: WeddingDetailCard | null =
    wedding.detailCards.find((c) => c.active && c.type === "location") ??
    (hasLocation
      ? {
          id: "__local",
          type: "location",
          title: "Local",
          subtitle: location.city,
          image: location.image,
          body: location.note ?? "",
          active: true
        }
      : null);

  // Demais cartões: menu/personalizados. Sem "presentes" (a lista já aparece
  // logo abaixo) e sem "location" (tratado acima, para não duplicar).
  const extraCards = wedding.detailCards.filter(
    (c) => c.active && c.type !== "gifts" && c.type !== "location"
  );

  const cards = [locationCard, ...extraCards].filter((c): c is WeddingDetailCard => c !== null);
  if (!cards.length) return null;

  return (
    <section className={styles.details} id="details">
      <div className={styles["details-heading"]}>
        <h2>{wedding.detailsTitle}</h2>
        <p>{wedding.detailsSubtitle}</p>
      </div>
      <div className={styles["detail-grid"]}>
        {cards.map((card) => {
          const isLocation = card.type === "location";
          const headline = isLocation ? location?.venue || card.subtitle : card.subtitle;
          return (
            <button
              key={card.id}
              className={styles["detail-card"]}
              type="button"
              data-detail-card
              onClick={() => onSelectDetail(card)}
            >
              <img src={card.image} alt="" />
              <span className={styles["detail-card-body"]}>
                <em className={styles["detail-card-eyebrow"]}>{card.title}</em>
                <strong className={styles["detail-card-headline"]}>{headline}</strong>
                {isLocation && location?.venue && card.subtitle ? (
                  <small className={styles["detail-card-sub"]}>{card.subtitle}</small>
                ) : null}
                <span className={styles["detail-card-more"]}>
                  Ver detalhes <i aria-hidden="true">→</i>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
