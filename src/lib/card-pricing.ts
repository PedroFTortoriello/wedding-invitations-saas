import { formatBRL } from "@/lib/gift-price";
import type { CardFeePayer } from "@/lib/supabase/types";

export type { CardFeePayer };

/**
 * Regras de valor do presente no cartão (Mercado Pago). Puro e sem dependência de
 * Node: o diálogo do convidado usa para mostrar o total ANTES do checkout e a rota
 * do servidor usa de novo para cobrar — o servidor é a fonte da verdade.
 */

/** Piso anti-teste-de-cartão (mesmo mínimo praticado pelas listas de presente). */
export const CARD_MIN_AMOUNT = 10;
/** Teto por presente: limita o estrago de um cartão roubado na conta do casal. */
export const CARD_MAX_AMOUNT = 10000;
export const DEFAULT_CARD_MAX_INSTALLMENTS = 12;
/** Teto do Mercado Pago no Checkout Pro. */
export const CARD_INSTALLMENTS_LIMIT = 12;
/**
 * Taxa usada no repasse ao convidado: a de PROCESSAMENTO, no pior caso do
 * Checkout Pro (4,99% — saldo em conta "na hora"; o crédito sai por
 * 4,98%/4,49%/3,98% conforme o prazo escolhido pelo casal no MP).
 *
 * IMPORTANTE: isto cobre só a taxa de processamento. Os juros do parcelamento
 * são cobrados do CONVIDADO enquanto a conta do casal estiver em "parcelado
 * comprador" (o padrão do Mercado Pago). Se o casal ativar "parcelado vendedor"
 * (sem juros para o convidado), os juros saem do valor dele e nenhum repasse
 * calculado aqui cobre isso — não há API para ler essa configuração, por isso o
 * painel avisa o casal e MERCADOPAGO_MAX_INSTALLMENTS permite limitar as parcelas.
 * Sobrescreva a taxa com MERCADOPAGO_CARD_FEE_PERCENT se a tabela mudar.
 */
export const DEFAULT_CARD_FEE_RATE = 0.0499;

export type CardCharge = {
  /** Valor do presente escolhido pelo convidado. */
  giftAmount: number;
  /** Acréscimo da taxa cobrado do convidado (0 quando o casal paga a taxa). */
  feeAmount: number;
  /** Total cobrado no cartão (à vista; juros de parcelamento são do MP, à parte). */
  chargeAmount: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Arredonda PARA CIMA em centavos — o casal nunca fica abaixo do valor do presente. */
const ceil2 = (value: number) => Math.ceil(value * 100 - 1e-6) / 100;

export function computeCardCharge(
  giftAmount: number,
  feePayer: CardFeePayer,
  feeRate: number = DEFAULT_CARD_FEE_RATE
): CardCharge {
  const gift = round2(giftAmount);
  if (feePayer === "couple" || feeRate <= 0) {
    return { giftAmount: gift, feeAmount: 0, chargeAmount: gift };
  }
  // Gross-up: cobra o valor que, descontada a taxa do MP, devolve o presente inteiro.
  const charge = ceil2(gift / (1 - feeRate));
  return { giftAmount: gift, feeAmount: round2(charge - gift), chargeAmount: charge };
}

/** Mensagem de erro em pt-BR ou null quando o valor pode ir para o cartão. */
export function validateCardAmount(amount: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Informe um valor válido.";
  if (amount < CARD_MIN_AMOUNT) return `O valor mínimo no cartão é ${formatBRL(CARD_MIN_AMOUNT)}.`;
  if (amount > CARD_MAX_AMOUNT) return `O valor máximo no cartão é ${formatBRL(CARD_MAX_AMOUNT)}.`;
  return null;
}

/** Lê MERCADOPAGO_MAX_INSTALLMENTS (1–12); ausente ou fora da faixa cai em 12. */
export function cardMaxInstallmentsFromEnv(raw: string | undefined): number {
  const parsed = Number(String(raw ?? "").trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > CARD_INSTALLMENTS_LIMIT) {
    return DEFAULT_CARD_MAX_INSTALLMENTS;
  }
  return parsed;
}

/** Lê MERCADOPAGO_CARD_FEE_PERCENT (ex.: "4.99"); valor ausente/absurdo cai no padrão. */
export function cardFeeRateFromEnv(raw: string | undefined): number {
  const percent = Number(String(raw ?? "").replace(",", "."));
  if (!raw || !Number.isFinite(percent) || percent < 0 || percent >= 30) return DEFAULT_CARD_FEE_RATE;
  return percent / 100;
}
