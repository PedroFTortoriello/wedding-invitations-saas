import { describe, expect, it } from "vitest";
import { clientIp, hashIp, ipBucket } from "@/lib/ai-rate-limit";
import { toBrazilE164 } from "@/lib/phone";

describe("toBrazilE164 (WhatsApp do cadastro)", () => {
  it("aceita celular e fixo com DDD, com ou sem 55 e pontuação", () => {
    expect(toBrazilE164("(11) 91234-5678")).toBe("5511912345678");
    expect(toBrazilE164("+55 11 91234-5678")).toBe("5511912345678");
    expect(toBrazilE164("1132345678")).toBe("551132345678");
  });

  it("recusa número sem DDD, DDD com zero, celular sem o 9 e outro país", () => {
    expect(toBrazilE164("91234-5678")).toBeNull();
    expect(toBrazilE164("01191234567")).toBeNull();
    expect(toBrazilE164("11812345678")).toBeNull();
    expect(toBrazilE164("+1 415 555 0100")).toBeNull();
    expect(toBrazilE164("")).toBeNull();
  });
});

describe("limite da IA por IP", () => {
  const hdrs = (entries: Record<string, string>) => ({ get: (name: string) => entries[name] ?? null });

  it("prefere o x-vercel-forwarded-for, que só a Vercel escreve", () => {
    expect(clientIp(hdrs({ "x-vercel-forwarded-for": "177.1.1.1", "x-forwarded-for": "10.0.0.9" }))).toBe("177.1.1.1");
  });

  it("conta o IPv6 pelo prefixo /64 e o IPv4 inteiro", () => {
    expect(ipBucket("2804:14c:1:2::1")).toBe(ipBucket("2804:14c:1:2:ffff::9"));
    expect(ipBucket("2804:14c:1:2::1")).toBe("2804:014c:0001:0002::/64");
    expect(ipBucket("2804:14c:1:3::1")).not.toBe(ipBucket("2804:14c:1:2::1"));
    expect(ipBucket("fe80::1%eth0")).toBe("fe80:0000:0000:0000::/64");
    expect(ipBucket("::ffff:200.1.2.3")).toBe("200.1.2.3");
    expect(ipBucket("200.1.2.3")).toBe("200.1.2.3");
  });

  it("usa o primeiro IP do x-forwarded-for, depois o x-real-ip", () => {
    expect(clientIp(hdrs({ "x-forwarded-for": "200.1.2.3, 10.0.0.1" }))).toBe("200.1.2.3");
    expect(clientIp(hdrs({ "x-real-ip": "200.9.9.9" }))).toBe("200.9.9.9");
    expect(clientIp(hdrs({}))).toBe("unknown");
  });

  it("guarda só um HMAC do IP: estável com a mesma chave, diferente com outra, sem o IP dentro", () => {
    const a = hashIp("200.1.2.3", "chave");
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(hashIp("200.1.2.3", "chave")).toBe(a);
    expect(hashIp("200.1.2.4", "chave")).not.toBe(a);
    expect(hashIp("200.1.2.3", "outra")).not.toBe(a);
    expect(a).not.toContain("200.1.2.3");
  });
});
