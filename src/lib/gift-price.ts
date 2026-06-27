/**
 * Gift price helpers. Gift prices are stored as free-form strings
 * ("R$ 280,00", "R$ 1.070,00", "Valor livre"). These normalize them into a
 * numeric amount for the Pix charge and a BRL-formatted label for display.
 */

export type GiftAmount = {
  /** True when the gift has no fixed price (guest chooses the amount). */
  isFree: boolean;
  /** Parsed numeric amount in BRL (0 when free). */
  amount: number;
  /** Display label, BRL-formatted or "Valor livre". */
  label: string;
};

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function parseGiftPrice(price: string): GiftAmount {
  const raw = (price ?? "").trim();
  // Keep only digits and separators, then turn pt-BR "1.070,00" into "1070.00".
  const normalized = raw
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const amount = Number(normalized);

  if (!raw || !Number.isFinite(amount) || amount <= 0) {
    return { isFree: true, amount: 0, label: "Valor livre" };
  }

  return { isFree: false, amount, label: formatBRL(amount) };
}
