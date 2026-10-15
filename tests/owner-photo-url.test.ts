import { describe, expect, it } from "vitest";
import { isOwnerPhotoUrl } from "@/lib/wedding";

const BASE = "https://abc.supabase.co";
const OWNER = "11111111-2222-3333-4444-555555555555";
const DIR = `${BASE}/storage/v1/object/public/wedding-photos/${OWNER}/`;

describe("isOwnerPhotoUrl", () => {
  it("aceita foto na pasta do dono", () => {
    expect(isOwnerPhotoUrl(`${DIR}gift-1.jpg`, OWNER, BASE)).toBe(true);
  });

  it("recusa ../ e variantes codificadas que saem da pasta", () => {
    expect(isOwnerPhotoUrl(`${DIR}../OUTRO/a.jpg`, OWNER, BASE)).toBe(false);
    expect(isOwnerPhotoUrl(`${DIR}%2e%2e/OUTRO/a.jpg`, OWNER, BASE)).toBe(false);
    expect(isOwnerPhotoUrl(`${DIR}..%2fOUTRO%2fa.jpg`, OWNER, BASE)).toBe(false);
    expect(isOwnerPhotoUrl(`${DIR}..\\OUTRO\\a.jpg`, OWNER, BASE)).toBe(false);
  });

  it("recusa outro host, outra pasta e lixo", () => {
    expect(isOwnerPhotoUrl(`https://evil.com/storage/v1/object/public/wedding-photos/${OWNER}/a.jpg`, OWNER, BASE)).toBe(false);
    expect(isOwnerPhotoUrl(`${BASE}/storage/v1/object/public/wedding-photos/OUTRO/a.jpg`, OWNER, BASE)).toBe(false);
    expect(isOwnerPhotoUrl("não é url", OWNER, BASE)).toBe(false);
    expect(isOwnerPhotoUrl(`${DIR}a.jpg`, OWNER, undefined)).toBe(false);
  });
});
