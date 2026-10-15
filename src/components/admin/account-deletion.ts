/**
 * Regras puras de "Ver conta" (modo suporte) e "Apagar conta" no admin. Sem rede e sem
 * imports de servidor: usadas pela página, pela action e pelo formulário (cliente).
 */

/** Por que a conta não aceita ações de suporte/exclusão: a própria conta do admin ou outro admin. */
export function accountActionBlock(input: { adminId: string; targetId: string; targetRole: string | null | undefined }) {
  if (input.targetId === input.adminId) return "self" as const;
  if (input.targetRole === "admin") return "admin" as const;
  return null;
}

export const normalizeEmail = (value: unknown) => (typeof value === "string" ? value.trim().toLowerCase() : "");

/** A confirmação exige o e-mail da conta digitado igual (sem caixa, sem espaços nas pontas). */
export function emailConfirmationMatches(typed: unknown, accountEmail: string | null | undefined) {
  const expected = normalizeEmail(accountEmail);
  return expected !== "" && normalizeEmail(typed) === expected;
}

/** Resumo do que some junto com a conta (calculado no servidor com service role). */
export type DeletionImpact = {
  userId: string;
  email: string | null;
  name: string | null;
  wedding: {
    id: string;
    slug: string;
    status: string;
    coupleNames: string;
    publishPaidAt: string | null;
  } | null;
  /** Soma de publish_payments pagos, em centavos (0 = cortesia ou não pago). */
  paymentsPaidCents: number;
  guests: number;
  messages: number;
  cashGifts: number;
  cashGiftsPaid: number;
  /** Total bruto dos presentes pagos, em reais. */
  cashGiftsPaidTotal: number;
  giftCotas: number;
  role: string | null;
  /** Caminhos no bucket wedding-photos sob <userId>/. */
  photoPaths: string[];
  /** A listagem do storage falhou: photoPaths veio vazio. */
  photosListFailed: boolean;
  mpConnected: boolean;
};

/** Site no ar, taxa paga ou presentes recebidos: pede o aviso destacado. */
export function isHighStakes(impact: Pick<DeletionImpact, "wedding" | "paymentsPaidCents" | "cashGiftsPaid">) {
  return (
    impact.wedding?.status === "published" ||
    Boolean(impact.wedding?.publishPaidAt) ||
    impact.paymentsPaidCents > 0 ||
    impact.cashGiftsPaid > 0
  );
}

/** Lotes para storage.remove (a API aceita listas curtas; usamos no máximo 100). */
export function chunk<T>(list: T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}
