"use client";

import { useEffect, useRef } from "react";
import type { WeddingGalleryImage } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type LightboxDialogProps = {
  image: WeddingGalleryImage | null;
  onClose: () => void;
};

export function LightboxDialog({ image, onClose }: LightboxDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (image && !dialog.open) {
      dialog.showModal();
    }

    if (!image && dialog.open) {
      dialog.close();
    }
  }, [image]);

  return (
    <dialog ref={dialogRef} className={styles.lightbox} aria-label="Visualizacao da foto" onClose={onClose}>
      <form method="dialog">
        <button type="submit" aria-label="Fechar foto">
          x
        </button>
        {image ? <img src={image.src} alt={image.alt} /> : null}
      </form>
    </dialog>
  );
}
