// Texturas em SVG inline (data-URI) para background-image.
// Uso típico: um pseudo-elemento cobrindo a seção, com `background-image: GRAIN`,
// `background-size` do tamanho do tile e a opacity recomendada abaixo.
// Todas desenham ruído preto sobre transparente — sobre fundo escuro, combine com
// `mix-blend-mode: screen` ou troque a cor no feFlood.

const svg = (markup: string) => `url("data:image/svg+xml,${encodeURIComponent(markup.replace(/\s+/g, " ").trim())}")`;

const NS = "xmlns='http://www.w3.org/2000/svg'";

/** Ruído fino tipo filme. opacity recomendada: 0.06–0.1 (claro) / 0.12 (sobre --forest com screen). Tile 200px. */
export const GRAIN = svg(`
<svg ${NS} width='200' height='200'>
  <filter id='f' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>
    <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch' seed='2'/>
    <feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.7 0.7 0.7 0 -0.3'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#f)'/>
</svg>`);

/** Fibra de papel de algodão, manchas suaves. opacity recomendada: 0.12–0.2. Tile 320px. */
export const PAPER = svg(`
<svg ${NS} width='320' height='320'>
  <filter id='f' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>
    <feTurbulence type='fractalNoise' baseFrequency='0.035' numOctaves='5' stitchTiles='stitch' seed='7' result='b'/>
    <feTurbulence type='fractalNoise' baseFrequency='0.6 0.04' numOctaves='2' stitchTiles='stitch' seed='3' result='fiber'/>
    <feBlend in='b' in2='fiber' mode='multiply' result='m'/>
    <feColorMatrix in='m' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.5 0.5 0.5 0 -0.18'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#f)'/>
</svg>`);

/** Trama de linho (fios cruzados + irregularidade). opacity recomendada: 0.1–0.16. Tile 240px. */
export const LINEN = svg(`
<svg ${NS} width='240' height='240'>
  <filter id='f' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>
    <feTurbulence type='fractalNoise' baseFrequency='0.9 0.05' numOctaves='2' stitchTiles='stitch' seed='5' result='h'/>
    <feTurbulence type='fractalNoise' baseFrequency='0.05 0.9' numOctaves='2' stitchTiles='stitch' seed='9' result='v'/>
    <feBlend in='h' in2='v' mode='multiply' result='w'/>
    <feColorMatrix in='w' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.6 0.6 0.6 0 -0.2'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#f)'/>
</svg>`);

/** Tela de pintura: trama regular visível + ruído. opacity recomendada: 0.08–0.14. Tile 240px. */
export const CANVAS = svg(`
<svg ${NS} width='240' height='240'>
  <defs>
    <pattern id='p' width='6' height='6' patternUnits='userSpaceOnUse'>
      <rect width='3' height='3' fill='black' fill-opacity='0.5'/>
      <rect x='3' y='3' width='3' height='3' fill='black' fill-opacity='0.5'/>
      <rect x='3' width='3' height='3' fill='black' fill-opacity='0.12'/>
      <rect y='3' width='3' height='3' fill='black' fill-opacity='0.12'/>
    </pattern>
    <filter id='f' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>
      <feTurbulence type='fractalNoise' baseFrequency='0.08' numOctaves='3' stitchTiles='stitch' seed='4' result='n'/>
      <feColorMatrix in='n' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.6 0.6 0.6 0 -0.2' result='na'/>
      <feComposite in='SourceGraphic' in2='na' operator='arithmetic' k1='0' k2='0.8' k3='0.6' k4='0'/>
    </filter>
  </defs>
  <rect width='100%' height='100%' fill='url(#p)' filter='url(#f)'/>
</svg>`);
