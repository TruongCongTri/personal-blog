"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { Draggable, useGSAP } from "@/lib/gsap";
import Clip from "@/components/Clip/Clip";
import Trailer from "@/components/Trailer/Trailer";
import Lightbox, { type LightboxImage } from "@/components/Lightbox/Lightbox";
import { Clapper, Reel } from "@/components/FilmIcons/FilmIcons";
import type { ClipSpec, Scrap } from "@/lib/schema";
import { useConsent } from "@/components/Consent/useConsent";
import styles from "./Scrapbook.module.css";

/** What the papers can say about the film they belong to. */
export type ScrapFilm = {
  title: string;
  year: number;
  /** YouTube video id of the trailer. */
  trailer?: string;
  /** Verdict, already in words ("In between"). */
  verdict: string;
  /** The film's poster: stands in for YouTube images until they're allowed. */
  poster?: string;
};

export type ScrapLabels = {
  note: string;
  verdict: string;
  trailer: string;
  play: string;
  close: string;
  admit: string;
  row: string;
  seat: string;
  /** Trailer notice before YouTube is allowed. */
  ask: { notice: string; allow: string; external: string };
  /** "View frame 1" etc. */
  frame: string;
  prevFrame: string;
  nextFrame: string;
};

type Props = {
  scraps: Scrap[];
  labels: ScrapLabels;
  film?: ScrapFilm;
  /** Height of the desk below the sheet on wide screens, in rem. */
  desk?: number;
};

/** Stable fake seat numbers, so the ticket is the same on every visit. */
function seatFor(title: string, year: number) {
  const n = [...title].reduce((s, c) => s + c.charCodeAt(0), year);
  return { row: String.fromCharCode(65 + (n % 12)), seat: 1 + (n % 24) };
}

/** A clip from the data, falling back to the way this kind of object is usually held. */
function ClipFor({ spec, fallback }: { spec: ClipSpec | undefined; fallback: Exclude<ClipSpec, false> }) {
  if (spec === false) return null;
  const c = { ...fallback, ...spec };
  return <Clip kind={c.kind} at={c.at ?? "top"} offset={c.offset} tilt={c.tilt} tone={c.tone} />;
}

const yt = (id: string, name: string) => `https://i.ytimg.com/vi/${id}/${name}.jpg`;

type Frame = { thumb: string } & LightboxImage;

/** A strip of 35mm film; each frame opens large. */
function FilmStrip({ frames, clip, labels }: { frames: Frame[]; clip: ClipSpec | undefined; labels: ScrapLabels }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className={styles.strip} data-drag>
      <ClipFor spec={clip} fallback={{ at: "corner-right", offset: "1.1rem", tone: "brass" }} />
      <div className={styles.stripPaper}>
        {frames.map((f, i) => (
          // Buttons: a click opens the frame, and Draggable never starts a drag on them.
          <button
            key={f.thumb}
            type="button"
            className={styles.frame}
            onClick={() => setOpen(i)}
            aria-label={`${labels.frame} ${i + 1}`}
            data-cursor="open"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={f.thumb}
              alt=""
              width={160}
              height={90}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={f.thumb.includes("#") ? { objectPosition: `center ${f.thumb.split("#")[1]}` } : undefined}
            />
          </button>
        ))}
      </div>
      <Lightbox
        images={frames}
        index={open}
        onIndex={setOpen}
        labels={{ close: labels.close, prev: labels.prevFrame, next: labels.nextFrame }}
      />
    </div>
  );
}

/**
 * Loose papers lying on the open folder. Every review lists its own (see
 * CONTENT.md): notes, the verdict stamp, the trailer print, photos, a ticket
 * stub, a film strip, stickers, newspaper clippings, a ruler. Each kind is
 * held the way you'd really hold it unless the review says otherwise: a
 * paperclip over the top of a note, a bulldog clip on a thick print, a clip
 * across the side of a ticket, one over the corner of a film strip.
 *
 * Wide screens: placed on the desk from each paper's x/y, draggable with a
 * mouse. Phones: a loose pile in list order, never fighting the scroll.
 */
