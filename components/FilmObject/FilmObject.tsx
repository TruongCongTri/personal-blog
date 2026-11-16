"use client";

import { useId } from "react";
import styles from "./FilmObject.module.css";

/** Objects that matter in a film, drawn for its desk. */
export const FILM_OBJECTS = ["dogtags", "press", "rifle", "deed"] as const;
export type FilmObjectKind = (typeof FILM_OBJECTS)[number];

/** Warfare: a pair of dog tags on their bead chain. */
function DogTags({ id }: { id: string }) {
  const tag = (x: number, y: number, r: number, fill: string) => (
    <g transform={`rotate(${r} ${x + 75} ${y + 41})`}>
      <rect x={x} y={y} width="150" height="82" rx="18" fill={fill} />
      <rect x={x + 6} y={y + 6} width="138" height="70" rx="13" fill="none" stroke="#fff" strokeOpacity=".45" />
      <rect x={x + 7} y={y + 7} width="138" height="70" rx="13" fill="none" stroke="#000" strokeOpacity=".18" />
      <circle cx={x + 18} cy={y + 41} r="6.5" fill="#1d1d1d" fillOpacity=".55" stroke="#fff" strokeOpacity=".5" />
    </g>
  );
  return (
    <svg viewBox="0 0 270 160" className={styles.svg}>
      <defs>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef0f2" />
          <stop offset=".45" stopColor="#a9afb6" />
          <stop offset=".7" stopColor="#d8dce0" />
          <stop offset="1" stopColor="#8a9098" />
        </linearGradient>
      </defs>
      {/* bead chain */}
      <path d="M40 74 C10 20 120 -4 190 22 C238 40 236 70 210 78" fill="none" stroke="#8b9197" strokeWidth="4" strokeDasharray="0.1 6.5" strokeLinecap="round" />
      {tag(92, 60, 7, `url(#${id}m)`)}
      {tag(40, 52, -6, `url(#${id}m)`)}
      {/* stamped lettering, with a light edge like raised metal */}
      <g transform="rotate(-6 115 93)" className={styles.emboss}>
        {["U.S. NAVY", "O POS   NO PREF", "RAMADI · 2006"].map((t, i) => (
          <g key={t}>
            <text x="70" y={84 + i * 16} fill="#fff" opacity=".6" transform="translate(0.8 0.8)">
              {t}
            </text>
            <text x="70" y={84 + i * 16} fill="#4b5157">
              {t}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Civil War: a press pass on its lanyard. */
function PressPass({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 200 280" className={styles.svg}>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
          <stop offset=".75" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".25" />
        </linearGradient>
      </defs>
      {/* lanyard */}
      <path d="M62 0 L92 52 M138 0 L108 52" stroke="#1d1d1d" strokeWidth="10" strokeLinecap="round" />
      <rect x="88" y="46" width="24" height="16" rx="3" fill="#9aa1a8" />
      {/* card */}
      <rect x="22" y="58" width="156" height="212" rx="10" fill="#f4f1ea" />
      <rect x="22" y="58" width="156" height="58" rx="10" fill="#1d1d1d" />
      <rect x="22" y="100" width="156" height="16" fill="#1d1d1d" />
      <circle cx="100" cy="68" r="5" fill="#f4f1ea" />
      <text x="100" y="106" textAnchor="middle" className={styles.press}>
        PRESS
      </text>
      {/* photo */}
      <rect x="40" y="132" width="52" height="64" rx="3" fill="#c8c3b8" />
      <circle cx="66" cy="155" r="12" fill="#a9a399" />
      <path d="M46 196 q20 -26 40 0" fill="#a9a399" />
      {/* details */}
      {[140, 156, 172, 188].map((y, i) => (
        <rect key={y} x="104" y={y} width={i % 2 ? 40 : 56} height="6" rx="3" fill="#bdb7ab" />
      ))}
      {/* barcode */}
      <g fill="#1d1d1d">
        {Array.from({ length: 26 }, (_, i) => (
          <rect key={i} x={40 + i * 4.6} y="216" width={i % 3 ? 2 : 3.2} height="34" />
        ))}
      </g>
      {/* laminate sheen */}
      <rect x="22" y="58" width="156" height="212" rx="10" fill={`url(#${id}s)`} />
    </svg>
  );
}

/** Come and See: the rifle Flyora digs out of the sand. */
function Rifle({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 600 120" className={styles.svg}>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a6a3c" />
          <stop offset=".55" stopColor="#7a4f2a" />
          <stop offset="1" stopColor="#5a3a1f" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b7177" />
          <stop offset=".5" stopColor="#3b3f44" />
          <stop offset="1" stopColor="#24272a" />
        </linearGradient>
      </defs>
      {/* sling */}
      <path d="M110 92 C220 118 360 108 452 72" fill="none" stroke="#4a3b2a" strokeWidth="4" />
      {/* stock */}
      <path d="M18 66 L34 40 L250 50 L330 52 L330 76 L250 78 L160 74 L66 98 L22 98 Z" fill={`url(#${id}w)`} />
      <path d="M18 66 L34 40 L40 40 L26 98 L22 98 Z" fill="#2b2017" opacity=".8" />
      {/* receiver, magazine, trigger guard, bolt */}
      <rect x="300" y="46" width="112" height="28" rx="3" fill={`url(#${id}g)`} />
      <path d="M340 74 h42 l-5 30 h-32 z" fill={`url(#${id}g)`} />
      <path d="M302 74 q12 22 32 0" fill="none" stroke="#2a2d31" strokeWidth="4" />
      <rect x="392" y="38" width="14" height="10" rx="2" fill="#3b3f44" />
      {/* handguard with vents, bands */}
      <path d="M405 48 L486 50 L486 68 L405 72 Z" fill={`url(#${id}w)`} />
      {[418, 434, 450, 466].map((x) => (
        <rect key={x} x={x} y="55" width="8" height="5" rx="1.5" fill="#2b2017" />
      ))}
      <rect x="402" y="45" width="7" height="29" rx="1" fill="#3b3f44" />
      <rect x="480" y="47" width="7" height="23" rx="1" fill="#3b3f44" />
      {/* barrel and muzzle brake */}
      <rect x="486" y="53" width="96" height="7" fill={`url(#${id}g)`} />
      <rect x="572" y="49" width="22" height="15" rx="2" fill="#2a2d31" />
      {[578, 584, 590].map((x) => (
        <rect key={x} x={x} y="52" width="2.5" height="9" fill="#6b7177" />
      ))}
      {/* sand still on it */}
      <path d="M60 94 q20 -6 40 -2 M200 76 q18 -4 34 0" stroke="#c8b07c" strokeWidth="3" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

/** Rose: the sealed deed to the farm she claims as her inheritance. */
function Deed({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 300 210" className={styles.svg}>
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#efe0bd" />
          <stop offset=".6" stopColor="#e2cd9c" />
          <stop offset="1" stopColor="#cdb27a" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d7c08d" />
          <stop offset=".5" stopColor="#f3e6c6" />
          <stop offset="1" stopColor="#b99d63" />
        </linearGradient>
      </defs>
      <rect x="42" y="28" width="216" height="150" fill={`url(#${id}p)`} />
      <rect x="30" y="16" width="240" height="22" rx="11" fill={`url(#${id}r)`} />
      <rect x="30" y="168" width="240" height="22" rx="11" fill={`url(#${id}r)`} />
      <text x="150" y="66" textAnchor="middle" className={styles.deedTitle}>
        Urkunde
      </text>
      {/* handwriting */}
      <g stroke="#6b4f2a" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".65">
        {[84, 96, 108, 120, 132].map((y, i) => (
          <path key={y} d={`M62 ${y} q8 -3 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 ${i % 2 ? "" : "t16 0 t12 0"}`} />
        ))}
        <path d="M150 152 q10 -12 20 -2 t22 -4 q6 6 18 -2" />
      </g>
      {/* wax seal with its ribbon */}
      <path d="M86 150 l-10 34 l10 -6 l6 10 l4 -34 z M104 150 l10 34 l-10 -6 l-6 10 l-4 -34 z" fill="#8f1d1d" />
      <path
        d="M95 128 c9 -1 14 4 17 9 c4 6 2 12 -1 16 c-4 6 -11 8 -17 7 c-8 -1 -13 -6 -14 -12 c-1 -7 3 -13 8 -16 c2 -2 5 -4 7 -4 z"
        fill="#b3261e"
      />
      <circle cx="96" cy="144" r="9" fill="none" stroke="#7a1712" strokeWidth="2" />
      <path d="M96 138 v12 M90 144 h12" stroke="#7a1712" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** An object that matters in the film, lying on its desk. */
export default function FilmObject({ kind }: { kind: FilmObjectKind }) {
  const id = useId().replace(/:/g, "");
  switch (kind) {
    case "dogtags":
      return <DogTags id={id} />;
    case "press":
      return <PressPass id={id} />;
    case "rifle":
      return <Rifle id={id} />;
    case "deed":
      return <Deed id={id} />;
  }
}
