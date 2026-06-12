import type { WeddingLocation } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type LocationSectionProps = {
  location: WeddingLocation;
};

export function LocationSection({ location }: LocationSectionProps) {
  return (
    <div className={styles["modal-location"]}>
      <span>endereco</span>
      <strong>{location.venue}</strong>
      <p>{location.city}</p>
      <small>{location.note}</small>
      <a href={location.mapUrl} target="_blank" rel="noopener noreferrer">
        Abrir no mapa
      </a>
    </div>
  );
}
