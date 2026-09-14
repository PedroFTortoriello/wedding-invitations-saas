import { describe, it, expect } from "vitest";
import { normalizePixKey, isValidPixKey, buildPixPayload, crc16 } from "./pix";

describe("normalizePixKey", () => {
  it("telefone local ganha +55 (o bug da cliente: 11 dígitos sem código do país)", () => {
    expect(normalizePixKey("11987654321", "phone")).toBe("+5511987654321");
    expect(normalizePixKey("(11) 98765-4321", "phone")).toBe("+5511987654321");
    expect(normalizePixKey("011987654321", "phone")).toBe("+5511987654321"); // trunk 0
  });

  it("telefone que já tem 55 vira E.164 sem duplicar", () => {
    expect(normalizePixKey("5511987654321", "phone")).toBe("+5511987654321");
    expect(normalizePixKey("+55 11 98765-4321", "phone")).toBe("+5511987654321");
  });

  it("DDD 55 (RS) sem código do país não é confundido com código do país", () => {
    // DDD 55 + celular de 9 dígitos = 11 dígitos locais → prefixa +55.
    expect(normalizePixKey("55991234567", "phone")).toBe("+5555991234567");
  });

  it("cpf/cnpj viram só dígitos", () => {
    expect(normalizePixKey("123.456.789-00", "cpf")).toBe("12345678900");
    expect(normalizePixKey("12.345.678/0001-99", "cnpj")).toBe("12345678000199");
  });

  it("email vira minúsculo e sem espaços", () => {
    expect(normalizePixKey("  Casal@Email.com ", "email")).toBe("casal@email.com");
  });
});

describe("isValidPixKey", () => {
  it("telefone normalizado é válido; vazio é inválido", () => {
    expect(isValidPixKey(normalizePixKey("11987654321", "phone"), "phone")).toBe(true);
    expect(isValidPixKey(normalizePixKey("", "phone"), "phone")).toBe(false);
  });
  it("cpf precisa de 11 dígitos", () => {
    expect(isValidPixKey("12345678900", "cpf")).toBe(true);
    expect(isValidPixKey("123", "cpf")).toBe(false);
  });
});

describe("buildPixPayload", () => {
  it("fecha com o CRC16 correto e embute a chave normalizada", () => {
    const key = normalizePixKey("11987654321", "phone");
    const payload = buildPixPayload({
      pixKey: key,
      merchantName: "ANA LILIA",
      merchantCity: "ELIAS FAUSTO",
      amount: 150,
      txid: "ABC123"
    });
    expect(payload).toContain(key);
    // Os 4 últimos chars são o CRC do restante do payload.
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
  });
});
