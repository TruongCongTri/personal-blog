"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import styles from "./WindRose.module.css";

type Props = { variant: 0 | 1 | 2; hideOnMobile?: boolean };

/** Compass rose that turns to face the pointer (or drifts with scroll on touch). */
export default function WindRose({ variant, hideOnMobile }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rotate = gsap.quickTo(el, "rotation", { duration: 0.8, ease: "power3.out" });
    let current = 0;

    // Shortest-path rotation so it never spins the long way round.
    const turnTo = (deg: number) => {
      const delta = ((deg - current + 540) % 360) - 180;
      current += delta;
      rotate(current);
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      const angle = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
      turnTo((angle * 180) / Math.PI + 90);
    };
    const onScroll = () => turnTo(window.scrollY * 0.25 * (variant === 1 ? -1 : 1));

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [variant]);

  const points = variant === 2 ? 16 : variant === 1 ? 8 : 4;

  return (
    <span className={`${styles.rose} ${hideOnMobile ? styles.hideOnMobile : ""}`} aria-hidden="true">
      <svg ref={ref} viewBox="-50 -50 100 100">
        <circle r="46" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle r="38" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />
        {Array.from({ length: points }, (_, i) => {
          const long = i % (points / 4) === 0;
          const len = long ? 44 : points === 16 && i % 2 ? 22 : 30;
          return (
            <g key={i} transform={`rotate(${(360 / points) * i})`}>
              <path d={`M0 ${-len}L${long ? 6 : 4} 0L0 ${len * 0.12}Z`} fill="currentColor" />
              <path d={`M0 ${-len}L${long ? -6 : -4} 0L0 ${len * 0.12}Z`} fill="none" stroke="currentColor" strokeWidth="0.8" />
            </g>
          );
        })}
        <text y="-47" textAnchor="middle" fontSize="9" fill="currentColor" fontFamily="var(--font-mono)">
          N
        </text>
      </svg>
    </span>
  );
}
