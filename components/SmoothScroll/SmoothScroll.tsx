"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { getLenis, setLenis } from "@/lib/lenis";
import { appReady } from "@/lib/ready";
import { isLite, onLite, probeFrameRate } from "@/lib/perf";

/**
 * Lenis smooth scrolling driven by GSAP's ticker so ScrollTrigger and Lenis
 * share one frame loop. Touch devices keep native scrolling (syncTouch off),
 * which feels best on phones and costs nothing. Weak devices (lite mode) skip
 * Lenis entirely: native scrolling never lags behind a slow frame loop.
 */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // Reveal the page once fonts are in (entrance animations wait for this too).
    appReady().then(probeFrameRate);
    if (prefersReducedMotion() || isLite()) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
    });
    setLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const teardown = () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
    const off = onLite(teardown);
    return () => {
      off();
      teardown();
    };
  }, []);

  // Fresh page → start at the top and re-measure triggers.
  useEffect(() => {
    getLenis()?.scrollTo(0, { immediate: true, force: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
