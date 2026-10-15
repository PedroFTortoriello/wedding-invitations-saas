import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { SUPPORT_WRITES } from "@/lib/acting";
import { isUuid, signSupport, verifySupport } from "@/lib/support-session";

const ADMIN = "11111111-2222-3333-4444-555555555555";
const TARGET = "66666666-7777-8888-9999-aaaaaaaaaaaa";
const NOW = 1_800_000_000;

beforeAll(() => {
  process.env.SUPPORT_SESSION_SECRET = "segredo-de-teste";
});

/** Assina um corpo arbitrário com a mesma derivação de chave do módulo (p/ corpos malformados). */
function signRaw(json: string) {
  const key = createHmac("sha256", "segredo-de-teste").update("noivar-support-session-v1").digest();
  const body = Buffer.from(json).toString("base64url");
  return `${body}.${createHmac("sha256", key).update(body).digest("base64url")}`;
}

describe("sessão de suporte (cookie assinado)", () => {
  it("aceita um token válido e devolve o payload", () => {
    const token = signSupport({ adminId: ADMIN, targetUserId: TARGET, exp: NOW + 60 });
    expect(verifySupport(token, NOW)).toEqual({ adminId: ADMIN, targetUserId: TARGET, exp: NOW + 60 });
  });

  it("recusa corpo adulterado (troca de conta alvo com o mac antigo)", () => {
    const token = signSupport({ adminId: ADMIN, targetUserId: TARGET, exp: NOW + 60 });
    const [, mac] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ a: ADMIN, t: "bbbbbbbb-2222-3333-4444-555555555555", e: NOW + 60 })).toString("base64url");
    expect(verifySupport(`${forged}.${mac}`, NOW)).toBeNull();
  });

  it("recusa mac adulterado, truncado ou vazio", () => {
    const token = signSupport({ adminId: ADMIN, targetUserId: TARGET, exp: NOW + 60 });
    const [body, mac] = token.split(".");
    const flipped = (mac[0] === "A" ? "B" : "A") + mac.slice(1);
    expect(verifySupport(`${body}.${flipped}`, NOW)).toBeNull();
    expect(verifySupport(`${body}.${mac.slice(0, 10)}`, NOW)).toBeNull();
    expect(verifySupport(`${body}.`, NOW)).toBeNull();
    expect(verifySupport(`${token}.lixo`, NOW)).toBeNull();
  });

  it("recusa token expirado (inclusive exatamente no instante da expiração)", () => {
    const token = signSupport({ adminId: ADMIN, targetUserId: TARGET, exp: NOW });
    expect(verifySupport(token, NOW)).toBeNull();
    expect(verifySupport(token, NOW + 1)).toBeNull();
    expect(verifySupport(token, NOW - 1)).not.toBeNull();
  });

  it("recusa admin igual ao alvo", () => {
    expect(verifySupport(signSupport({ adminId: ADMIN, targetUserId: ADMIN, exp: NOW + 60 }), NOW)).toBeNull();
  });

  it("recusa lixo e corpos malformados mesmo com assinatura válida", () => {
    for (const raw of [undefined, null, "", "abc", ".", "a.b", "%%%.###"]) {
      expect(verifySupport(raw, NOW)).toBeNull();
    }
    expect(verifySupport(signRaw("não é json"), NOW)).toBeNull();
    expect(verifySupport(signRaw(JSON.stringify({ a: "admin", t: TARGET, e: NOW + 60 })), NOW)).toBeNull();
    expect(verifySupport(signRaw(JSON.stringify({ a: ADMIN, t: TARGET, e: String(NOW + 60) })), NOW)).toBeNull();
    // sanidade do helper: o mesmo corpo bem formado passa
    expect(verifySupport(signRaw(JSON.stringify({ a: ADMIN, t: TARGET, e: NOW + 60 })), NOW)).not.toBeNull();
  });

  it("recusa token grande demais", () => {
    const token = signSupport({ adminId: ADMIN, targetUserId: TARGET, exp: NOW + 60 });
    expect(verifySupport(token + "x".repeat(513), NOW)).toBeNull();
  });

  it("isUuid", () => {
    expect(isUuid(ADMIN)).toBe(true);
    expect(isUuid("11111111-2222-3333-4444-55555555555")).toBe(false);
    expect(isUuid(42)).toBe(false);
  });
});

describe("SUPPORT_WRITES", () => {
  it("toda escrita é allowed ou blocked", () => {
    for (const value of Object.values(SUPPORT_WRITES)) expect(["allowed", "blocked"]).toContain(value);
  });

  it("dinheiro, publicação, identidade/links públicos e exclusões ficam bloqueados", () => {
    const blocked = Object.entries(SUPPORT_WRITES)
      .filter(([, value]) => value === "blocked")
      .map(([key]) => key)
      .sort();
    expect(blocked).toEqual(
      [
        "cash_gift_mark_received",
        "pix_change",
        "coordinator_link",
        "gifts_remove",
        "guests_remove",
        "mercadopago",
        "profile_whatsapp",
        "publish",
        "publish_checkout",
        "slug_change",
        "wedding_create"
      ].sort()
    );
  });
});
