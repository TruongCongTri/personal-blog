"use client";

import type { Album } from "@/lib/discography";

/**
 * Soundtrack engine: one <audio> element for the whole visit (it survives
 * client-side navigation), driven by which film folder is open.
 *
 *  - Opening a folder with a soundtrack plays that movie's tracks in a loop.
 *    Leaving it fades out and pauses; coming back resumes where it stopped.
 *  - Where each movie stopped (track + second) is remembered for the visit,
 *    and saved in localStorage (resumes on the next visit) only with the
 *    reader's "preferences" consent. All of it follows setPolicy() (lib/consent).
 *  - Browsers only allow sound after the reader has touched the page. The
 *    first tap/click/key anywhere "unlocks" this element (iOS needs that to
 *    happen on the element itself); if a folder was opened from a direct link,
 *    that first tap also starts its music.
 *  - Keeps playing in the background (other tab, other app, screen locked) on
 *    desktop, Android and iOS, with lock-screen / notification / Dynamic
 *    Island controls: play, pause, skip, and a working scrubber.
 *  - Starts fast: the connection to R2 is opened on page load (layout), the
 *    soundtrack starts loading when a folder is hovered or touched (prime),
 *    and starts playing on the click itself, while the folder is still
 *    opening, not after. Files are faststart m4a streamed in byte ranges.
 *
 * React reads it through useSyncExternalStore (see components/Audio).
 */

export type AudioState = {
  albumId: string | null;
  trackIndex: number;
  playing: boolean;
  /** The reader's choice: false after they pause, true after they press play. */
  soundOn: boolean;
  /** Wants to play but the browser is waiting for a first tap. */
  blocked: boolean;
};

const STORE_KEY = "ff-audio";
const TARGET_VOLUME = 0.7;
const SAVE_EVERY_MS = 1000;

type Saved = { sound: boolean; progress: Record<string, { track: number; time: number }> };

