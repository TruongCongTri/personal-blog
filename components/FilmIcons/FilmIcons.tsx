"use client";

import { useEffect, useRef } from "react";
import styles from "./FilmIcons.module.css";

// Rounded so the server and the browser print exactly the same numbers.
const r2 = (n: number) => Math.round(n * 100) / 100;

const stripes = (y: number, h: number) =>
  Array.from(
    { length: 5 },
    (_, i) => `M${17 + i * 15} ${y}h7l-5 ${h}h-7z`,
  ).join("");

/** Director's chair with the name across the back. */
function Chair() {
  return (
    <svg viewBox="0 0 100 100">
      <g className={styles.rock}>
        <rect
          x="24"
          y="18"
          width="52"
          height="17"
          rx="1.5"
          fill="currentColor"
        />
        <text
          x="50"
          y="29.5"
          textAnchor="middle"
          className={styles.label}
          fill="var(--icon-bg)"
        >
          DIRECTOR
        </text>
        <path d="M27 14v48M73 14v48M20 47h60M20 62h60M30 62l40 26M70 62L30 88M26 88h8M66 88h8" />
        <path d="M24 42h52" strokeDasharray="2 3" />
      </g>
    </svg>
  );
}

/** Old two-reel cine camera on its head; the reels turn. */
function Camera() {
  const spokes = (cx: number, cy: number, r: number) => (
    <g className={styles.spin} style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <circle cx={cx} cy={cy} r={r} />
      <circle cx={cx} cy={cy} r={2.5} fill="currentColor" />
      {[0, 120, 240].map((a) => (
        <circle
          key={a}
          cx={r2(cx + Math.cos((a * Math.PI) / 180) * r * 0.55)}
          cy={r2(cy + Math.sin((a * Math.PI) / 180) * r * 0.55)}
          r={r2(r * 0.24)}
        />
      ))}
    </g>
  );
  return (
    <svg viewBox="0 0 100 100">
      {spokes(29, 33, 13)}
      {spokes(56, 30, 16)}
      <rect x="14" y="48" width="52" height="30" rx="3" fill="currentColor" />
      <path d="M66 57l20-8v30l-20-8z" />
      <circle cx="26" cy="63" r="4" fill="var(--icon-bg)" stroke="none" />
      <path d="M34 78l-8 12M46 78l8 12M40 78v12" />
    </svg>
  );
}

/** Clapperboard: the arm snaps shut. */
export function Clapper() {
  return (
    <svg viewBox="0 0 100 100">
      <g className={styles.arm}>
        <rect x="12" y="19" width="76" height="10" rx="1" />
        <path d={stripes(19, 10)} fill="currentColor" stroke="none" />
      </g>
      <rect x="12" y="31" width="76" height="10" rx="1" />
      <path d={stripes(31, 10)} fill="currentColor" stroke="none" />
      <rect x="12" y="41" width="76" height="45" rx="2" />
      <path d="M12 57h76M12 72h76M44 57v29M66 57v29" />
      <text
        x="50"
        y="52.5"
        textAnchor="middle"
        className={styles.label}
        fill="currentColor"
      >
        FILM FILES
      </text>
      {[
        ["SCENE", 28, "07"],
        ["TAKE", 55, "3"],
        ["ROLL", 77, "A"],
      ].map(([label, x, value]) => (
        <g
          key={label}
          className={styles.label}
          fill="currentColor"
          textAnchor="middle"
        >
          <text x={x} y="67">
            {label}
          </text>
          <text x={x} y="82">
            {value}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Film reel with a strip running off it; the reel turns. */
export function Reel() {
  return (
    <svg viewBox="0 0 100 100">
      <path d="M50 88h40" />
      <path d="M50 84h40M50 92h40" strokeDasharray="3 3" />
      <g className={styles.spin} style={{ transformOrigin: "46px 46px" }}>
        <circle cx="46" cy="46" r="40" fill="currentColor" stroke="none" />
        <circle cx="46" cy="46" r="5" fill="var(--icon-bg)" stroke="none" />
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i * 72 - 90) * (Math.PI / 180);
          return (
            <circle
              key={i}
              cx={r2(46 + Math.cos(a) * 22)}
              cy={r2(46 + Math.sin(a) * 22)}
              r="10"
              fill="var(--icon-bg)"
              stroke="none"
            />
          );
        })}
        <circle
          cx="46"
          cy="46"
          r="34"
          stroke="var(--icon-bg)"
          strokeDasharray="1 4"
        />
      </g>
    </svg>
  );
}

/** Director's megaphone: "action!" */
function Megaphone() {
  return (
    <svg viewBox="0 0 100 100">
      <g className={styles.shout}>
        <path d="M16 44h10v16H16z" fill="currentColor" />
        <path d="M26 44l40-18v52L26 60z" />
        <path d="M34 60l6 20h8l-5-17" />
      </g>
      <path className={styles.wave} d="M74 42q6 10 0 20" />
      <path className={styles.wave} d="M80 35q11 17 0 34" />
      <path className={styles.wave} d="M86 28q16 24 0 48" />
    </svg>
  );
}

/**
 * Line drawings of a film set along the foot of the drawer. Each one plays a
 * small move on hover, and once more whenever the footer scrolls into view
 * (so touch screens see it too). Pure CSS animation, nothing per frame in JS.
 */
export default function FilmIcons() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.dataset.play = "true";
        else delete el.dataset.play;
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.icons} aria-hidden="true">
      <span className={`${styles.icon} ${styles.hideOnMobile}`}>
        <Chair />
      </span>
      <span className={styles.icon}>
        <Camera />
      </span>
      <span className={styles.icon}>
        <Clapper />
      </span>
      <span className={styles.icon}>
        <Reel />
      </span>
      <span className={`${styles.icon} ${styles.hideOnMobile}`}>
        <Megaphone />
      </span>
    </div>
  );
}
