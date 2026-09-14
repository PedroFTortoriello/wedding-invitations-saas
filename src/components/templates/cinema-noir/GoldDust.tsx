"use client";

import { useEffect, useRef } from "react";

/**
 * Featherweight gold-dust canvas for the Cinema Noir hero — slow-drifting motes
 * of champagne light, drawn by hand (no library). Perf budget is the whole point:
 *
 *  - Loaded via next/dynamic({ ssr: false }) so it never runs on the server and
 *    never blocks the LCP hero image/headline.
 *  - Renders nothing under prefers-reduced-motion (no canvas, no rAF).
 *  - IntersectionObserver pauses the loop while the hero is offscreen.
 *  - DPR capped at 1.5 and particle count scales with area (mobile draws fewer),
 *    so it stays a few-KB, GPU-friendly transform-free paint.
 */

type Mote = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  /** Base alpha and twinkle phase/speed. */
  a: number;
  phase: number;
  tw: number;
};

const GOLD = "201, 168, 106"; // --cn-gold, matches the module palette

export function GoldDust({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Motion is decorative: honour the user's reduced-motion preference by
    // never drawing or starting the loop (keeps the docstring's promise).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    // Pre-render the soft glow ONCE to a sprite, then blit it per mote — avoids
    // allocating a radial gradient (and the costly soft fill) every frame.
    const SPRITE = 64;
    const sprite = document.createElement("canvas");
    sprite.width = SPRITE;
    sprite.height = SPRITE;
    const sctx = sprite.getContext("2d");
    if (sctx) {
      const g = sctx.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
      g.addColorStop(0, `rgba(${GOLD}, 1)`);
      g.addColorStop(1, `rgba(${GOLD}, 0)`);
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, SPRITE, SPRITE);
    }
    let width = 0;
    let height = 0;
    let motes: Mote[] = [];
    let raf = 0;
    let running = false;
    let t = 0;

    const seed = () => {
      // ~1 mote per 26k px², capped so a 4K screen doesn't overpay.
      const count = Math.min(70, Math.round((width * height) / 26000));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.9,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(0.08 + Math.random() * 0.22),
        a: 0.12 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        tw: 0.006 + Math.random() * 0.012
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const frame = () => {
      t += 1;
      ctx.clearRect(0, 0, width, height);
      for (const m of motes) {
        m.x += m.vx + Math.sin((t + m.phase * 40) * 0.008) * 0.06;
        m.y += m.vy;
        if (m.y < -6) {
          m.y = height + 6;
          m.x = Math.random() * width;
        }
        if (m.x < -6) m.x = width + 6;
        else if (m.x > width + 6) m.x = -6;

        const twinkle = 0.6 + 0.4 * Math.sin(m.phase + t * m.tw);
        const d = m.r * 6.8; // glow diameter (radius * 3.4 * 2)
        ctx.globalAlpha = m.a * twinkle;
        ctx.drawImage(sprite, m.x - d / 2, m.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
      raf = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = window.requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      window.cancelAnimationFrame(raf);
    };

    resize();
    window.addEventListener("resize", resize);

    // Only animate while the hero is on screen.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
