import { describe, expect, it } from "vitest";
import {
  accountActionBlock,
  chunk,
  emailConfirmationMatches,
  isHighStakes,
  normalizeEmail
} from "@/components/admin/account-deletion";

const ADMIN = "11111111-1111-4111-8111-111111111111";
const CLIENT = "22222222-2222-4222-8222-222222222222";

describe("accountActionBlock", () => {
  it("allows a client account", () => {
    expect(accountActionBlock({ adminId: ADMIN, targetId: CLIENT, targetRole: "client" })).toBeNull();
  });

  it("treats a missing role as client", () => {
    expect(accountActionBlock({ adminId: ADMIN, targetId: CLIENT, targetRole: null })).toBeNull();
  });

  it("blocks the admin's own account, even if the role lookup says client", () => {
    expect(accountActionBlock({ adminId: ADMIN, targetId: ADMIN, targetRole: "admin" })).toBe("self");
    expect(accountActionBlock({ adminId: ADMIN, targetId: ADMIN, targetRole: "client" })).toBe("self");
  });

  it("blocks other admins", () => {
    expect(accountActionBlock({ adminId: ADMIN, targetId: CLIENT, targetRole: "admin" })).toBe("admin");
  });
});

describe("emailConfirmationMatches", () => {
  it("ignores case and surrounding spaces", () => {
    expect(emailConfirmationMatches("  Ana@Exemplo.COM ", "ana@exemplo.com")).toBe(true);
    expect(normalizeEmail(" X@Y.z ")).toBe("x@y.z");
  });

  it("rejects a different or partial e-mail", () => {
    expect(emailConfirmationMatches("ana@exemplo.co", "ana@exemplo.com")).toBe(false);
    expect(emailConfirmationMatches("ana", "ana@exemplo.com")).toBe(false);
  });

  it("never matches when the account has no e-mail or input is not a string", () => {
    expect(emailConfirmationMatches("", null)).toBe(false);
    expect(emailConfirmationMatches("", "")).toBe(false);
    expect(emailConfirmationMatches(null, "ana@exemplo.com")).toBe(false);
  });
});

describe("isHighStakes", () => {
  const base = { wedding: null, paymentsPaidCents: 0, cashGiftsPaid: 0 };
  const wedding = { id: "w", slug: "a-e-b", status: "draft", coupleNames: "A & B", publishPaidAt: null };

  it("is false for an account without money or live site", () => {
    expect(isHighStakes(base)).toBe(false);
    expect(isHighStakes({ ...base, wedding })).toBe(false);
  });

  it("flags published site, paid or released fee and received gifts", () => {
    expect(isHighStakes({ ...base, wedding: { ...wedding, status: "published" } })).toBe(true);
    expect(isHighStakes({ ...base, wedding: { ...wedding, publishPaidAt: "2026-09-01T00:00:00Z" } })).toBe(true);
    expect(isHighStakes({ ...base, paymentsPaidCents: 4990 })).toBe(true);
    expect(isHighStakes({ ...base, cashGiftsPaid: 1 })).toBe(true);
  });
});

describe("chunk", () => {
  it("splits storage paths into batches of at most 100", () => {
    const paths = Array.from({ length: 250 }, (_, i) => `u/${i}.jpg`);
    expect(chunk(paths).map((batch) => batch.length)).toEqual([100, 100, 50]);
    expect(chunk([])).toEqual([]);
  });
});
