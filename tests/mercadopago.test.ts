import crypto from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildAuthorizationUrl,
  createOAuthState,
  createPkcePair,
  getAppUrl,
  getOAuthRedirectUri,
  isMercadoPagoConfigured,
  isMercadoPagoSignatureValid,
  isPkceEnabled,
  mapPaymentStatus
} from "@/lib/mercadopago";

const SECRET = "assinatura-secreta-de-teste";

/** Assina como o Mercado Pago: HMAC-SHA256 hex sobre o manifesto, em "ts=...,v1=...". */
function sign({ dataId, requestId, ts }: { dataId: string; requestId: string; ts: string }) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = crypto.createHmac("sha256", SECRET).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

afterEach(() => {
  delete process.env.MERCADOPAGO_CLIENT_ID;
  delete process.env.MERCADOPAGO_CLIENT_SECRET;
  delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
  delete process.env.APP_URL;
});

describe("configuração", () => {
  it("só considera configurado com client id E secret", () => {
    expect(isMercadoPagoConfigured()).toBe(false);
    process.env.MERCADOPAGO_CLIENT_ID = "123";
    expect(isMercadoPagoConfigured()).toBe(false);
    process.env.MERCADOPAGO_CLIENT_SECRET = "abc";
    expect(isMercadoPagoConfigured()).toBe(true);
  });

  it("exige APP_URL e tira a barra do fim (o redirect_uri precisa ser exato)", () => {
    expect(() => getAppUrl()).toThrow(/APP_URL/);
    process.env.APP_URL = "https://noivar.com.br/";
    expect(getAppUrl()).toBe("https://noivar.com.br");
    expect(getOAuthRedirectUri()).toBe("https://noivar.com.br/api/mercadopago/oauth/callback");
  });
});

describe("buildAuthorizationUrl", () => {
  function setup() {
    process.env.MERCADOPAGO_CLIENT_ID = "app-123";
    process.env.MERCADOPAGO_CLIENT_SECRET = "secret";
    process.env.APP_URL = "https://noivar.com.br";
  }

  it("usa o host oficial auth.mercadopago.com e o redirect_uri exato", () => {
    setup();
    const url = new URL(buildAuthorizationUrl({ state: "st4te" }));
    expect(url.origin).toBe("https://auth.mercadopago.com");
    expect(url.pathname).toBe("/authorization");
    expect(url.searchParams.get("client_id")).toBe("app-123");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("platform_id")).toBe("mp");
    expect(url.searchParams.get("state")).toBe("st4te");
    expect(url.searchParams.get("redirect_uri")).toBe("https://noivar.com.br/api/mercadopago/oauth/callback");
    expect(url.searchParams.get("code_challenge")).toBeNull();
  });

  it("inclui o desafio PKCE só quando ele é passado", () => {
    setup();
    const url = new URL(buildAuthorizationUrl({ state: "s", codeChallenge: "desafio" }));
    expect(url.searchParams.get("code_challenge")).toBe("desafio");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("exige credenciais da plataforma", () => {
    process.env.APP_URL = "https://noivar.com.br";
    expect(() => buildAuthorizationUrl({ state: "s" })).toThrow(/MERCADOPAGO_CLIENT_ID/);
  });

  it("isPkceEnabled só liga com valor explícito", () => {
    expect(isPkceEnabled()).toBe(false);
    process.env.MERCADOPAGO_PKCE = "true";
    expect(isPkceEnabled()).toBe(true);
    process.env.MERCADOPAGO_PKCE = "no";
    expect(isPkceEnabled()).toBe(false);
    delete process.env.MERCADOPAGO_PKCE;
  });
});

describe("PKCE e state", () => {
  it("gera verifier no tamanho do RFC 7636 e challenge = base64url(sha256(verifier))", () => {
    const { verifier, challenge } = createPkcePair();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    expect(challenge).toBe(crypto.createHash("sha256").update(verifier).digest("base64url"));
  });

  it("não repete verifier nem state", () => {
    expect(createPkcePair().verifier).not.toBe(createPkcePair().verifier);
    expect(createOAuthState()).not.toBe(createOAuthState());
  });
});

describe("isMercadoPagoSignatureValid", () => {
  const base = { dataId: "123456789", requestId: "req-abc-1", ts: "1757600000" };

  it("aceita a assinatura correta", () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
    expect(
      isMercadoPagoSignatureValid({
        signatureHeader: sign(base),
        requestId: base.requestId,
        dataId: base.dataId
      })
    ).toBe(true);
  });

  it("falha fechada sem segredo, sem header ou com header incompleto", () => {
    expect(
      isMercadoPagoSignatureValid({ signatureHeader: sign(base), requestId: base.requestId, dataId: base.dataId })
    ).toBe(false);

    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
    expect(isMercadoPagoSignatureValid({ signatureHeader: null, requestId: base.requestId, dataId: base.dataId })).toBe(
      false
    );
    expect(
      isMercadoPagoSignatureValid({ signatureHeader: "ts=1757600000", requestId: base.requestId, dataId: base.dataId })
    ).toBe(false);
    expect(isMercadoPagoSignatureValid({ signatureHeader: "v1=abc", requestId: base.requestId, dataId: base.dataId })).toBe(
      false
    );
  });

  it("recusa id, request-id, ts ou segredo trocados", () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
    const header = sign(base);
    expect(isMercadoPagoSignatureValid({ signatureHeader: header, requestId: base.requestId, dataId: "999" })).toBe(false);
    expect(isMercadoPagoSignatureValid({ signatureHeader: header, requestId: "outro", dataId: base.dataId })).toBe(false);
    expect(
      isMercadoPagoSignatureValid({
        signatureHeader: header.replace(/^ts=\d+/, "ts=1757609999"),
        requestId: base.requestId,
        dataId: base.dataId
      })
    ).toBe(false);
    expect(
      isMercadoPagoSignatureValid({
        signatureHeader: header,
        requestId: base.requestId,
        dataId: base.dataId,
        secret: "outro-segredo"
      })
    ).toBe(false);
  });

  it("id alfanumérico entra em minúsculas no manifesto", () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
    const lower = { dataId: "abc-def", requestId: "req-1", ts: "1757600000" };
    // O MP manda o id em maiúsculas, mas assina o manifesto em minúsculas.
    expect(
      isMercadoPagoSignatureValid({
        signatureHeader: sign(lower),
        requestId: lower.requestId,
        dataId: "ABC-DEF"
      })
    ).toBe(true);
  });

  it("não quebra com v1 fora de hexadecimal", () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
    expect(
      isMercadoPagoSignatureValid({ signatureHeader: "ts=1,v1=zz", requestId: "r", dataId: "1" })
    ).toBe(false);
  });
});

describe("mapPaymentStatus", () => {
  it("traduz os status do Mercado Pago", () => {
    expect(mapPaymentStatus("approved")).toBe("paid");
    expect(mapPaymentStatus("pending")).toBe("pending");
    expect(mapPaymentStatus("in_process")).toBe("pending");
    expect(mapPaymentStatus("in_mediation")).toBe("pending");
    expect(mapPaymentStatus("authorized")).toBe("pending");
    expect(mapPaymentStatus("refunded")).toBe("refunded");
    expect(mapPaymentStatus("charged_back")).toBe("refunded");
    expect(mapPaymentStatus("rejected")).toBe("failed");
    expect(mapPaymentStatus("cancelled")).toBe("failed");
  });

  it("devolve null em status desconhecido (a rota ignora sem inventar estado)", () => {
    expect(mapPaymentStatus("inventado")).toBeNull();
    expect(mapPaymentStatus("")).toBeNull();
  });
});
