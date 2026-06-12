"use client";

import { useEffect, useRef } from "react";
import type { WeddingDetailCard, WeddingSite } from "@/types/wedding";
import { GiftsSection } from "./GiftsSection";
import { LocationSection } from "./LocationSection";
import styles from "./classic-romantic.module.css";

type GiftDialogProps = {
  wedding: WeddingSite;
  detail: WeddingDetailCard | null;
  onClose: () => void;
};

export function GiftDialog({ wedding, detail, onClose }: GiftDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isGiftList = detail?.type === "gifts";
  const isLocation = detail?.type === "location";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (detail && !dialog.open) {
      dialog.showModal();
    }

    if (!detail && dialog.open) {
      dialog.close();
    }
  }, [detail]);

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.modal} ${isGiftList ? styles["modal-wide"] : ""} ${
        isLocation ? styles["modal-location-mode"] : ""
      }`}
      aria-labelledby="detail-title"
      onClose={onClose}
    >
      <form method="dialog" className={styles["modal-panel"]}>
        <button className={styles["close-button"]} type="submit" aria-label="Fechar detalhe">
          x
        </button>
        <p className={styles.eyebrow}>Detalhe do casamento</p>
        <h2 id="detail-title">{detail?.title ?? "Detalhes"}</h2>
        <p className={styles["detail-body"]}>{detail?.body ?? "Mais informações podem ser adicionadas aqui."}</p>
        {isLocation && wedding.locations[0] ? <LocationSection location={wedding.locations[0]} /> : null}
        {isGiftList ? <GiftsSection gifts={wedding.gifts} /> : null}
      </form>
    </dialog>
  );
}
