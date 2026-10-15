import { whatsappLink } from "@/lib/company";

/**
 * Termos de uso e Política de privacidade (/termos, /privacidade).
 *
 * LEGAL_DRAFT: textos escritos a partir do que o sistema faz, ainda SEM revisão
 * jurídica. Enquanto for true, as duas páginas mostram o aviso "Versão preliminar".
 * Ao trocar qualquer regra do texto, atualize LEGAL_UPDATED_AT.
 */
export const LEGAL_DRAFT = true;
export const LEGAL_UPDATED_AT = "16/09/2026";

/** 5511942716215 → (11) 94271-6215 */
export function formatWhatsapp(e164: string): string {
  const m = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : `+${e164}`;
}

export const LEGAL_WHATSAPP_URL = whatsappLink("Olá! Tenho uma dúvida sobre os termos ou a privacidade da Noivar.");
