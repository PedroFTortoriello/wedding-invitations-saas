"use client";

import { useEffect, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Shared motion primitives for the premium wedding templates.
 *
 * Design rule (from the design system): reveals must ENHANCE an already-visible
 * default. Reveal usa o scroll-reveal global (data-reveal + RevealObserver +
 * globals.css): o HTML do servidor sai visível, e só com .js e sem
 * reduced-motion o CSS esconde até entrar na tela.
 */

/** Tags Reveal can render as. Polymorphic so it can wrap list items, figures, etc. */
type RevealTag = "div" | "li" | "ul" | "ol" | "section" | "article" | "figure" | "span" | "header";

type RevealProps = {
  as?: RevealTag;
  /** Vertical travel of the entrance, px (padrão do CSS: 16). */
  y?: number;
  /** Seconds to delay the entrance (for hand-tuned staggers). */
  delay?: number;
  /** Entrance duration, seconds (padrão do CSS: 0.55). */
  duration?: number;
  /**
   * ponytail: no-op — o RevealObserver global usa threshold fixo (0.15).
   * Mantido só para não quebrar as chamadas; threshold por elemento se algum caso pedir.
   */
  amount?: number;
  className?: string;
  style?: CSSProperties;
  id?: string;
  role?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  children?: ReactNode;
};

/**
 * Fade + rise on scroll-into-view, once. Elemento comum com data-reveal: sem
 * opacity:0 no SSR, então sem JS, para crawlers ou sob reduced-motion o
 * conteúdo aparece. y/duration viram --reveal-y/--reveal-duration e delay vira
 * transition-delay (o bloco "Scroll-reveal (P7)" de globals.css lê os três).
 */
export function Reveal({
  as = "div",
  children,
  y,
  delay,
  duration,
  className,
  style,
  id,
  role,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby
}: RevealProps) {
  const Tag = as as ElementType;
  const vars = {
    ...(y !== undefined && { "--reveal-y": `${y}px` }),
    ...(duration !== undefined && { "--reveal-duration": `${Math.round(duration * 1000)}ms` }),
    ...(delay ? { transitionDelay: `${Math.round(delay * 1000)}ms` } : null),
    ...style
  } as CSSProperties;

  return (
    <Tag
      data-reveal=""
      className={className}
      style={Object.keys(vars).length ? vars : undefined}
      id={id}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
    >
      {children}
    </Tag>
  );
}

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** The target date has already passed. */
  isPast: boolean;
  /** True once the live value has been computed on the client. */
  ready: boolean;
};

const ZERO: Countdown = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, ready: false };

function diff(targetMs: number): Countdown {
  const now = Date.now();
  const delta = targetMs - now;
  if (delta <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, ready: true };
  }
  const s = Math.floor(delta / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    isPast: false,
    ready: true
  };
}

/**
 * Live countdown to an ISO date. Starts at zeros (stable for SSR/hydration),
 * then ticks every second on the client. `ready` lets callers show a skeleton
 * until the real value lands, avoiding a hydration mismatch.
 */
export function useCountdown(targetIso: string): Countdown {
  const [value, setValue] = useState<Countdown>(ZERO);

  useEffect(() => {
    const targetMs = new Date(targetIso).getTime();
    if (!Number.isFinite(targetMs)) return;

    // First value next frame (not synchronously in the effect body) so the
    // real countdown appears almost immediately without an extra sync render.
    const raf = window.requestAnimationFrame(() => setValue(diff(targetMs)));
    const id = window.setInterval(() => setValue(diff(targetMs)), 1000);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, [targetIso]);

  return value;
}

/** Zero-pad a countdown unit for tabular display ("07"). */
export function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}
