"use client";

import { useEffect, useRef, useState } from "react";
import type { RSVPConfiguration } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type RSVPDialogProps = {
  config: RSVPConfiguration;
  open: boolean;
  onClose: () => void;
};

export function RSVPDialog({ config, open, onClose }: RSVPDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-labelledby="rsvp-title"
      onClose={() => {
        setSubmitted(false);
        onClose();
      }}
    >
      <form method="dialog" className={styles["modal-panel"]}>
        <button className={styles["close-button"]} type="submit" aria-label="Fechar RSVP">
          x
        </button>
        <p className={styles.eyebrow}>{config.subtitle}</p>
        <h2 id="rsvp-title">{submitted ? "Presenca registrada" : config.title}</h2>
        {submitted ? (
          <p className={styles["dialog-success"]}>{config.successMessage}</p>
        ) : (
          <>
            <label>
              <span>Nome</span>
              <input type="text" autoComplete="given-name" />
            </label>
            <label>
              <span>Sobrenome</span>
              <input type="text" autoComplete="family-name" />
            </label>
            {config.allowCompanions ? (
              <label>
                <span>Acompanhantes</span>
                <input type="number" min="0" defaultValue="0" />
              </label>
            ) : null}
            <button className={styles["submit-button"]} type="button" onClick={() => setSubmitted(true)}>
              Confirmar
            </button>
          </>
        )}
      </form>
    </dialog>
  );
}
