"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { freezeScroll } from "@/lib/lenis";
import styles from "./Lightbox.module.css";

export type LightboxImage = {
  /** Large image. */
  src: string;
  /** Tried if `src` fails to load (e.g. a smaller size). */
  fallback?: string;
  /** Shown while the large one loads (the small version already on screen). */
  thumb?: string;
  alt?: string;
  /** width / height; lets the picture take its final size before it loads. */
  ratio?: number;
  /** Caption card beside the picture. */
  title?: string;
  source?: string;
  /** Link for the source (e.g. the image's licence page). */
  sourceUrl?: string;
  /** A cut-out object: shown whole, on no background. */
  contain?: boolean;
};

type Props = {
  images: LightboxImage[];
  /** Index to show, or null when closed. */
  index: number | null;
  onIndex: (index: number | null) => void;
  /** The element each image opens from and closes back into. */
  origin?: (index: number) => Element | null;
  labels: { close: string; prev: string; next: string; source?: string };
};

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Transform that makes the box `to` sit exactly over the rect `from`. */
function flip(from: DOMRect, to: DOMRect) {
  return {
    x: from.left + from.width / 2 - (to.left + to.width / 2),
    y: from.top + from.height / 2 - (to.top + to.height / 2),
    scaleX: from.width / to.width,
    scaleY: from.height / to.height,
  };
}

/**
 * Large view of an image (film-strip frames, stills). It grows out of the
 * picture that was clicked and shrinks back into it on close (a FLIP
 * animation), with a caption card beside it and a round close button. A
 * native <dialog>, portalled to <body> so dragging the paper underneath can't
 * drag it: Esc, the backdrop or the button close it; arrow keys and swipes
 * move between images.
 */
export default function Lightbox({ images, index, onIndex, origin, labels }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const swipe = useRef<number | null>(null);
  const closing = useRef(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const open = index !== null;
  const count = images.length;

  const go = useCallback(
    (dir: 1 | -1) => index !== null && count > 1 && onIndex((index + dir + count) % count),
    [index, count, onIndex],
  );

  // Close: shrink back into the picture it came from, then really close.
  const close = useCallback(() => {
    const d = dialog.current;
    const box = frame.current;
    if (!d || closing.current) return;
    closing.current = true;
    const from = index !== null ? origin?.(index) : null;
    const done = () => {
      closing.current = false;
      d.close();
    };
    if (!box || !from || prefersReducedMotion()) {
      gsap.to(d, { opacity: 0, duration: 0.2, onComplete: done });
      return;
    }
    gsap.set(box, { clearProps: "transform" });
    const t = flip(from.getBoundingClientRect(), box.getBoundingClientRect());
    gsap
      .timeline({ onComplete: done })
      .to(card.current, { opacity: 0, x: 24, duration: 0.2, ease: "power2.in" }, 0)
      .to(box, { ...t, duration: 0.5, ease: "power3.inOut" }, 0)
      .to(d, { "--backdrop": 0, duration: 0.5, ease: "power2.inOut" }, 0);
  }, [index, origin]);

  // Open: show the dialog, then grow the picture out of where it was clicked.
  useIsoLayoutEffect(() => {
    if (!open) return;
    const d = dialog.current;
    const box = frame.current;
    if (!d || !box) return;
    d.showModal();
    freezeScroll(true);
    gsap.set(d, { opacity: 1, "--backdrop": 1 });
    const from = index !== null ? origin?.(index) : null;
    // Portalled out of the folder: take its colours along for the caption card.
    if (from) {
      const css = getComputedStyle(from);
      for (const v of ["--case-color", "--case-ink"]) d.style.setProperty(v, css.getPropertyValue(v));
    }
    if (from && !prefersReducedMotion()) {
      const t = flip(from.getBoundingClientRect(), box.getBoundingClientRect());
      gsap
        .timeline()
        .fromTo(d, { "--backdrop": 0 }, { "--backdrop": 1, duration: 0.5, ease: "power2.out" }, 0)
        .fromTo(box, t, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.65, ease: "power3.inOut" }, 0)
        .fromTo(card.current, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, 0.45);
    }
    return () => freezeScroll(false);
    // only when it opens: moving between images doesn't re-run the flight
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
  const ratio = image.ratio ?? 16 / 9;

  return createPortal(
    <dialog
      ref={dialog}
      className={styles.lightbox}
      onClose={() => onIndex(null)}
      // Esc: animate out instead of vanishing
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => e.target === e.currentTarget && close()}
      onPointerDown={(e) => (swipe.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipe.current === null) return;
        const dx = e.clientX - swipe.current;
        swipe.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className={styles.stage}>
        <div
          ref={frame}
          className={`${styles.frame} ${image.contain ? styles.contain : ""}`}
          style={{ aspectRatio: ratio, "--ratio": ratio } as React.CSSProperties}
        >
          {image.thumb && !loaded[src] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.placeholder} src={image.thumb} alt="" draggable={false} />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={src}
            src={src}
            alt={image.alt ?? ""}
            decoding="async"
            draggable={false}
            onLoad={() => setLoaded((l) => ({ ...l, [src]: true }))}
            onError={() => setFailed((f) => ({ ...f, [image.src]: true }))}
          />
        </div>

        {(image.title || image.source || count > 1) && (
          <div ref={card} className={styles.card}>
            {image.title && <strong>{image.title}</strong>}
            {image.source && (
              <span>
                {labels.source ?? "Source"}:{" "}
                {image.sourceUrl ? (
                  <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {image.source}
                  </a>
                ) : (
                  image.source
                )}
              </span>
            )}
            {count > 1 && (
              <span className={styles.count}>
                {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
            )}
          </div>
        )}
      </div>

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
      <button type="button" className={styles.close} onClick={close} aria-label={labels.close} data-cursor="close">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </dialog>,
    document.body,
  );
}