export default function Scrapbook({ scraps, labels, film, desk }: Props) {
  const root = useRef<HTMLDivElement>(null);
  // YouTube images (thumbnails, trailer frames) only with media consent.
  const { media } = useConsent();

  useGSAP(
    () => {
      if (!window.matchMedia("(pointer: fine) and (min-width: 1025px)").matches) return;
      const bounds = root.current?.closest("[data-case-inner]") ?? undefined;
      const drags = Draggable.create(root.current!.querySelectorAll("[data-drag]"), {
        type: "x,y",
        zIndexBoost: true,
        onPress() {
          // Bounds are applied on press, not at creation: while the entrance
          // animation runs the papers sit 50vh lower, and bounds applied then
          // would shove them up into the sheet for good.
          if (bounds) this.applyBounds(bounds);
          (this.target as HTMLElement).classList.add(styles.grabbing);
        },
        onRelease() {
          (this.target as HTMLElement).classList.remove(styles.grabbing);
        },
      });
      return () => drags.forEach((d) => d.kill());
    },
    { scope: root, dependencies: [scraps] },
  );

  const render = (s: Scrap): ReactNode => {
    switch (s.type) {
      case "note":
        return (
          <div className={styles.note} data-drag>
            <ClipFor spec={s.clip} fallback={{ at: "top", offset: "78%", tilt: 6 }} />
            <div className={styles.notePaper} style={s.color ? { background: s.color } : undefined}>
              <span className={styles.noteLabel}>{s.label ?? labels.note}</span>
              <p>{s.text}</p>
            </div>
          </div>
        );

      case "stamp":
        return (
          <div className={styles.stamp} data-drag>
            <span>{s.label ?? labels.verdict}</span>
            <strong>{s.text ?? film?.verdict}</strong>
          </div>
        );

      case "trailer":
        if (!film?.trailer) return null;
        return (
          <div className={styles.print} data-drag>
            <ClipFor spec={s.clip} fallback={{ kind: "binder", at: "top", offset: "50%", tilt: -3 }} />
            <figure className={styles.printPaper}>
              <div className={styles.printImage}>
                {/* A static thumbnail: no YouTube script loads until play is pressed
                    (and no Google image at all without media consent: the poster instead). */}
                {media || !film.poster ? (
                  media && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={yt(film.trailer, "hqdefault")} alt="" width={480} height={360} loading="lazy" decoding="async" draggable={false} />
                  )
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={film.poster} alt="" width={600} height={900} loading="lazy" decoding="async" draggable={false} className={styles.posterCrop} />
                )}
                <Trailer
                  id={film.trailer}
                  title={`${labels.trailer} — ${film.title} (${film.year})`}
                  play={labels.play}
                  close={labels.close}
                  ask={labels.ask}
                />
              </div>
              <figcaption>
                {labels.trailer} · {film.title} ({film.year})
              </figcaption>
            </figure>
          </div>
        );

      case "photo":
        return (
          <div className={styles.print} data-drag>
            <ClipFor spec={s.clip} fallback={{ at: "corner", offset: "1.1rem", tone: "silver" }} />
            <figure className={styles.printPaper}>
              <div className={styles.photoImage} style={{ aspectRatio: s.ratio ?? 4 / 3 }}>
                <Image src={s.src} alt={s.alt ?? s.caption ?? ""} fill sizes="(min-width: 1025px) 20rem, 80vw" draggable={false} />
              </div>
              {s.caption && <figcaption>{s.caption}</figcaption>}
            </figure>
          </div>
        );

      case "ticket": {
        if (!film) return null;
        const seat = seatFor(film.title, film.year);
        return (
          <div className={styles.ticket} data-drag>
            <ClipFor spec={s.clip} fallback={{ at: "left", offset: "50%", tilt: -8 }} />
            <div className={styles.ticketPaper}>
              <span className={styles.stub}>{labels.admit}</span>
              <span className={styles.ticketMain}>
                <strong>{film.title}</strong>
                <span>
                  {film.year} · {labels.row} {seat.row} · {labels.seat} {seat.seat}
                </span>
              </span>
            </div>
          </div>
        );
      }

      case "strip": {
        // The review's own frames, or three frames from the trailer: small
        // ones on the strip, full-size (1280px) in the large view.
        const frames: Frame[] = s.frames?.length
          ? s.frames.map((src) => ({ thumb: src, src }))
          : !media && film?.poster
            ? // Without YouTube: three crops of the poster stand in for the frames.
              ["top", "center", "bottom"].map((pos) => ({ thumb: `${film.poster}#${pos}`, src: film.poster! }))
            : media && film?.trailer
            ? ["1", "2", "3"].map((n) => ({
                thumb: yt(film.trailer!, `mq${n}`),
                src: yt(film.trailer!, `maxres${n}`),
                fallback: yt(film.trailer!, `hq${n}`),
              }))
            : [];
        if (!frames.length) return null;
        return <FilmStrip frames={frames} clip={s.clip} labels={labels} />;
      }

      case "sticker": {
        const shape = s.shape ?? "round";
        const style = { "--sticker-bg": s.color, "--sticker-ink": s.ink } as CSSProperties;
        return (
          <div className={`${styles.sticker} ${styles[shape]}`} style={style} data-drag>
            {s.icon && (
              <span className={styles.stickerIcon} aria-hidden="true">
                {s.icon === "reel" ? <Reel /> : <Clapper />}
              </span>
            )}
            {shape === "label" ? <strong>{s.text}</strong> : <span>{s.text}</span>}
            {s.sub && <small>{s.sub}</small>}
          </div>
        );
      }

      case "clipping":
        return (
          <div className={styles.clipping} data-drag>
            <ClipFor spec={s.clip} fallback={{ at: "top", offset: "22%", tilt: -5, tone: "silver" }} />
            <div className={styles.clippingPaper}>
              {s.title && <strong>{s.title}</strong>}
              <p>{s.text}</p>
              {s.source && <small>— {s.source}</small>}
            </div>
          </div>
        );

      case "ruler":
        return (
          <div className={styles.ruler} data-drag aria-hidden="true">
            {Array.from({ length: 31 }, (_, i) => (
              <span key={i} className={i % 5 === 0 ? styles.major : undefined}>
                {i % 5 === 0 ? <em>{i}</em> : null}
              </span>
            ))}
          </div>
        );
    }
  };

  return (
    <div
      ref={root}
      className={styles.scrapbook}
      style={desk ? ({ "--desk": `${desk}rem` } as CSSProperties) : undefined}
      data-scrapbook
    >
      {scraps.map((s, i) => {
        const content = render(s);
        if (!content) return null;
        const p = s.place ?? {};
        const style = {
          "--x": p.x !== undefined ? `${p.x}%` : undefined,
          "--y": p.y !== undefined ? `${p.y}rem` : undefined,
          "--r": p.r !== undefined ? `${p.r}deg` : undefined,
          "--w": p.w !== undefined ? `${p.w}rem` : undefined,
        } as CSSProperties;
        return (
          <div
            key={i}
            className={`${styles.item} ${styles[`${s.type}Item`] ?? ""} ${p.mobile === false ? styles.desktopOnly : ""}`}
            style={style}
            data-scrap
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
