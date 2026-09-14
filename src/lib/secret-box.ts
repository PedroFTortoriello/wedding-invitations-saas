import crypto from "node:crypto";

/**
 * Cifra simétrica (AES-256-GCM) para os tokens OAuth do Mercado Pago que ficam no
 * banco. O token dá acesso à conta do casal: se o banco vazar, sem a chave
 * (MERCADOPAGO_TOKEN_ENCRYPTION_KEY, só no servidor) o conteúdo é inútil. GCM autentica o
 * texto — qualquer adulteração faz decryptSecret lançar.
 * Formato: "v1.<iv>.<tag>.<ciphertext>" (base64url).
 */
const VERSION = "v1";

function getKey(): Buffer {
  const raw = process.env.MERCADOPAGO_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("MERCADOPAGO_TOKEN_ENCRYPTION_KEY não configurada: gere com `openssl rand -hex 32` e defina no .env.");
  }
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("MERCADOPAGO_TOKEN_ENCRYPTION_KEY precisa ter 32 bytes (64 caracteres hex ou base64).");
  }
  return key;
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptSecret(box: string): string {
  const parts = box.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Segredo cifrado em formato inválido.");
  }
  const [, iv, tag, ciphertext] = parts;
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}
