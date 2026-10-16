import crypto from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  AI_SITE_FEE_CENTS,
  PUBLISH_FEE_CENTS,
  isWebhookSecretValid,
  isWebhookSignatureValid,
  parseAbacatePayWebhook,
  timingSafeEqualStr
} from "@/lib/abacatepay";

describe("PUBLISH_FEE_CENTS", () => {
  it("is the R$89,90 fee as integer centavos (8990) — AbacatePay expects cents", () => {
    expect(PUBLISH_FEE_CENTS).toBe(8990);
    expect(Number.isInteger(PUBLISH_FEE_CENTS)).toBe(true);
  });

  it("charges R$149,90 (14990) for the site made by the AI", () => {
    expect(AI_SITE_FEE_CENTS).toBe(14990);
  });
});

describe("parseAbacatePayWebhook", () => {
  it("marks a v1 billing.paid event as paid and extracts weddingId + chargeId + amount", () => {
    const r = parseAbacatePayWebhook({
      event: "billing.paid",
      devMode: false,
      data: { id: "bill_1", externalId: "wedding-123", amount: 14990, status: "PAID" }
    });
    expect(r.paid).toBe(true);
    expect(r.weddingId).toBe("wedding-123");
    expect(r.chargeId).toBe("bill_1");
    expect(r.amountCents).toBe(14990);
  });

  it("marks a v2 checkout.completed event (nested data.checkout) as paid", () => {
    const r = parseAbacatePayWebhook({
      id: "log_1",
      event: "checkout.completed",
      apiVersion: 2,
      data: { checkout: { id: "bill_2", externalId: "wedding-9", amount: 14990, status: "PAID" } }
    });
    expect(r.paid).toBe(true);
    expect(r.weddingId).toBe("wedding-9");
    expect(r.chargeId).toBe("bill_2");
  });

  it("marks a v2 transparent.completed event (nested data.transparent) as paid", () => {
    const r = parseAbacatePayWebhook({
      id: "log_2",
      event: "transparent.completed",
      apiVersion: 2,
      data: { transparent: { id: "bill_3", externalId: "wedding-7", amount: 14990, status: "PAID" } }
    });
    expect(r.paid).toBe(true);
    expect(r.weddingId).toBe("wedding-7");
    expect(r.chargeId).toBe("bill_3");
  });

  it("reports paid but no weddingId when externalId is missing (the route must skip the stamp)", () => {
    const r = parseAbacatePayWebhook({
      event: "billing.paid",
      data: { id: "bill_x", amount: 14990, status: "PAID" }
    });
    expect(r.paid).toBe(true);
    expect(r.weddingId).toBeUndefined();
    expect(r.chargeId).toBe("bill_x");
  });

  it("does NOT mark paid when status is not PAID, even on a paid event name", () => {
    const r = parseAbacatePayWebhook({
      event: "billing.paid",
      data: { id: "bill_3", externalId: "w", status: "PENDING" }
    });
    expect(r.paid).toBe(false);
  });

  it("does NOT mark paid for unrelated events", () => {
    const r = parseAbacatePayWebhook({
      event: "billing.created",
      data: { id: "b", externalId: "w", status: "PAID" }
    });
    expect(r.paid).toBe(false);
  });

  it("marks a v2 completion as paid when status is COMPLETED/APPROVED (not literal PAID)", () => {
    expect(
      parseAbacatePayWebhook({
        event: "checkout.completed",
        data: { checkout: { id: "c1", externalId: "w1", amount: 14990, status: "COMPLETED" } }
      }).paid
    ).toBe(true);
    expect(
      parseAbacatePayWebhook({
        event: "checkout.completed",
        data: { checkout: { id: "c2", externalId: "w2", status: "APPROVED" } }
      }).paid
    ).toBe(true);
  });

  it("marks a completion event as paid when the nested status is absent", () => {
    expect(
      parseAbacatePayWebhook({
        event: "checkout.completed",
        data: { checkout: { id: "c3", externalId: "w3", amount: 14990 } }
      }).paid
    ).toBe(true);
  });

  it("does NOT mark paid on explicitly failed/expired status", () => {
    expect(
      parseAbacatePayWebhook({
        event: "checkout.completed",
        data: { checkout: { id: "c4", externalId: "w4", status: "FAILED" } }
      }).paid
    ).toBe(false);
    expect(
      parseAbacatePayWebhook({
        event: "checkout.completed",
        data: { checkout: { id: "c5", externalId: "w5", status: "EXPIRED" } }
      }).paid
    ).toBe(false);
  });

  it("strips the ia- prefix of the AI checkout externalId", () => {
    const r = parseAbacatePayWebhook({
      event: "checkout.completed",
      data: { checkout: { id: "c7", externalId: "ia-2b0c6f1e-0000-4000-8000-000000000000", amount: 14990 } }
    });
    expect(r.weddingId).toBe("2b0c6f1e-0000-4000-8000-000000000000");
  });

  it("falls back to metadata.weddingId when externalId is absent (v2)", () => {
    const r = parseAbacatePayWebhook({
      event: "checkout.completed",
      data: { checkout: { id: "c6", amount: 14990, status: "COMPLETED", metadata: { weddingId: "w6" } } }
    });
    expect(r.paid).toBe(true);
    expect(r.weddingId).toBe("w6");
  });

  it("is safe on malformed payloads", () => {
    expect(parseAbacatePayWebhook(null).paid).toBe(false);
    expect(parseAbacatePayWebhook("nope").paid).toBe(false);
    expect(parseAbacatePayWebhook({}).paid).toBe(false);
  });
});

describe("timingSafeEqualStr", () => {
  it("matches equal strings and rejects different values and lengths", () => {
    expect(timingSafeEqualStr("abc", "abc")).toBe(true);
    expect(timingSafeEqualStr("abc", "abd")).toBe(false);
    expect(timingSafeEqualStr("abc", "abcd")).toBe(false);
  });
});

describe("isWebhookSecretValid (the required webhook gate)", () => {
  afterEach(() => {
    delete process.env.ABACATEPAY_WEBHOOK_SECRET;
  });

  it("rejects everything when no secret is configured", () => {
    delete process.env.ABACATEPAY_WEBHOOK_SECRET;
    expect(isWebhookSecretValid("anything")).toBe(false);
  });

  it("accepts only the exact configured secret", () => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = "s3cr3t-value";
    expect(isWebhookSecretValid(null)).toBe(false);
    expect(isWebhookSecretValid("wrong")).toBe(false);
    expect(isWebhookSecretValid("s3cr3t-value")).toBe(true);
  });
});

describe("isWebhookSignatureValid (optional HMAC layer)", () => {
  afterEach(() => {
    delete process.env.ABACATEPAY_WEBHOOK_SIGNING_SECRET;
  });

  it("is disabled (passes) when no public key is configured", () => {
    delete process.env.ABACATEPAY_WEBHOOK_SIGNING_SECRET;
    expect(isWebhookSignatureValid("{}", null)).toBe(true);
  });

  it("verifies the HMAC-SHA256 base64 of the raw body when configured", () => {
    process.env.ABACATEPAY_WEBHOOK_SIGNING_SECRET = "pubkey";
    const raw = '{"event":"billing.paid"}';
    const sig = crypto.createHmac("sha256", "pubkey").update(Buffer.from(raw, "utf8")).digest("base64");
    expect(isWebhookSignatureValid(raw, sig)).toBe(true);
    expect(isWebhookSignatureValid(raw, "bad-signature")).toBe(false);
    expect(isWebhookSignatureValid(raw, null)).toBe(false);
  });
});
