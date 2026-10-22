/*
 * Padrão de azulejo como data-URI para background-image (o kit só tem o módulo
 * <TileAzulejo> em React; o desenho é o mesmo). Usado na capa, na galeria e no rodapé.
 */
const TILE_MARKUP = [
  "<rect x='0' y='0' width='100' height='100'/>",
  "<path d='M50 6 L94 50 L50 94 L6 50Z'/>",
  "<path d='M0 22 A22 22 0 0 0 22 0 M78 0 A22 22 0 0 0 100 22 M100 78 A22 22 0 0 0 78 100 M22 100 A22 22 0 0 0 0 78'/>",
  "<circle cx='50' cy='50' r='9'/>",
  "<circle cx='50' cy='50' r='2' fill='currentColor' stroke='none'/>",
  "<path d='M50 41 C60 32 57.5 15.5 50 11 C42.5 15.5 40 32 50 41Z'/>",
  "<path d='M59 50 C68 60 84.5 57.5 89 50 C84.5 42.5 68 40 59 50Z'/>",
  "<path d='M50 59 C40 68 42.5 84.5 50 89 C57.5 84.5 60 68 50 59Z'/>",
  "<path d='M41 50 C32 40 15.5 42.5 11 50 C15.5 57.5 32 60 41 50Z'/>",
  "<circle cx='50' cy='14' r='1.6' fill='currentColor' stroke='none'/>",
  "<circle cx='86' cy='50' r='1.6' fill='currentColor' stroke='none'/>",
  "<circle cx='50' cy='86' r='1.6' fill='currentColor' stroke='none'/>",
  "<circle cx='14' cy='50' r='1.6' fill='currentColor' stroke='none'/>"
].join("");

/** `url("data:image/svg+xml,…")` do azulejo em uma cor; `background-size` define o tamanho do módulo. */
export function tilePattern(color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='${color}' color='${color}' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'>${TILE_MARKUP}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
