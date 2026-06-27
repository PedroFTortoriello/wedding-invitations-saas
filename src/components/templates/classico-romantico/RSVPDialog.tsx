"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { RSVPConfiguration } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type RSVPDialogProps = {
  config: RSVPConfiguration;
  slug: string;
  open: boolean;
  onClose: () => void;
};

export function RSVPDialog({ config, slug, open, onClose }: RSVPDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get("firstName") ?? "").trim();
    const lastName = String(data.get("lastName") ?? "").trim();
    const name = `${firstName} ${lastName}`.trim();
    const contact = String(data.get("contact") ?? "").trim();
    const companions = data.get("companions");

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, contact, companions, status: "confirmed" })
      });
      const json = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(json.error ?? "Não foi possível confirmar agora.");
        setLoading(false);
        return;
      }
      setSubmitted(true);
      setLoading(false);
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-labelledby="rsvp-title"
      onClose={() => {
        setSubmitted(false);
        setError(null);
        onClose();
      }}
    >
      {submitted ? (
        <div className={styles["modal-panel"]}>
          <button className={styles["close-button"]} type="button" aria-label="Fechar RSVP" onClick={onClose}>
            x
          </button>
          <p className={styles.eyebrow}>{config.subtitle}</p>
          <h2 id="rsvp-title">Presença registrada</h2>
          <p className={styles["dialog-success"]}>{config.successMessage}</p>
        </div>
      ) : (
        <form className={styles["modal-panel"]} onSubmit={handleSubmit}>
          <button className={styles["close-button"]} type="button" aria-label="Fechar RSVP" onClick={onClose}>
            x
          </button>
          <p className={styles.eyebrow}>{config.subtitle}</p>
          <h2 id="rsvp-title">{config.title}</h2>
          <label>
            <span>Nome</span>
            <input name="firstName" type="text" autoComplete="given-name" required />
          </label>
          <label>
            <span>Sobrenome</span>
            <input name="lastName" type="text" autoComplete="family-name" />
          </label>
          <label>
            <span>Contato (e-mail ou telefone)</span>
            <input name="contact" type="text" autoComplete="email" />
          </label>
          {config.allowCompanions ? (
            <label>
              <span>Acompanhantes</span>
              <input name="companions" type="number" min="0" defaultValue="0" />
            </label>
          ) : null}
          {error ? (
            <p role="alert" style={{ color: "#8d3d33", fontWeight: 700, margin: 0 }}>
              {error}
            </p>
          ) : null}
          <button className={styles["submit-button"]} type="submit" disabled={loading}>
            {loading ? "Enviando…" : "Confirmar"}
          </button>
        </form>
      )}
    </dialog>
  );
}
