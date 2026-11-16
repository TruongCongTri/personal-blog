"use client";

import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import type { NextState } from "@/lib/useFolderScroll";
import styles from "./NextWidget.module.css";

type Props = {
  href: string;
  title: string;
  category: string;
  color: string;
  textColor: string;
  label: string;
  /** Shown in the button at the bottom of the page. */
  keepLabel: string;
  /** "read", as in "42% read". */
  readLabel: string;
  state: NextState;
  onNext: (e: MouseEvent<HTMLAnchorElement>, href: string) => void;
};

/**
 * Fixed bottom-right: a card naming the next folder, and the Next button.
 *  - hidden: both wait below the screen;
 *  - shown:  the button rises first, then the card grows out from behind it;
 *  - merge:  at the bottom the card folds back into the button, which widens,
 *            reads "keep scrolling…" and fills up with the scroll progress
 *            (the --progress variable, written by useFolderScroll).
 *
 * The card also shows how far through this folder's text the reader is
 * (--read and the percentage), written straight to the DOM on scroll.
 */
export default function NextWidget({ href, title, category, color, textColor, label, keepLabel, readLabel, state, onNext }: Props) {
  const idle = state === "hidden";
  const root = useRef<HTMLElement>(null);
  const pct = useRef<HTMLSpanElement>(null);

  // Reading progress: from the top of the paper to its last line reaching the
  // bottom of the screen. No re-render per scroll frame.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let scope: HTMLElement | null = el.parentElement;
    while (scope && !scope.querySelector("[data-sheet]")) scope = scope.parentElement;
    const sheet = scope?.querySelector<HTMLElement>("[data-sheet]");
    if (!sheet) return;
    let frame = 0;
    let last = -1;
    const update = () => {
      frame = 0;
      const r = sheet.getBoundingClientRect();
      const header = 60;
      const span = r.height - (window.innerHeight - header);
      const p = Math.min(1, Math.max(0, span > 0 ? (header - r.top) / span : r.top < header ? 1 : 0));
      const n = Math.round(p * 100);
      if (n === last) return;
      last = n;
      el.style.setProperty("--read", String(p));
      if (pct.current) pct.current.textContent = `${n}%`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <aside
      ref={root}
      className={styles.widget}
      style={{ "--bg": color, "--fg": textColor } as CSSProperties}
      data-state={state}
      data-next-widget
      aria-hidden={idle}
    >
      <Link href={href} className={styles.card} onClick={(e) => onNext(e, href)} tabIndex={-1} aria-hidden="true">
        <span className={styles.read}>
          <span>
            <span ref={pct}>0%</span> {readLabel}
          </span>
          <span className={styles.readBar} />
        </span>
        <span className={styles.name}>{title}</span>
        <span className={styles.category}>{category}</span>
      </Link>

      <Link href={href} className={styles.button} onClick={(e) => onNext(e, href)} tabIndex={idle ? -1 : 0}>
        <span className={styles.fill} aria-hidden="true" />
        <span className={styles.next}>
          {label}
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </span>
        <span className={styles.keep} aria-hidden={state !== "merge"}>
          {keepLabel}
        </span>
        <span className="sr-only">{title}</span>
      </Link>
    </aside>
  );
}
