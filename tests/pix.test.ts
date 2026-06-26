import { describe, expect, it } from "vitest";
import { buildPixPayload, createPixCharge, createPixTxid, crc16 } from "@/lib/pix";

const recipient = {
  pixKey: "pedro.rafaela@email.com",
  merchantName: "Pedro & Rafaela",
  merchantCity: "Porto Feliz, SP"
};

// Independent CRC-16/CCITT-FALSE reference (a distinct implementation) so the
// payload-trailer assertions are NOT tautological against the production crc16:
// a polynomial/seed regression in crc16 would diverge from this and fail.
function refCrc16(input: string): string {
  const poly = 0x1021;
  let crc = 0xffff;
  for (const char of input) {
    crc ^= (char.charCodeAt(0) & 0xff) << 8;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ poly) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Minimal EMV TLV walker for top-level fields (id[2] + len[2] + value[len]).
function parseEmv(payload: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;
  while (i + 4 <= payload.length) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    if (!Number.isInteger(len)) break;
    fields[id] = payload.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return fields;
}

describe("crc16 (CRC16-CCITT/FALSE)", () => {
  it("matches the canonical check value 0x29B1 for '123456789'", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("agrees with an independent reference implementation (also anchored to 0x29B1)", () => {
    expect(refCrc16("123456789")).toBe("29B1");
    for (const sample of ["", "000201", "BR.GOV.BCB.PIX", "5406150.00"]) {
      expect(crc16(sample)).toBe(refCrc16(sample));
    }
  });

  it("returns an uppercase 4-char hex string", () => {
    expect(crc16("000201")).toMatch(/^[0-9A-F]{4}$/);
  });
});

describe("buildPixPayload", () => {
  const payload = buildPixPayload({
    pixKey: recipient.pixKey,
    merchantName: recipient.merchantName,
    merchantCity: recipient.merchantCity,
    amount: 150,
    txid: "ABC123",
    description: "Presente"
  });
  const fields = parseEmv(payload);

  it("starts with the EMV payload-format header (000201)", () => {
    expect(payload.startsWith("000201")).toBe(true);
    expect(fields["00"]).toBe("01");
  });

  it("embeds the Pix GUI and the couple's own Pix key in field 26", () => {
    expect(fields["26"]).toContain("br.gov.bcb.pix");
    expect(fields["26"]).toContain(recipient.pixKey);
  });

  it("sets MCC 0000, currency 986 (BRL) and country BR", () => {
    expect(fields["52"]).toBe("0000");
    expect(fields["53"]).toBe("986");
    expect(fields["58"]).toBe("BR");
  });

  it("encodes the exact transaction amount in field 54 (two decimals)", () => {
    expect(fields["54"]).toBe("150.00");
  });

  it("ends with a CRC trailer that an INDEPENDENT CRC implementation confirms", () => {
    const body = payload.slice(0, -4);
    expect(body.endsWith("6304")).toBe(true);
    expect(payload.slice(-4)).toBe(refCrc16(body));
    expect(fields["63"]).toBe(refCrc16(body));
  });

  it("ASCII-folds and uppercases accented merchant name/city (fields 59/60)", () => {
    const accented = buildPixPayload({
      pixKey: recipient.pixKey,
      merchantName: "João & Conceição",
      merchantCity: "São Paulo",
      amount: 99.9,
      txid: "XYZ"
    });
    const f = parseEmv(accented);
    expect(f["59"]).toMatch(/^[A-Z0-9 $%*+\-./:]*$/); // only EMV-allowed chars, no combining marks
    expect(f["59"]).toContain("JOAO");
    expect(f["59"]).toContain("CONCEICAO");
    expect(f["59"]).not.toMatch(/[ãç]/i);
    expect(f["60"]).toBe("SAO PAULO");
    expect(accented.slice(-4)).toBe(refCrc16(accented.slice(0, -4)));
  });
});

describe("createPixCharge", () => {
  it("encodes the SAME amount in the QR payload as the gross (no skim — 100% to the couple)", async () => {
    const charge = await createPixCharge(
      { weddingSiteId: "wedding_demo", guestName: "Maria", amount: 200 },
      recipient
    );

    expect(charge.grossAmount).toBe(200);
    expect(parseEmv(charge.payload)["54"]).toBe("200.00");
    expect(parseEmv(charge.payload)["54"]).toBe(charge.grossAmount.toFixed(2));
  });

  it("carries no platform-fee fields", async () => {
    const charge = await createPixCharge(
      { weddingSiteId: "w", guestName: "Maria", amount: 200 },
      recipient
    );
    expect(charge).not.toHaveProperty("feeAmount");
    expect(charge).not.toHaveProperty("netAmount");
    expect(charge).not.toHaveProperty("feePercent");
  });

  it("sends to the couple's own Pix key with a valid (independently-checked) trailer", async () => {
    const charge = await createPixCharge(
      { weddingSiteId: "w", guestName: "Maria", amount: 50 },
      recipient
    );
    expect(charge.pixKey).toBe(recipient.pixKey);
    expect(charge.payload).toContain(recipient.pixKey);
    expect(charge.payload.slice(-4)).toBe(refCrc16(charge.payload.slice(0, -4)));
  });

  it.each([0.5, 0.999, 0, -5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid amount %p",
    async (amount) => {
      await expect(
        createPixCharge({ weddingSiteId: "w", guestName: "Ana", amount }, recipient)
      ).rejects.toThrow();
    }
  );

  it("accepts the R$ 1,00 lower boundary", async () => {
    const charge = await createPixCharge(
      { weddingSiteId: "w", guestName: "Ana", amount: 1 },
      recipient
    );
    expect(charge.grossAmount).toBe(1);
    expect(parseEmv(charge.payload)["54"]).toBe("1.00");
  });

  it("rejects an empty guest name", async () => {
    await expect(
      createPixCharge({ weddingSiteId: "w", guestName: "   ", amount: 50 }, recipient)
    ).rejects.toThrow();
  });

  it("rejects a recipient without a Pix key (there is no global fallback key)", async () => {
    await expect(
      createPixCharge(
        { weddingSiteId: "w", guestName: "Ana", amount: 50 },
        { pixKey: "  ", merchantName: "X", merchantCity: "Y" }
      )
    ).rejects.toThrow();
  });
});

describe("createPixTxid", () => {
  it("is uppercase alphanumeric and never exceeds the 25-char BR Code limit, even for very long ids", () => {
    const txid = createPixTxid(`wedding_${"x".repeat(60)}`);
    expect(txid).toMatch(/^[A-Z0-9]+$/);
    expect(txid.length).toBeGreaterThan(0);
    expect(txid.length).toBeLessThanOrEqual(25);
  });
});