// 0.1s of silence (8-bit mono WAV): used to unlock the element on a page without music.
function silentWav() {
  const samples = 800;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (o: number, s: string) => [...s].forEach((c, i) => (bytes[o + i] = c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, "data");
  view.setUint32(40, samples, true);
  bytes.fill(128, 44); // 8-bit silence is the midpoint
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

class SoundtrackEngine {
  private state: AudioState = { albumId: null, trackIndex: 0, playing: false, soundOn: true, blocked: false };
  private listeners = new Set<() => void>();
  private audio: HTMLAudioElement | null = null;
  private album: Album | undefined;
  private saved: Saved = { sound: true, progress: {} };
  private unlocked = false;
  /** True during the silent unlock play, which the UI must not see... */
  private unlocking = false;
  /** ...unless real playback was asked for meanwhile. */
  private wantPlay = false;
  private lastSave = 0;
  private fadeToken = 0;
  /** "albumId:track" whose file is already in the element (primed or loaded). */
  private loadedKey = "";
  private primer: HTMLAudioElement | null = null;
  /** From the reader's consent choices (lib/consent.ts). */
  private policy = { remember: false, autoplay: true, background: false };
  private storageRead = false;
  private resumeOnShow = false;
  private primedKey = "";
  /** Paused for something else with sound (the trailer). */
  private held = false;

  // ---- store plumbing (useSyncExternalStore)
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getState = () => this.state;
  private set(patch: Partial<AudioState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  /** The element, for progress displays (read-only use). */
  get element() {
    return this.audio;
  }

  // ---- setup
  init() {
    if (this.audio || typeof window === "undefined") return;

    // iOS 16.4+: treat this as media playback, so the silent switch doesn't mute it.
    try {
      const nav = navigator as unknown as { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = "playback";
    } catch {}


    // No crossOrigin: the bucket sends no CORS headers, and plain playback doesn't need them.
    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = TARGET_VOLUME;
    this.audio = audio;

    audio.addEventListener("play", () => {
      if (this.unlocking && !this.wantPlay) return;
      this.set({ playing: true, blocked: false });
      this.syncSession();
    });
    audio.addEventListener("pause", () => {
      if (this.unlocking && !this.wantPlay) return;
      this.save(true);
      this.set({ playing: false });
      this.syncSession();
    });
    for (const type of ["durationchange", "seeked", "ratechange"] as const)
      audio.addEventListener(type, () => this.syncSession());
    audio.addEventListener("timeupdate", () => this.save(false));
    audio.addEventListener("ended", () => this.step(1)); // only fires for playlists (one track loops)
    audio.addEventListener("error", () => {
      if (!this.album || audio.src.startsWith("data:")) return;
      if (this.album.tracks.length > 1) this.step(1);
      else this.set({ playing: false });
    });

    // First interaction unlocks sound (capture phase: before a click navigates away).
    const onGesture = () => this.unlock();
    for (const type of ["pointerdown", "keydown", "touchend"] as const)
      window.addEventListener(type, onGesture, { capture: true, passive: true });

    // Background playback, if the reader allowed it: nothing pauses when the
    // page is hidden, it just saves the position (iOS may freeze the page
    // without a pagehide). Otherwise it pauses, and resumes on return.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.save(true);
        this.resumeOnShow = !this.policy.background && !audio.paused;
        if (this.resumeOnShow) audio.pause();
      } else if (this.resumeOnShow) {
        this.resumeOnShow = false;
        if (this.album && !this.held) this.play();
      }
    });
    window.addEventListener("pagehide", () => this.save(true));

    if ("mediaSession" in navigator) {
      const ms = navigator.mediaSession;
      const on = (action: MediaSessionAction, fn: MediaSessionActionHandler) => {
        try {
          ms.setActionHandler(action, fn);
        } catch {} // older browsers reject actions they don't know
      };
      on("play", () => this.toggle(true));
      on("pause", () => this.toggle(false));
      on("stop", () => this.toggle(false));
      on("nexttrack", () => this.step(1));
      on("previoustrack", () => this.step(-1));
      on("seekto", (d) => {
        if (d.seekTime !== undefined) audio.currentTime = d.seekTime;
      });
      on("seekbackward", (d) => {
        audio.currentTime = Math.max(0, audio.currentTime - (d.seekOffset ?? 10));
      });
      on("seekforward", (d) => {
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (d.seekOffset ?? 10));
      });
    }
  }

  private unlock() {
    const audio = this.audio;
    if (!audio) return;
    // Opened by direct link, waiting for this first tap: start the music.
    if (this.state.blocked && this.album && this.autoplay) {
      this.play();
      return;
    }
    if (this.unlocked) return;
    this.unlocked = true;
    if (!audio.paused) return; // already playing from a gesture: nothing to unlock
    // Play something silently on this very element, inside the gesture, so the
    // music can start later without one (iOS requires this per element).
    const hadSrc = Boolean(audio.getAttribute("src"));
    if (!hadSrc) audio.src = silentWav();
    audio.muted = true;
    this.unlocking = true;
    audio
      .play()
      .then(() => {
        if (!this.wantPlay) audio.pause();
      })
      .catch(() => (this.unlocked = false))
      .finally(() => {
        audio.muted = false;
        this.unlocking = false;
        // The folder's music may have been asked for while unlocking.
        if (audio.src.startsWith("data:") && this.album) this.load(this.resumePoint(this.album), this.autoplay);
      });
  }

  // ---- progress
  private save(force: boolean) {
    const audio = this.audio;
    if (!audio || !this.album || audio.src.startsWith("data:")) return;
    const now = Date.now();
    if (!force && now - this.lastSave < SAVE_EVERY_MS) return;
    this.lastSave = now;
    this.saved.progress[this.album.id] = { track: this.state.trackIndex, time: Math.floor(audio.currentTime) };
    this.persist();
  }
  private persist() {
    if (!this.policy.remember) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.saved));
    } catch {}
  }
  private resumePoint(album: Album) {
    const p = this.saved.progress[album.id];
    const track = p && p.track < album.tracks.length ? p.track : 0;
    return { track, time: p && p.track === track ? p.time : 0 };
  }

  // ---- playback
  /** Called when the open folder changes. */
  setAlbum(album: Album | undefined) {
    const audio = this.audio;
    if (!audio) return;
    if (album?.id === this.album?.id) {
      // Same folder again (e.g. back from the drawer): carry on from where it paused.
      if (album && this.autoplay && audio.paused && !this.held) this.play();
      return;
    }
    if (this.album) this.save(true);
    this.album = album;

    if (!album || !album.tracks.length) {
      this.wantPlay = false;
      this.fadeTo(0, 500).then((ok) => ok && audio.pause());
      this.set({ albumId: null, blocked: false });
      return;
    }
    this.set({ albumId: album.id });
    // A quick dip out of the previous film, if one was playing, then straight in.
    const switchOver = () => this.load(this.resumePoint(album), this.autoplay);
    if (!audio.paused) this.fadeTo(0, 200).then((ok) => ok && switchOver());
    else switchOver();
  }

  private load(at: { track: number; time: number }, autoplay: boolean) {
    const audio = this.audio;
    const album = this.album;
    if (!audio || !album) return;
    const track = album.tracks[at.track];
    // A one-track soundtrack loops itself (gapless); playlists advance on "ended".
    audio.loop = album.tracks.length === 1;
    const key = `${album.id}:${at.track}`;
    if (this.loadedKey !== key || audio.src.startsWith("data:")) {
      // Media fragment: the browser starts fetching and playing at that second.
      audio.src = at.time > 0 ? `${track.url}#t=${at.time}` : track.url;
      audio.load();
      this.loadedKey = key;
    } // else: already buffering since it was primed (hover/touch), keep it
    this.set({ trackIndex: at.track });
    this.updateMediaSession();
    if (autoplay && !this.held) this.play();
  }

  private step(dir: 1 | -1) {
    const audio = this.audio;
    const album = this.album;
    if (!audio || !album) return;
    // "Previous" a few seconds into a track restarts it, like any player.
    if (dir === -1 && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const n = album.tracks.length;
    this.load({ track: (this.state.trackIndex + dir + n) % n, time: 0 }, this.state.soundOn || !audio.paused);
  }

  private async play() {
    const audio = this.audio;
    if (!audio || !this.album) return;
    const token = ++this.fadeToken;
    this.wantPlay = true;
    audio.volume = 0;
    try {
      await audio.play();
      // Set it here too: if the silent unlock already started this element,
      // the browser fires no second "play" event.
      this.set({ playing: true, blocked: false });
      this.syncSession();
      if (token === this.fadeToken) this.fadeTo(TARGET_VOLUME, 700);
    } catch (e) {
      audio.volume = TARGET_VOLUME;
      this.wantPlay = false;
      // Not allowed yet: wait for the first tap (see unlock()).
      if ((e as DOMException).name === "NotAllowedError") this.set({ blocked: true, playing: false });
    }
  }

  /** Smooth volume ramp. Resolves false if another fade took over. (iOS ignores volume: instant.) */
  private fadeTo(target: number, ms: number) {
    const audio = this.audio;
    const token = ++this.fadeToken;
    return new Promise<boolean>((resolve) => {
      if (!audio) return resolve(false);
      // In the background there is no animation frame to fade with (and iOS
      // ignores volume anyway): jump straight there.
      if (document.hidden) {
        audio.volume = target;
        return resolve(true);
      }
      const from = audio.volume;
      const start = performance.now();
      const tick = (now: number) => {
        if (token !== this.fadeToken) return resolve(false);
        // (the first frame's timestamp can be a hair before `start`)
        const t = Math.min(1, Math.max(0, (now - start) / ms));
        audio.volume = Math.min(1, Math.max(0, from + (target - from) * t));
        if (t < 1 && !document.hidden) requestAnimationFrame(tick);
        else {
          audio.volume = target;
          resolve(true);
        }
      };
      requestAnimationFrame(tick);
    });
  }

  /** Lock-screen scrubber and play/pause state. */
  private syncSession() {
    const audio = this.audio;
    if (!audio || !this.album || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          position: Math.min(audio.currentTime, audio.duration),
          playbackRate: audio.playbackRate || 1,
        });
      } catch {}
    }
  }

  /**
   * Start loading a soundtrack before its folder opens (hover, touch), so it
   * can play the moment the folder is clicked. Only while nothing is playing:
   * it never interrupts the current film.
   */
  prime(album: Album | undefined) {
    const audio = this.audio;
    if (!audio || !album?.tracks.length || album.id === this.album?.id) return;
    const at = this.resumePoint(album);
    const key = `${album.id}:${at.track}`;
    const url = album.tracks[at.track].url;
    const src = at.time > 0 ? `${url}#t=${at.time}` : url;
    if (!this.album && audio.paused) {
      // Nothing playing: load it into the real element.
      if (this.loadedKey === key) return;
      audio.src = src;
      audio.load();
      this.loadedKey = key;
      return;
    }
    // Something is playing: a second, never-played element fetches the start
    // of the file into the browser's cache, so the switch is quick.
    if (this.primedKey === key) return;
    this.primer ??= Object.assign(new Audio(), { preload: "auto", muted: true });
    this.primer.src = src;
    this.primer.load();
    this.primedKey = key;
  }

  private updateMediaSession() {
    const album = this.album;
    if (!album || !("mediaSession" in navigator)) return;
    const track = album.tracks[this.state.trackIndex];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: album.artist,
      album: album.title,
      artwork: [{ src: album.coverUrl, sizes: "512x512", type: "image/webp" }],
    });
  }

  /** Starts music by itself: the reader allows it and hasn't paused it. */
  private get autoplay() {
    return this.policy.autoplay && this.state.soundOn;
  }

  /** Apply the reader's consent choices. */
  setPolicy(next: { remember: boolean; autoplay: boolean; background: boolean }) {
    const was = this.policy;
    this.policy = next;
    if (next.remember && !this.storageRead) {
      // Allowed to remember: pick up where the last visit stopped.
      this.storageRead = true;
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as Saved;
          this.saved = { sound: stored.sound, progress: { ...stored.progress, ...this.saved.progress } };
          this.set({ soundOn: stored.sound !== false });
        }
      } catch {}
      this.persist();
    } else if (!next.remember && was.remember) {
      // Consent withdrawn: erase what was stored (the visit keeps its memory).
      this.storageRead = false;
      try {
        localStorage.removeItem(STORE_KEY);
      } catch {}
    }
    if (!next.autoplay && was.autoplay && this.state.blocked) this.set({ blocked: false });
  }

  // ---- public actions
  /** Play/pause, remembering the choice. */
  toggle(force?: boolean) {
    const audio = this.audio;
    if (!audio || !this.album) return;
    const on = force ?? audio.paused;
    this.saved.sound = on;
    this.persist();
    this.set({ soundOn: on, blocked: false });
    if (on) {
      this.held = false;
      this.play();
    } else {
      this.wantPlay = false;
      this.fadeTo(0, 300).then((ok) => {
        if (ok) audio.pause();
        audio.volume = TARGET_VOLUME;
      });
    }
  }
  next = () => this.step(1);
  prev = () => this.step(-1);
  selectTrack(i: number) {
    if (!this.album || i < 0 || i >= this.album.tracks.length) return;
    this.load({ track: i, time: 0 }, true);
  }

  /** Something else needs the speakers (the trailer): pause now, resume after. */
  hold(on: boolean) {
    const audio = this.audio;
    if (!audio) return;
    if (on) {
      this.held = !audio.paused;
      if (this.held) {
        this.wantPlay = false;
        audio.pause();
      }
    } else if (this.held) {
      this.held = false;
      if (this.album && this.state.soundOn) this.play();
    }
  }
}

export const soundtrack = new SoundtrackEngine();

export const SERVER_AUDIO_STATE: AudioState = {
  albumId: null,
  trackIndex: 0,
  playing: false,
  soundOn: true,
  blocked: false,
};
