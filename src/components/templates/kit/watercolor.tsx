"use client";

import { useId, type CSSProperties } from "react";

type WashProps = {
  /** Cor do pigmento (qualquer cor CSS). */
  color: string;
  /** Muda a forma da borda e do granulado. */
  seed?: number;
  className?: string;
  style?: CSSProperties;
};

const BLOBS = [
  { cx: 170, cy: 150, rx: 150, ry: 92, rot: -12, op: 0.35 },
  { cx: 232, cy: 140, rx: 118, ry: 84, rot: 16, op: 0.5 },
  { cx: 200, cy: 166, rx: 92, ry: 58, rot: -5, op: 0.7 },
];

/** Mancha de aquarela orgânica: borda irregular, pigmento acumulado na borda e granulado. */
export function WatercolorWash({ color, seed = 3, className, style }: WashProps) {
  const id = useId();
  const edge = `${id}-edge`;
  const grain = `${id}-grain`;
  return (
    <svg viewBox="0 0 400 300" className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        <filter id={edge} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed={seed} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="52" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="1.1" />
        </filter>
        <filter id={grain} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed={seed} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="52" xChannelSelector="R" yChannelSelector="G" result="shape" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed + 7} result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.1" result="alpha" />
          <feComposite in="shape" in2="alpha" operator="in" />
        </filter>
      </defs>
      {/* lavagem: três camadas sobrepostas, com a borda escurecida pelo stroke borrado */}
      <g filter={`url(#${edge})`} fill={color} stroke={color} strokeWidth="5" strokeOpacity="0.35">
        {BLOBS.map((b) => (
          <ellipse key={b.cx} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fillOpacity={b.op} transform={`rotate(${b.rot} ${b.cx} ${b.cy})`} />
        ))}
      </g>
      {/* granulado do pigmento, recortado pela mesma forma */}
      <g filter={`url(#${grain})`} fill={color} opacity="0.5">
        {BLOBS.map((b) => (
          <ellipse key={b.cx} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} transform={`rotate(${b.rot} ${b.cx} ${b.cy})`} />
        ))}
      </g>
    </svg>
  );
}

/**
 * Faixa horizontal com borda inferior de aquarela, para transição entre seções.
 * Estica (preserveAspectRatio="none"); dê width 100% e a altura desejada via CSS.
 */
export function WatercolorEdge({ color, seed = 4, className, style }: WashProps) {
  const id = useId();
  return (
    <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        <filter id={id} x="-5%" y="-30%" width="110%" height="160%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.03" numOctaves="2" seed={seed} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="18" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="1.4" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} fill={color}>
        <path
          fillOpacity="0.55"
          d="M0 0 H1200 V40 C1120 52 1060 30 980 44 C900 58 840 34 760 46 C680 58 620 32 540 42 C460 52 400 30 320 44 C240 58 160 34 80 46 C50 50 20 48 0 44Z"
        />
        <path d="M0 0 H1200 V30 C1110 40 1050 22 970 34 C890 46 830 24 750 36 C670 48 610 24 530 32 C450 40 390 22 310 34 C230 46 150 24 70 36 C40 40 20 38 0 34Z" />
      </g>
    </svg>
  );
}
