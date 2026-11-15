"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { freezeScroll } from "@/lib/lenis";
import styles from "./Lightbox.module.css";

export type LightboxImage = {
  /** Large image. */
  src: string;
  /** Tried if `src` fails to load (e.g. a smaller size). */
  fallback?: string;
  alt?: string;
};

type Props = {
  images: LightboxImage[];
  /** Index to show, or null when closed. */
  index: number | null;
  onIndex: (index: number | null) => void;
  labels: { close: string; prev: string; next: string };
};

/**
 * Large view of a set of images (the frames of a film strip). A native
 * <dialog> portalled to <body> (so dragging the strip can't drag it): Esc or
 * the backdrop closes it, arrow keys and swipes move between frames.
 */
export default function Lightbox({ images, index, onIndex, labels }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const swipe = useRef<number | null>(null);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const open = index !== null;
  const count = images.length;

  const go = useCallback(
    (dir: 1 | -1) => index !== null && onIndex((index + dir + count) % count),
    [index, count, onIndex],
  );

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    freezeScroll(true);
    return () => freezeScroll(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  if (index === null) return null;
  const image = images[index];
  const src = failed[image.src] && image.fallback ? image.fallback : image.src;

  return createPortal(
    <dialog
      ref={dialog}
      className={styles.lightbox}
      onClose={() => onIndex(null)}
      onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
      onPointerDown={(e) => (swipe.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipe.current === null) return;
        const dx = e.clientX - swipe.current;
        swipe.current = null;
        if (Math.abs(dx) > 50 && count > 1) go(dx < 0 ? 1 : -1);
      }}
    >
      <figure className={styles.frame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={src}
          src={src}
          alt={image.alt ?? ""}
          decoding="async"
          draggable={false}
          onError={() => setFailed((f) => ({ ...f, [image.src]: true }))}
        />
        {count > 1 && (
          <figcaption>
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </figcaption>
        )}
      </figure>

      {count > 1 && (
        <>
          <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => go(-1)} aria-label={labels.prev}>
            ←
          </button>
          <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => go(1)} aria-label={labels.next}>
            →
          </button>
        </>
      )}
      <button type="button" className={styles.close} onClick={() => dialog.current?.close()} data-cursor="close">
        {labels.close} ✕
      </button>
    </dialog>,
    document.body,
  );
}
