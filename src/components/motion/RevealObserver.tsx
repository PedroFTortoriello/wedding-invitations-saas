"use client";

import { useEffect } from "react";

/**
 * Centralized scroll-reveal (P7). Mounted once in the root layout, it observes
 * every [data-reveal] element on the page and flips data-shown="true" when it
 * scrolls into view — the CSS in globals.css does the fade + rise.
 *
 * The hidden state is gated in CSS behind `.js` (set pre-paint) AND
 * prefers-reduced-motion: no-preference, so without JS, under reduced motion,
 * or for crawlers the content is always visible. Here we also short-circuit:
 * under reduced motion (or no IO support) every element is marked shown.
 *
 * O que já está na tela ao ser rastreado aparece na hora (o rootMargin de -8%
 * e o threshold deixavam a base da primeira dobra escondida). Nós montados
 * depois (troca de rota, render condicional, "ver todos", sucesso do RSVP)
 * entram por um MutationObserver.
 *
 * Ao montar grava data-reveal-ready no <html>: sem ele em 2,5s, o script
 * pre-paint do layout tira o .js e mostra tudo (rede de segurança).
 */
export function RevealObserver() {
  useEffect(() => {
    document.documentElement.dataset.revealReady = "true";

    const show = (el: Element) => el.setAttribute("data-shown", "true");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io =
      reduce || !("IntersectionObserver" in window)
        ? null
        : new IntersectionObserver(
            (entries, observer) => {
              for (const entry of entries) {
                if (entry.isIntersecting) {
                  show(entry.target);
                  observer.unobserve(entry.target);
                }
              }
            },
            { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
          );

    const track = (nodes: Element[]) => {
      const pending = nodes.filter((el) => el.getAttribute("data-shown") !== "true");
      if (!io) {
        pending.forEach(show);
        return;
      }
      // Lê todos os rects antes de escrever (evita recalcular estilo a cada nó).
      const inView = pending.map((el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
      });
      pending.forEach((el, i) => (inView[i] ? show(el) : io.observe(el)));
    };

    track(Array.from(document.querySelectorAll("[data-reveal]")));

    const mo = new MutationObserver((records) => {
      const added: Element[] = [];
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.hasAttribute("data-reveal")) added.push(node);
          added.push(...node.querySelectorAll("[data-reveal]"));
        });
      }
      if (added.length) track(added);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io?.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
