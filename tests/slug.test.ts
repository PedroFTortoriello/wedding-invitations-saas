import { describe, expect, it } from "vitest";
import { isValidSlug, slugify } from "@/lib/slug";

describe("slugify", () => {
  it("turns couple names with & into a kebab slug", () => {
    expect(slugify("Pedro & Rafaela")).toBe("pedro-e-rafaela");
  });

  it("strips accents", () => {
    expect(slugify("João e María")).toBe("joao-e-maria");
  });

  it("trims symbols, spaces and repeated dashes", () => {
    expect(slugify("  --Hello World!!  ")).toBe("hello-world");
  });

  it("collapses internal punctuation", () => {
    expect(slugify("Ana, Beto & Cia.")).toBe("ana-beto-e-cia");
  });

  it("caps length at 60 chars without trailing dash", () => {
    const long = slugify("a".repeat(80));
    expect(long.length).toBeLessThanOrEqual(60);
    expect(long.endsWith("-")).toBe(false);
  });
});

describe("isValidSlug", () => {
  it("accepts a normal kebab slug", () => {
    expect(isValidSlug("pedro-e-rafaela")).toBe(true);
  });

  it("rejects too short slugs", () => {
    expect(isValidSlug("ab")).toBe(false);
  });

  it("rejects reserved route names", () => {
    expect(isValidSlug("admin")).toBe(false);
    expect(isValidSlug("login")).toBe(false);
  });

  it("rejects uppercase and bad characters", () => {
    expect(isValidSlug("Pedro")).toBe(false);
    expect(isValidSlug("pedro_rafaela")).toBe(false);
  });

  it("rejects leading, trailing or doubled dashes", () => {
    expect(isValidSlug("-pedro")).toBe(false);
    expect(isValidSlug("pedro-")).toBe(false);
    expect(isValidSlug("pedro--rafaela")).toBe(false);
  });
});
