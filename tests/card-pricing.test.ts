import { describe, expect, it } from "vitest";
import {
  CARD_MAX_AMOUNT,
  CARD_MIN_AMOUNT,
  DEFAULT_CARD_FEE_RATE,
  DEFAULT_CARD_MAX_INSTALLMENTS,
  cardFeeRateFromEnv,
  cardMaxInstallmentsFromEnv,
  computeCardCharge,
  validateCardAmount
} from "@/lib/card-pricing";

describe("computeCardCharge", () => {
  it("convidado paga a taxa: gross-up de R$500 a 4,99% = R$526,27", () => {
    const charge = computeCardCharge(500, "guest", 0.0499);
    expect(charge).toEqual({ giftAmount: 500, feeAmount: 26.27, chargeAmount: 526.27 });
  });

  it("depois da taxa do MP o casal recebe pelo menos o valor do presente", () => {
    for (const amount of [10, 37.5, 99.99, 150, 280, 1070, 9999.99, CARD_MAX_AMOUNT]) {
      const { chargeAmount } = computeCardCharge(amount, "guest", DEFAULT_CARD_FEE_RATE);
      expect(chargeAmount * (1 - DEFAULT_CARD_FEE_RATE)).toBeGreaterThanOrEqual(amount);
      // e nunca mais que 1 centavo acima do necessário
      expect((chargeAmount - 0.01) * (1 - DEFAULT_CARD_FEE_RATE)).toBeLessThan(amount);
    }
  });

  it("casal paga a taxa: o convidado paga exatamente o valor do presente", () => {
    expect(computeCardCharge(500, "couple")).toEqual({ giftAmount: 500, feeAmount: 0, chargeAmount: 500 });
  });

  it("taxa zero não gera acréscimo e o valor é arredondado em centavos", () => {
    expect(computeCardCharge(100.005, "guest", 0)).toEqual({ giftAmount: 100.01, feeAmount: 0, chargeAmount: 100.01 });
  });
});

describe("validateCardAmount", () => {
  it("aceita valores dentro da faixa", () => {
    expect(validateCardAmount(CARD_MIN_AMOUNT)).toBeNull();
    expect(validateCardAmount(150)).toBeNull();
    expect(validateCardAmount(CARD_MAX_AMOUNT)).toBeNull();
  });

  it("recusa abaixo do mínimo, acima do máximo e lixo", () => {
    expect(validateCardAmount(9.99)).toMatch(/mínimo/);
    expect(validateCardAmount(CARD_MAX_AMOUNT + 0.01)).toMatch(/máximo/);
    expect(validateCardAmount(Number.NaN)).toMatch(/válido/);
    expect(validateCardAmount(0)).toMatch(/válido/);
  });
});

describe("cardMaxInstallmentsFromEnv", () => {
  it("aceita 1 a 12", () => {
    expect(cardMaxInstallmentsFromEnv("1")).toBe(1);
    expect(cardMaxInstallmentsFromEnv("6")).toBe(6);
    expect(cardMaxInstallmentsFromEnv("12")).toBe(12);
  });

  it("cai no padrão fora da faixa, quebrado ou ausente", () => {
    for (const raw of [undefined, "", "0", "13", "2.5", "doze", "-3"]) {
      expect(cardMaxInstallmentsFromEnv(raw)).toBe(DEFAULT_CARD_MAX_INSTALLMENTS);
    }
  });
});

describe("cardFeeRateFromEnv", () => {
  it("usa o padrão sem env ou com valor inválido", () => {
    expect(cardFeeRateFromEnv(undefined)).toBe(DEFAULT_CARD_FEE_RATE);
    expect(cardFeeRateFromEnv("")).toBe(DEFAULT_CARD_FEE_RATE);
    expect(cardFeeRateFromEnv("abc")).toBe(DEFAULT_CARD_FEE_RATE);
    expect(cardFeeRateFromEnv("45")).toBe(DEFAULT_CARD_FEE_RATE);
  });

  it("converte percentual (com ponto ou vírgula) em fração", () => {
    expect(cardFeeRateFromEnv("4.49")).toBeCloseTo(0.0449);
    expect(cardFeeRateFromEnv("3,98")).toBeCloseTo(0.0398);
    expect(cardFeeRateFromEnv("0")).toBe(0);
  });
});
