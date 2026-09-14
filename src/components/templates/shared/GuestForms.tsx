"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import type { WeddingSite } from "@/types/wedding";
import { GuestNameField } from "./GuestNameField";
import styles from "./guest-forms.module.css";

export type GuestFormsVariant =
  | "classico"
  | "editorial"
  | "jardim"
  | "civil"
  | "garden"
  | "olive"
  | "praia"
  | "cinema";
type Mode = "both" | "rsvp" | "messages";

/**
 * Formulários públicos compartilhados (RSVP + recados), skinnáveis por modelo via
 * CSS vars — mesmo padrão do GiftRegistry. Fontes herdam do modelo (blend). Postam
 * em /api/rsvp e /api/messages (validação server-side em public-forms).
 */
const SKINS: Record<GuestFormsVariant, CSSProperties> = {
  classico: {
    "--gf-bg": "#f1e9e0",
    "--gf-card": "#fffaf1",
    "--gf-ink": "#33231b",
    "--gf-muted": "#6f5d54",
    "--gf-border": "rgba(160, 86, 57, 0.2)",
    "--gf-field": "#fff",
    "--gf-accent": "#8f4a30",
    "--gf-on-accent": "#f7efe6",
    "--gf-radius": "18px",
    "--gf-eyebrow": "#9a4f30"
  } as CSSProperties,
  editorial: {
    "--gf-bg": "#f1efe9",
    "--gf-card": "#f6f4ef",
    "--gf-ink": "#16151a",
    "--gf-muted": "#585249",
    "--gf-border": "rgba(22, 21, 26, 0.14)",
    "--gf-field": "#fff",
    "--gf-accent": "#16151a",
    "--gf-on-accent": "#f6f4ef",
    "--gf-radius": "2px",
    "--gf-eyebrow": "#9c7b3f"
  } as CSSProperties,
  jardim: {
    "--gf-bg": "#f1eadc",
    "--gf-card": "#faf1e1",
    "--gf-ink": "#2d2b25",
    "--gf-muted": "#514c3f",
    "--gf-border": "rgba(45, 43, 37, 0.18)",
    "--gf-field": "#fffdf8",
    "--gf-accent": "#304254",
    "--gf-on-accent": "#faf1e1",
    "--gf-radius": "16px",
    "--gf-eyebrow": "#6a7a4a"
  } as CSSProperties,
  civil: {
    "--gf-bg": "#f0eee8",
    "--gf-card": "#ffffff",
    "--gf-ink": "#14140f",
    "--gf-muted": "#5c5a52",
    "--gf-border": "rgba(20, 20, 15, 0.16)",
    "--gf-field": "#fbfaf7",
    "--gf-accent": "#14140f",
    "--gf-on-accent": "#f7f5ef",
    "--gf-radius": "2px",
    "--gf-eyebrow": "#8a8578"
  } as CSSProperties,
  garden: {
    "--gf-bg": "#e6e6dd",
    "--gf-card": "#f2f1ea",
    "--gf-ink": "#272b2e",
    "--gf-muted": "#566069",
    "--gf-border": "rgba(51, 58, 64, 0.18)",
    "--gf-field": "#fbfbf6",
    "--gf-accent": "#33495c",
    "--gf-on-accent": "#eef0ea",
    "--gf-radius": "14px",
    "--gf-eyebrow": "#41576b"
  } as CSSProperties,
  olive: {
    "--gf-bg": "#efeade",
    "--gf-card": "#f7f4ea",
    "--gf-ink": "#2f3320",
    "--gf-muted": "#565a43",
    "--gf-border": "rgba(60, 62, 40, 0.2)",
    "--gf-field": "#fffdf6",
    "--gf-accent": "#3d4a2a",
    "--gf-on-accent": "#f4f1e7",
    "--gf-radius": "4px",
    "--gf-eyebrow": "#7c6a3a"
  } as CSSProperties,
  praia: {
    "--gf-bg": "#ebe2d0",
    "--gf-card": "#fbf8f2",
    "--gf-ink": "#16242a",
    "--gf-muted": "#445157",
    "--gf-border": "rgba(22, 36, 42, 0.16)",
    "--gf-field": "#fffdf8",
    "--gf-accent": "#1c3a47",
    "--gf-on-accent": "#f4ede0",
    "--gf-radius": "16px",
    "--gf-eyebrow": "#2e5a6b"
  } as CSSProperties,
  // Cinema Noir — dark band, warm ivory ink, champagne accent, legible error on dark.
  cinema: {
    "--gf-bg": "#120e0a",
    "--gf-card": "#1c150e",
    "--gf-ink": "#f4ece0",
    "--gf-muted": "#b7a892",
    "--gf-border": "rgba(201, 168, 106, 0.24)",
    "--gf-field": "rgba(244, 236, 224, 0.05)",
    "--gf-accent": "#c9a86a",
    "--gf-on-accent": "#14100b",
    "--gf-radius": "6px",
    "--gf-eyebrow": "#c9a86a",
    "--gf-error": "#e6a99f"
  } as CSSProperties
};

