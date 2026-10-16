"use client";

import { useId, useRef, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import {
  GIFT_BACKDROP_STYLE,
  GIFT_ZOOM_MAX,
  GIFT_ZOOM_MIN,
  giftImageStyle,
  normalizeGiftImage,
  type GiftImageFraming
} from "@/lib/gift-image";

type ImageAdjusterProps = {
  src: string;
  /** Proporção do quadro, ex. "3 / 4" — use GIFT_ASPECT_BY_TEMPLATE do modelo do casal. */
  aspect: string;
  value: GiftImageFraming;
  onChange: (next: GiftImageFraming) => void;
  className?: string;
};

const FITS = [
  { value: "contain", label: "Foto inteira" },
  { value: "cover", label: "Preencher o quadro" }
] as const;

const ARROWS: Record<string, [number, number] | undefined> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1]
};

/**
 * Ajuste não destrutivo de uma foto num quadro de proporção fixa (controlado:
 * value + onChange). A prévia usa o mesmo giftImageStyle do cartão público, então o
 * que o casal vê aqui é o corte real do site.
 */
export function ImageAdjuster({ src, aspect, value, onChange, className = "" }: ImageAdjusterProps) {
  const id = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const { x, y } = value.imageFocus;
  const zoomPct = Math.round(value.imageZoom * 100);

  // normalizeGiftImage limita o foco a 0–100 e arredonda.
  const setFocus = (fx: number, fy: number) => onChange(normalizeGiftImage({ ...value, imageFocus: { x: fx, y: fy } }));

  function focusFromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setFocus(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const arrow = ARROWS[event.key];
    if (!arrow) return;
    event.preventDefault();
    const step = event.shiftKey ? 1 : 5;
    setFocus(x + arrow[0] * step, y + arrow[1] * step);
  }

  return (
    <div className={`@container ${className}`}>
      <div className="grid gap-4 [--frame-h:15rem] @xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] @xl:items-start @xl:[--frame-h:13rem]">
        {/*
          Foco 2D num único controle: role="slider" com aria-valuetext descrevendo os
          dois eixos (setas movem 5%, Shift+setas 1%). Clique/arraste posiciona direto.
        */}
        <div
          ref={frameRef}
          role="slider"
          tabIndex={0}
          aria-label="Ponto de foco da foto"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(x)}
          aria-valuetext={`${Math.round(x)}% da esquerda, ${Math.round(y)}% do topo`}
          aria-describedby={`${id}-hint`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            frameRef.current?.focus({ preventScroll: true });
            focusFromPointer(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) focusFromPointer(event);
          }}
          onKeyDown={onKeyDown}
          className="relative cursor-crosshair touch-none justify-self-center overflow-hidden rounded-lg border border-line-strong bg-field select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest @xl:justify-self-start"
          style={{ aspectRatio: aspect, width: `min(100%, calc(var(--frame-h) * ${aspect}))` }}
        >
          {value.imageFit === "contain" ? (
            <Image src={src} alt="" aria-hidden fill sizes="320px" draggable={false} style={GIFT_BACKDROP_STYLE} />
          ) : null}
          <Image src={src} alt="" fill sizes="320px" draggable={false} style={giftImageStyle(value)} />
          <span
            aria-hidden
            className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-forest/40 shadow-[0_0_0_1.5px_rgb(26_30_21/0.75),0_2px_6px_rgb(26_30_21/0.35)]"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        </div>

        <div className="grid gap-4">
          {/*
            Botões aria-pressed (não rádios): o ajustador vive dentro de <form action>, e o
            reset automático do React 19 desalinharia rádios controlados do estado.
          */}
          <div
            role="group"
            aria-label="Enquadramento da foto"
            className="grid grid-cols-[auto_auto] gap-1 justify-self-start rounded-full border border-line-strong bg-field p-1"
          >
            {FITS.map((fit) => {
              const pressed = value.imageFit === fit.value;
              return (
                <button
                  key={fit.value}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => onChange({ ...value, imageFit: fit.value })}
                  className={`min-h-9 rounded-full px-3.5 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest motion-reduce:transition-none ${
                    pressed ? "bg-forest text-on-forest" : "text-ink hover:bg-forest/8"
                  }`}
                >
                  {fit.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`${id}-zoom`} className="text-sm font-medium text-ink">
                Zoom
              </label>
              <output htmlFor={`${id}-zoom`} className="text-sm font-semibold tabular-nums text-ink-soft">
                {zoomPct}%
              </output>
            </div>
            <input
              id={`${id}-zoom`}
              type="range"
              min={GIFT_ZOOM_MIN * 100}
              max={GIFT_ZOOM_MAX * 100}
              step={5}
              value={zoomPct}
              aria-valuetext={`${zoomPct}%`}
              onChange={(event) => onChange({ ...value, imageZoom: Number(event.target.value) / 100 })}
              className="h-6 w-full cursor-pointer accent-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            />
          </div>

          <div className="flex items-start justify-between gap-3">
            <p id={`${id}-hint`} className="text-[0.8125rem] leading-5 text-ink-soft">
              Clique ou arraste na prévia para escolher o ponto de foco. O quadro tem o formato do cartão no site.
            </p>
            <button
              type="button"
              onClick={() => setFocus(50, 50)}
              disabled={x === 50 && y === 50}
              className="btn btn-sm btn-ghost min-h-9 shrink-0 px-3"
            >
              Centralizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
