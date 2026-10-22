"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { WeddingGalleryImage } from "@/types/wedding";

/**
 * Lightbox da galeria em <dialog> nativo (foco, Esc e backdrop por conta do navegador).
 * Sem estilo próprio: o modelo passa as classes do seu CSS module. Uso:
 *   const lb = useLightbox();
 *   <button onClick={() => lb.open(i)}>…</button>
 *   <Lightbox images={images} active={lb.active} onClose={lb.close} classNames={{ dialog: styles.lightbox, … }} />
 */
export function useLightbox() {
  const [active, setActive] = useState<number | null>(null);
  return { active, open: (index: number) => setActive(index), close: () => setActive(null) };
}

type LightboxProps = {
  images: WeddingGalleryImage[];
  active: number | null;
  onClose: () => void;
  classNames: {
    dialog: string;
    close?: string;
    figure?: string;
    img?: string;
    caption?: string;
    /** Botões anterior/próximo (opcionais; sem eles, só fechar). */
    nav?: string;
  };
};

export function Lightbox({ images, active, onClose, classNames }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(active);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setIndex(active);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [active]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (index !== null && !dialog.open) dialog.showModal();
    if (index === null && dialog.open) dialog.close();
  }, [index]);

  const current = index !== null ? images[index] : null;
  const step = (delta: number) => setIndex((i) => (i === null ? i : (i + delta + images.length) % images.length));

  return (
    <dialog
      ref={dialogRef}
      className={classNames.dialog}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") step(1);
        if (event.key === "ArrowLeft") step(-1);
      }}
    >
      <button type="button" className={classNames.close} onClick={onClose} aria-label="Fechar">
        ×
      </button>
      {classNames.nav && images.length > 1 ? (
        <>
          <button type="button" className={classNames.nav} data-dir="prev" onClick={() => step(-1)} aria-label="Foto anterior">
            ‹
          </button>
          <button type="button" className={classNames.nav} data-dir="next" onClick={() => step(1)} aria-label="Próxima foto">
            ›
          </button>
        </>
      ) : null}
      {current ? (
        <figure className={classNames.figure}>
          <Image src={current.src} alt={current.alt} width={1600} height={2000} className={classNames.img} sizes="92vw" />
          {current.caption ? <figcaption className={classNames.caption}>{current.caption}</figcaption> : null}
        </figure>
      ) : null}
    </dialog>
  );
}
