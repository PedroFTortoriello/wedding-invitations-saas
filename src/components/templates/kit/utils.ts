import type { WeddingLocation, WeddingScheduleItem, WeddingSite } from "@/types/wedding";

/**
 * Utilidades de dados compartilhadas pelos modelos (sem JSX, sem estilo): cada
 * modelo decide a composição; aqui só o tratamento dos casos de borda do conteúdo
 * (nomes longos, campos vazios, programação ausente) para que todos se comportem igual.
 */

/** "Helena Ribeiro & Lucas Moreira" -> ["Helena Ribeiro", "Lucas Moreira"]; sem separador, o nome inteiro e "". */
export function splitCouple(names: string): [string, string] {
  const parts = names
    .split(/\s*&\s*|\s+e\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(" & ")];
  return [names.trim(), ""];
}

/** Primeiro nome de cada pessoa ("Helena" e "Lucas"), para títulos curtos. */
export function firstNames(names: string): [string, string] {
  const [a, b] = splitCouple(names);
  const first = (name: string) => name.split(/\s+/)[0] ?? "";
  return [first(a), first(b)];
}

/** Iniciais ("H", "L") a partir dos nomes; monograma do site quando os nomes faltam. */
export function initials(names: string, fallback = "♥"): [string, string] {
  const [a, b] = splitCouple(names);
  const letter = (name: string) => name.trim().charAt(0).toUpperCase();
  return a && b ? [letter(a), letter(b)] : [fallback, ""];
}

/** Ano do casamento ("2026") ou "" sem data válida. */
export function weddingYear(wedding: Pick<WeddingSite, "weddingDate">): string {
  const date = wedding.weddingDate ? new Date(wedding.weddingDate) : null;
  return date && Number.isFinite(date.getTime()) ? String(date.getFullYear()) : "";
}

/** Dia e mês numéricos ("05", "12") para composições com a data em numerais; vazios sem data. */
export function dateParts(wedding: Pick<WeddingSite, "weddingDate">): { day: string; month: string; year: string } {
  const date = wedding.weddingDate ? new Date(wedding.weddingDate) : null;
  if (!date || !Number.isFinite(date.getTime())) return { day: "", month: "", year: "" };
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    year: String(date.getFullYear())
  };
}

/** Nome do mês em pt-BR ("dezembro") ou "" sem data. */
export function monthName(wedding: Pick<WeddingSite, "weddingDate">): string {
  const date = wedding.weddingDate ? new Date(wedding.weddingDate) : null;
  if (!date || !Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
}

/** Local principal, só se tiver ao menos venue ou cidade (o inicial vem vazio). */
export function mainLocation(wedding: Pick<WeddingSite, "locations">): WeddingLocation | null {
  const location = wedding.locations[0];
  return location && (location.venue || location.city) ? location : null;
}

/** "Fazenda Três Ipês · Itu, SP" ou o que existir; "Em breve" sem nada. */
export function placeLine(wedding: Pick<WeddingSite, "locations">, fallback = "Em breve"): string {
  const location = mainLocation(wedding);
  if (!location) return fallback;
  return [location.venue, location.city].filter(Boolean).join(" · ");
}

/** URL do iframe do Google Maps (sem API key) a partir de venue, endereço e cidade. */
export function mapEmbedUrl(location: WeddingLocation): string {
  const query = encodeURIComponent([location.venue, location.address, location.city].filter(Boolean).join(", "));
  return `https://www.google.com/maps?q=${query}&z=14&hl=pt-BR&output=embed`;
}

/** Link "Abrir no Google Maps": o mapUrl do casal ou uma busca pelo endereço. */
export function mapLink(location: WeddingLocation): string {
  if (location.mapUrl) return location.mapUrl;
  const query = encodeURIComponent([location.venue, location.address, location.city].filter(Boolean).join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/** Programação do casal; vazia, não há seção (nunca inventar horários no modelo). */
export function program(wedding: Pick<WeddingSite, "schedule">): WeddingScheduleItem[] {
  return wedding.schedule.filter((item) => item.title.trim());
}

/** Cartões de informação ativos. */
export function activeCards(wedding: Pick<WeddingSite, "detailCards">) {
  return wedding.detailCards.filter((card) => card.active && card.title.trim());
}

/** Cotas de presente ativas: sem nenhuma, a seção de presentes não aparece. */
export function activeGifts(wedding: Pick<WeddingSite, "gifts">) {
  return wedding.gifts.filter((gift) => gift.active);
}

/** Linhas do destaque de um momento ("quando o simples\npassou a ser raro."), sem vazias. */
export function headlineLines(headline: string): string[] {
  return headline
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Momentos da história com algum texto (o inicial tem título e descrição, sem destaque). */
export function storyMoments(wedding: Pick<WeddingSite, "storyMoments">) {
  return wedding.storyMoments.filter((moment) => moment.title.trim() || moment.description.trim() || moment.headline.trim());
}

/** Nome longo? Para reduzir a escala do título do hero via classe/atributo (não para cortar). */
export function nameScale(names: string): "short" | "medium" | "long" {
  const longest = Math.max(...splitCouple(names).map((part) => part.length), 0);
  if (longest > 18 || names.length > 34) return "long";
  if (longest > 12 || names.length > 24) return "medium";
  return "short";
}
