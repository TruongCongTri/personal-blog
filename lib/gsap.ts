"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import { useEffect, useLayoutEffect, type RefObject } from "react";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Draggable, useGSAP);
  // Mobile address bars resize the viewport while scrolling; ignore that.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** The site-wide easing (CSS: cubic-bezier(.33, 1, .68, 1)). */
export const EASE_CSS = "cubic-bezier(.33,1,.68,1)";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Runs a page's entrance animation. Like useGSAP (selectors are scoped to
 * `scope`), with one difference that matters for page transitions: when the
 * page goes away its animations are stopped but NOT undone. useGSAP reverts
 * them, which snaps a page that is leaving back to its resting look for a
 * moment — the closed folder flashing open, the dropped folders reappearing.
 * Each run of `setup` is expected to reset whatever it animates first.
 */
export function useEntrance(setup: () => void, scope: RefObject<Element | null>, deps: unknown[]) {
  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      setup();
    }, scope.current ?? undefined);
    return () => ctx.kill();
  }, deps);
}

export { gsap, ScrollTrigger, Draggable, useGSAP };
