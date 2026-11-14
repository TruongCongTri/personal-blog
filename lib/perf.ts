/**
 * Low-power mode ("lite"). Old phones and weak laptops get the same site with
 * the expensive extras switched off: no WebGL dust, no smooth-scroll layer,
 * no backdrop blur, blend modes or huge soft shadows (see global.css).
 *
 * Two signals turn it on:
 *  1. Up front (inline script in the root layout, before first paint):
 *     Save-Data, a 2g/3g connection, ≤2GB memory, ≤2 cores, or ≤4 of both.
 *  2. At runtime: a short frame-rate probe after the page settles. iOS hides
 *     memory and core counts, so this is what catches old iPhones.
 */
export const LITE_CLASS = "is-lite";
const EVENT = "lite-mode";

/** Runs inline in <body> before anything paints. Kept tiny and dependency-free. */
export const liteScript = `(function(){try{var n=navigator,c=n.connection||{},m=n.deviceMemory||8,h=n.hardwareConcurrency||8,d=document.documentElement;if(c.saveData||/2g|3g/.test(c.effectiveType||"")||m<=2||h<=2||(m<=4&&h<=4))d.classList.add("${LITE_CLASS}");if(matchMedia("(hover:hover) and (pointer:fine)").matches)d.classList.add("has-mouse")}catch(e){}})()`;

export const isLite = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains(LITE_CLASS);

export function enableLite() {
  if (isLite()) return;
  document.documentElement.classList.add(LITE_CLASS);
  window.dispatchEvent(new Event(EVENT));
}

/** Calls `fn` once if lite mode switches on later. Returns an unsubscribe. */
export function onLite(fn: () => void) {
  window.addEventListener(EVENT, fn, { once: true });
  return () => window.removeEventListener(EVENT, fn);
}

let probed = false;
/**
 * Samples ~90 frames while the page is idle. If the median frame takes longer
 * than ~22ms (under ~45fps with nothing heavy going on), the device is
 * struggling and lite mode switches on for the rest of the visit.
 */
export function probeFrameRate() {
  if (probed || isLite()) return;
  probed = true;
  const samples: number[] = [];
  let last = 0;
  const step = (t: number) => {
    if (document.hidden) return; // a hidden tab tells us nothing
    if (last) samples.push(t - last);
    last = t;
    if (samples.length < 90) return void requestAnimationFrame(step);
    samples.sort((a, b) => a - b);
    if (samples[samples.length >> 1] > 22) enableLite();
  };
  // Let the intro finish first so its own work is not counted.
  setTimeout(() => requestAnimationFrame(step), 3500);
}
