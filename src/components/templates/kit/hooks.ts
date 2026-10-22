"use client";

import { useEffect, useState } from "react";

/** true depois que a página rolou `threshold`px (nav que fica sólida fora do hero). */
export function useScrolled(threshold = 80): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/** Estado de menu aberto/fechado que fecha ao navegar por âncora e com Esc. */
export function useMenu(): [boolean, () => void, () => void] {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return [open, () => setOpen((value) => !value), () => setOpen(false)];
}
