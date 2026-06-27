"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Centralized scroll-reveal (P7). Mounted once in the root layout, it observes
 * every [data-reveal] element on the page and flips data-shown="true" when it
 * scrolls into view — the CSS in globals.css does the fade + rise.
 *
 * The hidden state is gated in CSS behind `.js` (set pre-paint) AND
 * prefers-reduced-motion: no-preference, so without JS, under reduced motion,
 * or for crawlers the content is always visible. Here we also short-circuit:
 * under reduced motion (or no IO support) every element is marked shown.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown='true'])")
    );
    if (nodes.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.setAttribute("data-shown", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-shown", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
