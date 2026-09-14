"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useEffect, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Shared motion primitives for the premium wedding templates.
 *
 * Design rule (from the design system): reveals must ENHANCE an already-visible
 * default. Reveal renders its children fully visible under reduced-motion (and
 * animates only for users who haven't asked to reduce it), so content is never
 * shipped blank for that cohort.
 */

const EASE_OUT: Transition["ease"] = [0.22, 1, 0.36, 1];

/** Tags Reveal can render as. Polymorphic so it can wrap list items, figures, etc. */
type RevealTag = "div" | "li" | "ul" | "ol" | "section" | "article" | "figure" | "span" | "header";

type RevealProps = {
  as?: RevealTag;
  /** Vertical travel of the entrance, px. */
  y?: number;
  /** Seconds to delay the entrance (for hand-tuned staggers). */
  delay?: number;
  /** Entrance duration, seconds. */
  duration?: number;
  /** Fraction of the element that must be in view before it reveals. */
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
 * Fade + rise on scroll-into-view, once. Reduced-motion-safe: when the user
 * reduces motion the element renders at its natural, fully-visible state with no
 * animation. We always render the SAME element type (motion[as]) — never swap
 * div→motion.div — so children are never remounted (a swap would orphan any
 * effect-driven descendants, e.g. the gift cards' own reveal observer).
 *
 * ponytail: under motion-on + JS-off the entrance state is hidden until the
 * in-view trigger fires; acceptable here because these templates are already
 * JS-required (countdown, RSVP, gifts, lightbox). Reduced-motion stays visible.
 */
export function Reveal({
  as = "div",
  children,
  y = 18,
  delay = 0,
  duration = 0.6,
  amount = 0.2,
  className,
  style,
  id,
  role,
  ...aria
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as ElementType;

  return (
    <MotionTag
      className={className}
      style={style}
      id={id}
      role={role}
      {...aria}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={reduce ? undefined : { duration, ease: EASE_OUT, delay }}
    >
      {children}
    </MotionTag>
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
