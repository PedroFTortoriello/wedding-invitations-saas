/**
 * Telefone brasileiro → E.164 só com dígitos (55 + DDD + número), ou null.
 * Aceita 10–11 dígitos locais (DDD + fixo/celular) ou os mesmos com o 55 na frente;
 * pontuação, espaços e "+" são ignorados. É o formato da coluna profiles.whatsapp
 * (migration 0012). Usado no cadastro (navegador) e nas actions do servidor.
 */
export function toBrazilE164(input: string): string | null {
  let digits = input.slice(0, 40).replace(/\D/g, "");
  if (digits.length === 12 || digits.length === 13) {
    if (!digits.startsWith("55")) return null;
    digits = digits.slice(2);
  }
  // DDD sem zero; celular com 9 dígitos começando em 9, fixo com 8 começando em 2–8.
  return /^[1-9]{2}(9\d{8}|[2-8]\d{7})$/.test(digits) ? `55${digits}` : null;
}
