"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { freezeScroll } from "@/lib/lenis";
import { soundtrack } from "@/lib/audio";
import { getConsent, setConsent } from "@/lib/consent";
import { useConsent } from "@/components/Consent/useConsent";
import styles from "./Trailer.module.css";

type Props = {
  id: string;
  title: string;
  play: string;
  close: string;
  /** Shown instead of the player until YouTube media is allowed. */
  ask: { notice: string; allow: string; external: string };
};

/**
 * The play button on the trailer print, and the screen it opens. Nothing
 * from YouTube loads until the button is pressed (the print uses the static
 * thumbnail), and the player is the privacy-enhanced youtube-nocookie one.
 * The screen is portalled to <body> so dragging the print can't drag it too.
 */
export default function Trailer({ id, title, play, close, ask }: Props) {
  const { media } = useConsent();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const button = opener.current;
    dialog.current?.showModal();
    freezeScroll(true);
    soundtrack.hold(true); // the trailer has its own sound
    return () => {
      soundtrack.hold(false);
      freezeScroll(false);
      button?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      <button
        ref={opener}
        type="button"
        className={styles.play}
        onClick={() => setOpen(true)}
        data-cursor="play"
        aria-label={`${play}: ${title}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5.5v13l10.5-6.5z" />
        </svg>
      </button>

      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className={styles.dialog}
            aria-label={title}
            onClose={() => setOpen(false)}
            // a click on the dark backdrop (the dialog itself, not its contents) closes it
            onClick={(e) =>
              e.target === e.currentTarget && dialog.current?.close()
            }
          >
            <div className={styles.frame}>
              {media ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
                  title={title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                // No connection to YouTube until the reader agrees.
                <div className={styles.ask}>
                  <p>{ask.notice}</p>
                  <div>
                    <button type="button" onClick={() => setConsent({ ...getConsent(), media: true })}>
                      {ask.allow}
                    </button>
                    <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">
                      {ask.external} ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => dialog.current?.close()}
              data-cursor="close"
            >
              {close} ✕
            </button>
          </dialog>,
          document.body,
        )}
    </>
  );
}
