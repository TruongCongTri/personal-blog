"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import styles from "./Cursor.module.css";

type Labels = { open: string; drag: string; next: string; close: string; play: string };
type Kind = keyof Labels | "link" | "";

/** What the pointer is over. Elements can opt in with data-cursor="open|drag|next|close". */
function kindOf(target: EventTarget | null): Kind {
  if (!(target instanceof Element)) return "";
  const tagged = target.closest<HTMLElement>("[data-cursor]");
  if (tagged) return (tagged.dataset.cursor as Kind) || "";
  if (target.closest("[data-drag]")) return "drag";
  if (target.closest("[data-next-folder], [data-next-widget] a")) return "next";
  if (target.closest("a, button, [role='button'], label, select, summary")) return "link";
  return "";
}

/**
 * Pointer that belongs to the desk: a small dot that follows exactly and a
 * ring that trails it, growing over anything clickable and turning into a
 * label over folders ("Open"), scraps ("Drag"), the trailer ("Play") and the
 * way on ("Next").
 *
 * Mouse and trackpad only (touch screens never see it). Movement goes through
 * gsap.quickTo (transforms only), and the target is worked out on
 * pointerover, not on every move.
 */
export default function Cursor({ labels }: { labels: Labels }) {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const still = prefersReducedMotion();
    const opts = (d: number) => ({ duration: still ? 0 : d, ease: "power3.out" });
    const dotX = gsap.quickTo(dot.current, "x", opts(0.12));
    const dotY = gsap.quickTo(dot.current, "y", opts(0.12));
    const ringX = gsap.quickTo(ring.current, "x", opts(0.45));
    const ringY = gsap.quickTo(ring.current, "y", opts(0.45));

    let shown = false;
    const html = document.documentElement;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        // A touch or pen on a hybrid laptop: get out of the way.
        if (shown) el.dataset.visible = "false";
        shown = false;
        return;
      }
      if (!shown) {
        // First move: jump straight there instead of sliding in from a corner.
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY });
        el.dataset.visible = "true";
        html.classList.add("has-cursor");
        shown = true;
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const onOver = (e: PointerEvent) => {
      const kind = kindOf(e.target);
      el.dataset.kind = kind;
      if (kind && kind !== "link" && text.current) text.current.textContent = labels[kind];
    };
    const onDown = () => (el.dataset.down = "true");
    const onUp = () => (el.dataset.down = "false");
    const onLeave = () => {
      el.dataset.visible = "false";
      shown = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      html.classList.remove("has-cursor");
    };
  }, [labels]);

  return (
    <div ref={root} className={styles.cursor} data-visible="false" data-kind="" aria-hidden="true">
      <div ref={ring} className={styles.ringPos}>
        <div className={styles.ring}>
          <span ref={text} className={styles.text} />
        </div>
      </div>
      <div ref={dot} className={styles.dotPos}>
        <div className={styles.dot} />
      </div>
    </div>
  );
}
