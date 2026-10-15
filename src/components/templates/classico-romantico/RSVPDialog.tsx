"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { RSVPConfiguration } from "@/types/wedding";
import { DEMO_SENT_NOTE, isDemoWedding } from "@/lib/demo-id";
import { normalizeRsvp } from "@/lib/public-forms";
import { GuestNameField } from "@/components/templates/shared/GuestNameField";
import styles from "./classic-romantic.module.css";

type RSVPDialogProps = {
  config: RSVPConfiguration;
  slug: string;
  weddingId: string;
  open: boolean;
  onClose: () => void;
};

export function RSVPDialog({ config, slug, weddingId, open, onClose }: RSVPDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [declined, setDeclined] = useState(false);
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

  async function submit(status: "confirmed" | "declined", form: HTMLFormElement) {
    const name = String(new FormData(form).get("name") ?? "").trim();
    // Demo (/modelo/...): valida igual ao servidor e simula o sucesso, sem chamar a API.
    if (isDemoWedding(weddingId)) {
      const check = normalizeRsvp({ name, status });
      setError(check.ok ? null : check.error);
      if (!check.ok) return;
      setDeclined(status === "declined");
      setSubmitted(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, status })
      });
      const json = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(json.error ?? "Não foi possível registrar agora.");
        setLoading(false);
        return;
      }
      setDeclined(status === "declined");
      setSubmitted(true);
      setLoading(false);
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit("confirmed", event.currentTarget);
  }

  function handleClose() {
    setSubmitted(false);
    setDeclined(false);
    setError(null);
    onClose();
  }

  return (
    <dialog ref={dialogRef} className={styles.modal} aria-labelledby="rsvp-title" onClose={handleClose}>
      {submitted ? (
        <div className={styles["modal-panel"]}>
          <button className={styles["close-button"]} type="button" aria-label="Fechar RSVP" onClick={handleClose}>
            x
          </button>
          <p className={styles.eyebrow}>{config.subtitle}</p>
          <h2 id="rsvp-title">{declined ? "Resposta registrada" : "Presença registrada"}</h2>
          <p className={styles["dialog-success"]}>
            {declined ? "Sentiremos sua falta — obrigado por avisar." : config.successMessage}
            {isDemoWedding(weddingId) ? DEMO_SENT_NOTE : null}
          </p>
        </div>
      ) : (
        <form className={styles["modal-panel"]} onSubmit={handleSubmit}>
          <button className={styles["close-button"]} type="button" aria-label="Fechar RSVP" onClick={handleClose}>
            x
          </button>
          <p className={styles.eyebrow}>{config.subtitle}</p>
          <h2 id="rsvp-title">{config.title}</h2>
          <label>
            <span>Nome completo</span>
            <GuestNameField slug={slug} weddingId={weddingId} placeholder="Digite para buscar seu nome" required />
          </label>
          {error ? (
            <p role="alert" style={{ color: "#8d3d33", fontWeight: 700, margin: 0 }}>
              {error}
            </p>
          ) : null}
          <button className={styles["submit-button"]} type="submit" disabled={loading}>
            {loading ? "Enviando…" : "Confirmar presença"}
          </button>
          <button
            type="button"
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (form && form.reportValidity()) void submit("declined", form);
            }}
            disabled={loading}
            style={{
              marginTop: 4,
              background: "none",
              border: "none",
              color: "inherit",
              opacity: 0.72,
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: 4,
              cursor: "pointer"
            }}
          >
            Não poderei ir
          </button>
        </form>
      )}
    </dialog>
  );
}
