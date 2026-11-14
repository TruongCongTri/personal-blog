"use client";

import type Lenis from "lenis";

// Single shared Lenis instance so transitions can scroll/lock the page.
let instance: Lenis | null = null;

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis;
};

export const getLenis = () => instance;

/** Scroll to the top over `duration` seconds, locking user input meanwhile. */
export function scrollToTop(duration: number) {
  if (window.scrollY < 1) return;
  if (instance) {
    instance.scrollTo(0, { duration, lock: true, force: true });
  } else {
    window.scrollTo({ top: 0, behavior: duration > 0 ? "smooth" : "auto" });
  }
}

export function freezeScroll(frozen: boolean) {
  if (frozen) instance?.stop();
  else instance?.start();
  document.documentElement.classList.toggle("is-scroll-disabled", frozen);
}

/** Scroll to the very end of the page over `duration` seconds; resolves when there. */
export function scrollToEnd(duration: number): Promise<void> {
  const end = () => document.documentElement.scrollHeight - window.innerHeight;
  if (window.scrollY >= end() - 2) return Promise.resolve();
  return new Promise((resolve) => {
    if (instance) {
      instance.scrollTo(end(), { duration, lock: true, force: true, onComplete: () => resolve() });
      return;
    }
    // Native smooth scrolling has no "done" event: wait until it stops moving.
    window.scrollTo({ top: end(), behavior: "smooth" });
    const started = Date.now();
    let last = -1;
    const check = () => {
      const y = window.scrollY;
      if (y >= end() - 2 || (y === last && Date.now() - started > 300) || Date.now() - started > 2500) return resolve();
      last = y;
      setTimeout(check, 80);
    };
    setTimeout(check, 80);
  });
}
