/**
 * Início da contagem de receita por casamento (chave = id; o slug pode mudar). Presentes
 * criados antes de `since` ficam fora de somas, contagens e ticket médio do admin.
 * ponytail: exceções fixas no código; mover para uma coluna (weddings.revenue_since) se isso virar recorrente.
 */
export const REVENUE_CUTOFFS: Record<string, { since: string; reason: string }> = {
  // Rozano Júnior & Ana Lília: relatado em 13/08/2026 que o Pix não funcionava até então.
  "466535b3-4df5-4162-91f2-a754a73287cd": { since: "2026-08-13T00:00:00-03:00", reason: "Pix fora do ar antes" }
};

export function countsForRevenue(gift: { created_at: string }, weddingId: string) {
  const cutoff = REVENUE_CUTOFFS[weddingId];
  return !cutoff || Date.parse(gift.created_at) >= Date.parse(cutoff.since);
}
