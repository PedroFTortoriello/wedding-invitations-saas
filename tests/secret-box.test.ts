import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/secret-box";

const HEX_KEY = crypto.randomBytes(32).toString("hex");

describe("secret-box (AES-256-GCM dos tokens do Mercado Pago)", () => {
  beforeEach(() => {
    process.env.MERCADOPAGO_TOKEN_ENCRYPTION_KEY = HEX_KEY;
  });
  afterEach(() => {
    delete process.env.MERCADOPAGO_TOKEN_ENCRYPTION_KEY;
  });

  it("cifra e decifra o mesmo token", () => {
    const token = "APP_USR-1234567890-091126-abcdef-987654321";
    const box = encryptSecret(token);
    expect(box.startsWith("v1.")).toBe(true);
    expect(box).not.toContain(token);
    expect(decryptSecret(box)).toBe(token);
  });

  it("usa IV aleatório (duas cifras do mesmo texto diferem)", () => {
    expect(encryptSecret("mesmo")).not.toBe(encryptSecret("mesmo"));
  });

  it("aceita chave em base64 além de hex", () => {
    process.env.MERCADOPAGO_TOKEN_ENCRYPTION_KEY = Buffer.from(HEX_KEY, "hex").toString("base64");
    expect(decryptSecret(encryptSecret("x"))).toBe("x");
  });

  it("rejeita texto adulterado (GCM autentica)", () => {
    const [v, iv, tag, ct] = encryptSecret("token-original").split(".");
    const flipped = Buffer.from(ct, "base64url");
    flipped[0] ^= 0xff;
    expect(() => decryptSecret([v, iv, tag, flipped.toString("base64url")].join("."))).toThrow();
  });

  it("não decifra com outra chave", () => {
    const box = encryptSecret("token");
    process.env.MERCADOPAGO_TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
    expect(() => decryptSecret(box)).toThrow();
  });

  it("falha claro sem chave, com chave curta ou formato inválido", () => {
    delete process.env.MERCADOPAGO_TOKEN_ENCRYPTION_KEY;
    expect(() => encryptSecret("x")).toThrow(/MERCADOPAGO_TOKEN_ENCRYPTION_KEY/);
    process.env.MERCADOPAGO_TOKEN_ENCRYPTION_KEY = "curta";
    expect(() => encryptSecret("x")).toThrow(/32 bytes/);
    process.env.MERCADOPAGO_TOKEN_ENCRYPTION_KEY = HEX_KEY;
    expect(() => decryptSecret("nao-e-um-box")).toThrow(/formato/);
  });
});
