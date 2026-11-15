"use client";

/**
 * The reader's consent choices (see /legal/cookies). Kept in one strictly
 * necessary cookie, `ff_consent`, for 12 months; after that, or when this
 * policy's VERSION changes, the banner asks again.
 *
 * Categories:
 *  - preferences: remember the soundtrack position and play/pause choice
 *    (localStorage "ff-audio"). Off = nothing is stored; existing data is erased.
 *  - media: YouTube (Google): the trailer player and the trailer stills/
 *    thumbnails from i.ytimg.com. Off = the film's own poster is shown instead,
 *    and the trailer asks before loading.
 * Sound (not cookies, but asked in the same place):
 *  - autoplay: start a folder's music by itself (after the first tap).
 *  - background: keep playing when the tab is hidden or the screen is locked.
 *
 * Nothing optional is on before a choice is made. Strictly necessary storage
 * (this cookie, and the language cookie set when you pick a language) needs no
 * consent under the ePrivacy rules and Vietnam's PDP Law.
 */

export type Consent = {
  preferences: boolean;
  media: boolean;
  autoplay: boolean;
  background: boolean;
};

export type ConsentState = Consent & { decided: boolean };

const COOKIE = "ff_consent";
const VERSION = 1;
const MAX_AGE = 60 * 60 * 24 * 365; // 12 months

/** Before any choice: only what needs no consent. Music may still start after a tap. */
const UNDECIDED: ConsentState = { decided: false, preferences: false, media: false, autoplay: true, background: false };
export const ALL: Consent = { preferences: true, media: true, autoplay: true, background: true };
/** "Reject all": no optional storage or third parties; sound stays as the site plays it, in the foreground. */
export const NONE: Consent = { preferences: false, media: false, autoplay: true, background: false };

let state: ConsentState = UNDECIDED;
let loaded = false;
const listeners = new Set<() => void>();
const OPEN_EVENT = "ff:consent-open";

function read(): ConsentState {
  try {
    const raw = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
    if (!raw) return UNDECIDED;
    const v = JSON.parse(decodeURIComponent(raw.slice(COOKIE.length + 1)));
    if (v.v !== VERSION) return UNDECIDED;
    return { decided: true, preferences: !!v.p, media: !!v.m, autoplay: v.a !== false, background: !!v.b };
  } catch {
    return UNDECIDED;
  }
}

export function getConsent(): ConsentState {
  if (!loaded && typeof document !== "undefined") {
    state = read();
    loaded = true;
  }
  return state;
}

export const getServerConsent = () => UNDECIDED;

export function subscribeConsent(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setConsent(choice: Consent) {
  // Compact record, with the date it was given (kept as proof of consent).
  const record = { v: VERSION, p: choice.preferences, m: choice.media, a: choice.autoplay, b: choice.background, at: new Date().toISOString() };
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(record))}; path=/; max-age=${MAX_AGE}; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
  state = { ...choice, decided: true };
  loaded = true;
  listeners.forEach((fn) => fn());
}

/** Re-open the choices (the "Cookie settings" links). */
export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenConsentSettings(fn: () => void) {
  window.addEventListener(OPEN_EVENT, fn);
  return () => window.removeEventListener(OPEN_EVENT, fn);
}
