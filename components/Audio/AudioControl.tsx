"use client";

import { useEffect, useRef, useState } from "react";
import { soundtrack } from "@/lib/audio";
import { openConsentSettings } from "@/lib/consent";
import { useConsent } from "@/components/Consent/useConsent";
import { useBgAudio } from "./AudioProvider";
import styles from "./AudioControl.module.css";

type Labels = {
  play: string;
  pause: string;
  next: string;
  prev: string;
  tap: string;
  tracks: string;
  settings: string;
};

/**
 * The soundtrack's floating control, bottom-left while a folder with music
 * is open: the poster as a spinning record with play/pause on it, the track
 * and film, and, for soundtracks with more than one track, skip buttons and
 * a track list. A ring round the record shows how far into the track it is.
 *
 * Beside it, once the reader has answered the consent banner, a small
 * settings button reopens their cookie & music choices (autoplay, background
 * play, remembering positions, YouTube). It stays on pages without music too.
 */
export default function AudioControl({ labels }: { labels: Labels }) {
  const {
    album,
    track,
    trackIndex,
    playing,
    blocked,
    togglePlay,
    nextTrack,
    prevTrack,
    selectTrack,
  } = useBgAudio();
  const { decided } = useConsent();
  const [open, setOpen] = useState(false);
  const ring = useRef<HTMLSpanElement>(null);
  const many = (album?.tracks.length ?? 0) > 1;

  // Progress ring, written straight to a CSS variable (no re-render per tick).
  useEffect(() => {
    const audio = soundtrack.element;
    if (!audio) return;
    const update = () => {
      const p = audio.duration ? audio.currentTime / audio.duration : 0;
      ring.current?.style.setProperty("--p", String(p));
    };
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("loadedmetadata", update);
    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("loadedmetadata", update);
    };
  }, [album]);

  return (
    <div
      className={styles.control}
      data-visible={Boolean(album) || decided}
      data-has-album={Boolean(album)}
      data-playing={playing}
      data-blocked={blocked}
      aria-hidden={!album && !decided}
    >
      {open && many && album && (
        <ol className={styles.list} aria-label={labels.tracks}>
          {album.tracks.map((t, i) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => selectTrack(i)}
                aria-current={i === trackIndex}
              >
                <span>{String(i + 1).padStart(2, "0")}</span> {t.title}
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className={styles.row}>
        {decided && (
          <button
            type="button"
            className={styles.settings}
            onClick={openConsentSettings}
            aria-label={labels.settings}
            title={labels.settings}
            data-cursor="open"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
              <circle cx="15" cy="7" r="2" />
              <circle cx="9" cy="17" r="2" />
            </svg>
          </button>
        )}
        <div className={styles.pill}>
          <button
            type="button"
            className={styles.disc}
            onClick={togglePlay}
            aria-label={`${playing ? labels.pause : labels.play}: ${track?.title ?? ""}`}
            tabIndex={album ? 0 : -1}
          >
            <span ref={ring} className={styles.ring} />
            {album && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.poster}
                src={album.coverUrl}
                alt=""
                width={44}
                height={44}
                decoding="async"
              />
            )}
            <span className={styles.icon} aria-hidden="true">
              {playing ? (
                <svg viewBox="0 0 24 24">
                  <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M8 5.5v13l10.5-6.5z" />
                </svg>
              )}
            </span>
          </button>

          <button
            type="button"
            className={styles.meta}
            onClick={() => (many ? setOpen(!open) : togglePlay())}
            aria-expanded={many ? open : undefined}
            tabIndex={album ? 0 : -1}
          >
            <span className={styles.title}>
              {blocked ? labels.tap : track?.title}
            </span>
            <span className={styles.sub}>
              {album?.title}
              {playing && (
                <span className={styles.bars} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </span>
          </button>

          {many && (
            <span className={styles.skip}>
              <button
                type="button"
                onClick={prevTrack}
                aria-label={labels.prev}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 6h2v12H7zM19 6v12l-9-6z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextTrack}
                aria-label={labels.next}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 6h2v12h-2zM5 6v12l9-6z" />
                </svg>
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
