"use client";

/**
 * Preload gate. On first load, everything marked `data-preload` (and the
 * header) stays hidden until web fonts are ready, so the intro never plays
 * over text that is still reflowing. Resolves once and stays resolved, so
 * client-side navigations start their transitions immediately.
 */
let ready: Promise<void> | null = null;
// Never hold the page longer than this on slow fonts (shorter on weak devices,
// where showing text fast matters more than avoiding a font swap).
const maxWait = () => (document.documentElement.classList.contains("is-lite") ? 800 : 1500);

export function appReady(): Promise<void> {
  if (!ready) {
    ready = new Promise((resolve) => {
      const fonts = document.fonts?.ready ?? Promise.resolve();
      Promise.race([fonts, new Promise((r) => setTimeout(r, maxWait()))]).then(() =>
        requestAnimationFrame(() => {
          document.documentElement.classList.add("is-ready");
          resolve();
        }),
      );
    });
  }
  return ready;
}
