"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { soundtrack, SERVER_AUDIO_STATE, type AudioState } from "@/lib/audio";
import { isBusy } from "@/lib/transition";
import { useConsent } from "@/components/Consent/useConsent";
import { albumForPath, DISCOGRAPHY, type Album, type Track } from "@/lib/discography";

type AudioContextValue = AudioState & {
  album: Album | undefined;
  track: Track | undefined;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  selectTrack: (index: number) => void;
};

const BgAudioContext = createContext<AudioContextValue | null>(null);

/**
 * Mounted once in the root layout, so the music carries on across page
 * changes. Picks the soundtrack from the page (lib/discography.ts): a folder
 * plays its film's music; the drawer and About have their own.
 */
/** The internal link an event is on, if any. */
function linkPath(target: EventTarget | null) {
  const a = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
  if (!a || a.target === "_blank") return null;
  const url = new URL(a.href, location.href);
  return url.origin === location.origin ? url.pathname : null;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const album = albumForPath(pathname);
  const consent = useConsent();

  useEffect(() => {
    soundtrack.init();
    // Hover or touch on a folder link: start loading its soundtrack.
    const onIntent = (e: Event) => {
      const path = linkPath(e.target);
      if (path) soundtrack.prime(albumForPath(path));
    };
    // Click: switch the music right away, inside the gesture, while the folder
    // is still opening (the route change follows a moment later and agrees).
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || isBusy()) return;
      const path = linkPath(e.target);
      if (path && path !== location.pathname) soundtrack.setAlbum(albumForPath(path));
    };
    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("touchstart", onIntent, { passive: true, capture: true });
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("touchstart", onIntent, { capture: true });
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);
  // Consent first, so the engine knows what it may store and start.
  useEffect(
    () => soundtrack.setPolicy({ remember: consent.preferences, autoplay: consent.autoplay, background: consent.background }),
    [consent.preferences, consent.autoplay, consent.background],
  );
  useEffect(() => soundtrack.setAlbum(album), [album]);

  const state = useSyncExternalStore(soundtrack.subscribe, soundtrack.getState, () => SERVER_AUDIO_STATE);

  const value = useMemo<AudioContextValue>(() => {
    const current = DISCOGRAPHY.find((a) => a.id === state.albumId);
    return {
      ...state,
      album: current,
      track: current?.tracks[state.trackIndex],
      togglePlay: () => soundtrack.toggle(),
      nextTrack: soundtrack.next,
      prevTrack: soundtrack.prev,
      selectTrack: (i) => soundtrack.selectTrack(i),
    };
  }, [state]);

  return <BgAudioContext.Provider value={value}>{children}</BgAudioContext.Provider>;
}

export const useBgAudio = () => {
  const ctx = useContext(BgAudioContext);
  if (!ctx) throw new Error("useBgAudio must be used within AudioProvider");
  return ctx;
};
