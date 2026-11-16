"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./SiteFooter.module.css";

const CLICKS = 5;
/** Max pause between clicks for them to count as one run. */
const GAP_MS = 1200;
const PORTFOLIO = "https://truong-cong-tri-portfolio.vercel.app/en";

type Labels = { createdBy: string; close: string; visit: string };

/**
 * A small secret in the footer: click its empty parts five times in a row
 * and a card pops up saying who made the site. Links and buttons inside the
 * footer work as usual and don't count.
 */
export default function CreditSecret({ labels, className, children }: { labels: Labels; className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Closing plays the opening animation backwards, then removes the card.
  const [closing, setClosing] = useState(false);
  const close = () => setClosing(true);
  const run = useRef({ count: 0, last: 0 });
  const card = useRef<HTMLDivElement>(null);

  const onClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest("a, button")) return;
    // the footer sits on top of a folder link on the home page: this click is ours
    e.preventDefault();
    e.stopPropagation();
    const now = performance.now();
    const r = run.current;
    r.count = now - r.last < GAP_MS ? r.count + 1 : 1;
    r.last = now;
    if (r.count >= CLICKS) {
      r.count = 0;
      setClosing(false);
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!open) return;
    card.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => !card.current?.contains(e.target as Node) && close();
    window.addEventListener("keydown", onKey);
    // next tick, so the click that opened it doesn't close it
    const t = setTimeout(() => window.addEventListener("pointerdown", onDown), 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <footer className={className} data-site-footer onClick={onClick}>
      {children}
      {open &&
        createPortal(
          <div
            ref={card}
            className={styles.secret}
            data-closing={closing || undefined}
            role="dialog"
            aria-label={`${labels.createdBy} Công Trí`}
            onAnimationEnd={(e) => {
              if (closing && e.target === e.currentTarget) {
                setOpen(false);
                setClosing(false);
              }
            }}
          >
            {/* A film reel, drawn centred in its box so it turns on its own middle */}
            <svg className={styles.secretReel} viewBox="-50 -50 100 100" aria-hidden="true">
              <circle r="46" fill="currentColor" />
              <circle r="38" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="2 5" />
              <circle r="6" fill="var(--color-accent)" />
              {[0, 72, 144, 216, 288].map((a) => (
                <circle
                  key={a}
                  cx={Math.round(Math.cos(((a - 90) * Math.PI) / 180) * 2400) / 100}
                  cy={Math.round(Math.sin(((a - 90) * Math.PI) / 180) * 2400) / 100}
                  r="10.5"
                  fill="var(--color-accent)"
                />
              ))}
            </svg>
            <p>{labels.createdBy}</p>
            <strong>Công Trí</strong>
            <a href={PORTFOLIO} target="_blank" rel="noopener noreferrer">
              {labels.visit} ↗
            </a>
            <button type="button" className={styles.secretClose} onClick={close} aria-label={labels.close}>
              ✕
            </button>
          </div>,
          document.body,
        )}
    </footer>
  );
}