type GuestFormsProps = {
  wedding: WeddingSite;
  variant: GuestFormsVariant;
  mode?: Mode;
  sectionId?: string;
};

export function GuestForms({ wedding, variant, mode = "both", sectionId = "confirmar" }: GuestFormsProps) {
  const showRsvp = mode !== "messages" && wedding.rsvp.enabled;
  const showMessages = mode !== "rsvp";
  if (!showRsvp && !showMessages) return null;

  return (
    <section id={sectionId} className={styles.root} style={SKINS[variant]} aria-label="Confirmação e recados">
      <div className={`${styles.wrap} ${showRsvp && showMessages ? styles.two : ""}`}>
        {showRsvp ? <RsvpCard wedding={wedding} /> : null}
        {showMessages ? <MessageCard slug={wedding.slug} /> : null}
      </div>
    </section>
  );
}

type FormState = "idle" | "loading" | "done";

function RsvpCard({ wedding }: { wedding: WeddingSite }) {
  const rsvp = wedding.rsvp;
  const [state, setState] = useState<FormState>("idle");
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(status: "confirmed" | "declined", form: HTMLFormElement) {
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (!name) {
      setError("Diga o seu nome para confirmarmos.");
      return;
    }
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: wedding.slug, name, status })
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Não foi possível registrar agora.");
        setState("idle");
        return;
      }
      setDeclined(status === "declined");
      setState("done");
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setState("idle");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit("confirmed", event.currentTarget);
  }

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>{rsvp.subtitle}</p>
      <h2 className={styles.title}>{rsvp.title}</h2>
      {state === "done" ? (
        <p className={styles.done} role="status">
          {declined ? "Sentiremos sua falta — obrigado por avisar." : rsvp.successMessage}
        </p>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.field}>
            <span>Nome completo</span>
            <GuestNameField slug={wedding.slug} placeholder="Digite para buscar seu nome" required />
          </label>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <button className={styles.submit} type="submit" disabled={state === "loading"}>
            {state === "loading" ? "Enviando…" : "Confirmar presença"}
          </button>
          <button
            type="button"
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (form) void submit("declined", form);
            }}
            disabled={state === "loading"}
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
    </div>
  );
}

function MessageCard({ slug }: { slug: string }) {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          guestName: String(data.get("guestName") ?? "").trim(),
          message: String(data.get("message") ?? "").trim()
        })
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Não foi possível enviar agora.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setState("idle");
    }
  }

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>Recados</p>
      <h2 className={styles.title}>Deixe um recado</h2>
      {state === "done" ? (
        <p className={styles.done} role="status">
          Recado enviado. Obrigado pelo carinho!
        </p>
      ) : (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label className={styles.field}>
            <span>Seu nome</span>
            <input name="guestName" type="text" autoComplete="name" required />
          </label>
          <label className={styles.field}>
            <span>Recado</span>
            <textarea name="message" rows={4} required />
          </label>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <button className={styles.submit} type="submit" disabled={state === "loading"}>
            {state === "loading" ? "Enviando…" : "Enviar recado"}
          </button>
        </form>
      )}
    </div>
  );
}
