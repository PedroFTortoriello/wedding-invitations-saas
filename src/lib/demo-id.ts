/**
 * Id do casamento de demonstração (/modelo/<template>/helena-e-lucas). Os formulários
 * dos modelos (confirmação, recado, busca de nome, Pix, cartão) checam este id para
 * NÃO chamar a API na demo: mostram o resultado simulado e nunca geram Pix pagável.
 */
export const DEMO_WEDDING_ID = "wedding_helena_lucas";

export const isDemoWedding = (weddingId: string | null | undefined) => weddingId === DEMO_WEDDING_ID;

/** Sufixo das mensagens de sucesso simuladas na demo. */
export const DEMO_SENT_NOTE = " (demonstração: nada foi enviado)";
