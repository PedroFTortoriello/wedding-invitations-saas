import { describe, expect, it } from "vitest";
import { clampCompanions, normalizeMessage, normalizeRsvp } from "@/lib/public-forms";

describe("clampCompanions", () => {
  it("floors positive numbers", () => {
    expect(clampCompanions(5.7)).toBe(5);
  });
  it("turns negatives and junk into 0", () => {
    expect(clampCompanions(-3)).toBe(0);
    expect(clampCompanions("abc")).toBe(0);
    expect(clampCompanions(undefined)).toBe(0);
  });
  it("caps at 20", () => {
    expect(clampCompanions(100)).toBe(20);
  });
});

describe("normalizeRsvp", () => {
  it("rejects a missing name", () => {
    const result = normalizeRsvp({ name: " " });
    expect(result.ok).toBe(false);
  });

  it("defaults status to confirmed and trims the name", () => {
    const result = normalizeRsvp({ name: "  Ana Souza  ", companions: 2 });
    expect(result).toEqual({ ok: true, value: { name: "Ana Souza", contact: null, status: "confirmed", companions: 2 } });
  });

  it("keeps an explicit declined status and normalizes companions", () => {
    const result = normalizeRsvp({ name: "Beto", status: "declined", companions: -1, contact: "beto@x.com" });
    expect(result).toEqual({ ok: true, value: { name: "Beto", contact: "beto@x.com", status: "declined", companions: 0 } });
  });
});

describe("normalizeMessage", () => {
  it("requires a name and a message", () => {
    expect(normalizeMessage({ guestName: "Ana", message: "" }).ok).toBe(false);
    expect(normalizeMessage({ guestName: "", message: "oi" }).ok).toBe(false);
  });

  it("rejects an over-long message", () => {
    expect(normalizeMessage({ guestName: "Ana", message: "x".repeat(1001) }).ok).toBe(false);
  });

  it("trims and accepts a valid message", () => {
    expect(normalizeMessage({ guestName: "  Ana  ", message: "  Felicidades!  " })).toEqual({
      ok: true,
      value: { guestName: "Ana", message: "Felicidades!" }
    });
  });
});
