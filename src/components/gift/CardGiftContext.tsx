"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CardFeePayer } from "@/lib/card-pricing";

/**
 * Configuração do presente no cartão para o site público. A página do servidor
 * (/casamento/[slug]) resolve se o casal conectou o Mercado Pago e injeta aqui; o
 * GiftRegistry lê sem que os 8 templates precisem repassar props. Sem provider
 * (prévias do /modelo, editor) o valor é null e o cartão simplesmente não aparece.
 */
export type CardGiftConfig = {
  feePayer: CardFeePayer;
  /** Taxa usada no repasse ao convidado (fração, ex.: 0.0499). */
  feeRate: number;
  maxInstallments: number;
  /** Conexão feita com credenciais de teste do MP (live_mode = false). */
  testMode: boolean;
};

const CardGiftContext = createContext<CardGiftConfig | null>(null);

export function CardGiftProvider({ value, children }: { value: CardGiftConfig | null; children: ReactNode }) {
  return <CardGiftContext.Provider value={value}>{children}</CardGiftContext.Provider>;
}

export function useCardGiftConfig(): CardGiftConfig | null {
  return useContext(CardGiftContext);
}
