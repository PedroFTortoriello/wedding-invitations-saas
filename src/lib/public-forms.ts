// Validação/normalização das escritas públicas (RSVP e recados). Puro e testável.

export type RsvpStatus = "confirmed" | "declined";

export type NormalizedRsvp = {
  name: string;
  contact: string | null;
  status: RsvpStatus;
  companions: number;
};

export type NormalizedMessage = {
  guestName: string;
  message: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Acompanhantes: inteiro entre 0 e 20; qualquer lixo vira 0. */
export function clampCompanions(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(20, Math.floor(n));
}

export function normalizeRsvp(input: Record<string, unknown>): Result<NormalizedRsvp> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 2) return { ok: false, error: "Informe seu nome." };
  if (name.length > 120) return { ok: false, error: "Nome muito longo." };

  const contact = typeof input.contact === "string" ? input.contact.trim() : "";
  if (contact.length > 160) return { ok: false, error: "Contato muito longo." };

  const status: RsvpStatus = input.status === "declined" ? "declined" : "confirmed";
  const companions = clampCompanions(input.companions);

  return { ok: true, value: { name, contact: contact || null, status, companions } };
}

export function normalizeMessage(input: Record<string, unknown>): Result<NormalizedMessage> {
  const guestName = typeof input.guestName === "string" ? input.guestName.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (guestName.length < 2) return { ok: false, error: "Informe seu nome." };
  if (guestName.length > 120) return { ok: false, error: "Nome muito longo." };
  if (message.length < 2) return { ok: false, error: "Escreva um recado." };
  if (message.length > 1000) return { ok: false, error: "Recado muito longo." };

  return { ok: true, value: { guestName, message } };
}
