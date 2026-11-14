"use client";

/**
 * Tiny cross-route store for the folder transitions.
 *
 * App Router unmounts the old page when the new one renders, so the leaving
 * page records *how* it left (and where the folder was on screen) and the
 * entering page reads it once on mount to continue the motion seamlessly.
 */

export type Rect = { left: number; top: number; width: number; height: number };

export type Pending =
  | { type: "open"; rect: Rect; groupIndex: number; leaned?: boolean }
  | { type: "close"; groupIndex: number }
  // another folder was folded shut; this one opens in place
  | { type: "turn"; fromCover?: string; sameGroup?: boolean }
  // reached by scrolling on from the end of the previous folder: this folder
  // arrives closed with its top edge at `top` (px from the top of the screen)
  | { type: "advance"; top: number };

type Note = { to: string; at: number; data: Pending };
let pending: Note | null = null;
let busy = false;

const norm = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);
/** A note older than this is stale (the navigation never arrived). */
const MAX_AGE = 15000;

/** Leave a note for the page at `to`, saying how it is being reached. */
export const setPending = (to: string, data: Pending) => {
  pending = { to: norm(to), at: Date.now(), data };
};

/**
 * A page asks how it was reached. The note is addressed, so:
 *  - the destination gets it — every time it asks, until it clears it (in
 *    development React and the router may run a page's setup more than once);
 *  - any other page gets "leaving": a navigation is under way and it must not
 *    touch anything (it is the page being left);
 *  - with no note at all (link, reload, back button) it gets null.
 */
export function readPending(path: string): Pending | "leaving" | null {
  if (!pending) return null;
  if (Date.now() - pending.at > MAX_AGE) {
    pending = null;
    return null;
  }
  return pending.to === norm(path) ? pending.data : "leaving";
}

/** The destination calls this once its entrance has finished. */
export const clearPending = (path: string) => {
  if (pending && pending.to === norm(path)) pending = null;
};

export const isBusy = () => busy;
export const setBusy = (value: boolean) => {
  busy = value;
};

export const toRect = (r: DOMRect): Rect => ({
  left: r.left,
  top: r.top,
  width: r.width,
  height: r.height,
});

// The header's close button lives outside the case page, so the page
// registers its animated close handler here.
let closeHandler: (() => void) | null = null;
export const registerClose = (fn: (() => void) | null) => {
  closeHandler = fn;
};
export const requestClose = () => {
  if (closeHandler) {
    closeHandler();
    return true;
  }
  return false;
};
