"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Draggable, gsap, useGSAP } from "@/lib/gsap";
import Clip from "@/components/Clip/Clip";
import Trailer from "@/components/Trailer/Trailer";
import Lightbox, { type LightboxImage } from "@/components/Lightbox/Lightbox";
import { Clapper, Reel } from "@/components/FilmIcons/FilmIcons";
import FilmObject from "@/components/FilmObject/FilmObject";
import Image from "next/image";
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
  /** "Source" on the large view's caption card */
  source: string;
  /** Source credited for trailer stills */
  trailerSource: string;
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
  // Held somewhere else than usual: the usual spot along the edge (and its tilt,
  // kind and tone) belong to the usual edge, so only the review's own values count.
  const moved = spec?.at !== undefined && spec.at !== fallback.at;
  const c = moved ? { ...spec } : { ...fallback, ...spec };
  return <Clip kind={c.kind} at={c.at ?? "top"} offset={c.offset} tilt={c.tilt} tone={c.tone} />;
}

const yt = (id: string, name: string) => `https://i.ytimg.com/vi/${id}/${name}.jpg`;

/** True right after a drag: the release of a drag must not count as a click. */
const wasDragged = (e: { currentTarget: Element }) =>
  e.currentTarget.closest<HTMLElement>("[data-drag]")?.dataset.dragged === "true";

type Frame = { thumb: string } & LightboxImage;

/** A strip of 35mm film; each frame opens large, growing out of the strip. */
function FilmStrip({ frames, clip, labels }: { frames: Frame[]; clip: ClipSpec | undefined; labels: ScrapLabels }) {
  const [open, setOpen] = useState<number | null>(null);
  const paper = useRef<HTMLDivElement>(null);
  return (
    <div className={styles.strip} data-drag>
      <ClipFor spec={clip} fallback={{ at: "corner-right", offset: "1.1rem", tone: "brass" }} />
      <div ref={paper} className={styles.stripPaper}>
        {frames.map((f, i) => (
          <button
            key={f.thumb}
            type="button"
            className={styles.frame}
            onClick={(e) => !wasDragged(e) && setOpen(i)}
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
        origin={(i) => paper.current?.querySelectorAll("button")[i] ?? null}
        labels={{ close: labels.close, prev: labels.prevFrame, next: labels.nextFrame, source: labels.source }}
      />
    </div>
  );
}

/** The film's object, a cut-out photo lying on the desk; it opens large with its credit. */
function ObjectPhoto({
  src,
  ratio = 1,
  title,
  alt,
  credit,
  url,
  width = 16,
  labels,
}: {
  width?: number;
  src: string;
  ratio?: number;
  title?: string;
  alt?: string;
  credit?: string;
  url?: string;
  labels: ScrapLabels;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const pic = useRef<HTMLButtonElement>(null);
  return (
    <div className={styles.object} data-object="photo" data-drag>
      <button
        ref={pic}
        type="button"
        className={styles.objectPhoto}
        style={{ aspectRatio: ratio }}
        onClick={(e) => !wasDragged(e) && setOpen(0)}
        aria-label={title ?? alt ?? labels.frame}
        title={credit}
        data-cursor="open"
      >
        <Image
          src={src}
          alt={alt ?? title ?? ""}
          fill
          // Its real size on screen, so phones get a small file (not a 30rem one)
          sizes={`(min-width: 1025px) ${width}rem, min(85vw, ${width}rem)`}
          // Fetched with the page (at low priority), not when scrolled to:
          // it is there by the time the reader reaches the desk.
          loading="eager"
          fetchPriority="low"
          draggable={false}
        />
      </button>
      <Lightbox
        images={[{ src, thumb: src, ratio, title, alt, source: credit, sourceUrl: url, contain: true }]}
        index={open}
        onIndex={setOpen}
        origin={() => pic.current}
        labels={{ close: labels.close, prev: labels.prevFrame, next: labels.nextFrame, source: labels.source }}
      />
    </div>
  );
}

/** A still from the film, lying loose; it opens large, growing out of the desk. */
function Still({
  image,
  caption,
  clip,
  labels,
}: {
  image: LightboxImage & { thumb: string };
  caption?: string;
  clip: ClipSpec | undefined;
  labels: ScrapLabels;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const pic = useRef<HTMLButtonElement>(null);
  return (
    <div className={styles.print} data-drag>
      <ClipFor spec={clip} fallback={{ kind: "tape", at: "top", offset: "50%" }} />
      <figure className={styles.printPaper}>
        <button
          ref={pic}
          type="button"
          className={styles.photoImage}
          style={{ aspectRatio: image.ratio ?? 16 / 9 }}
          onClick={(e) => !wasDragged(e) && setOpen(0)}
          aria-label={image.title ?? caption ?? labels.frame}
          data-cursor="open"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.thumb} alt={image.alt ?? ""} loading="lazy" decoding="async" draggable={false} />
        </button>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
      <Lightbox
        images={[image]}
        index={open}
        onIndex={setOpen}
        origin={() => pic.current}
        labels={{ close: labels.close, prev: labels.prevFrame, next: labels.nextFrame, source: labels.source }}
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

  // Papers "on the paper" are placed from the top of page 1, as a share of its
  // height: keep the page's position and size, relative to the desk, in CSS
  // variables (no re-render).
  useEffect(() => {
    const el = root.current;
    const folder = el?.parentElement;
    const sheet = folder?.querySelector<HTMLElement>("[data-sheet]");
    if (!el || !sheet) return;
    const measure = () => {
      const page = sheet.querySelector<HTMLElement>("[data-page]") ?? sheet;
      el.style.setProperty("--paper-top", `${sheet.offsetTop - el.offsetTop}px`);
      el.style.setProperty("--page-h", `${page.offsetHeight}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sheet);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const el = root.current!;
      // (Re-run when consent changes which papers exist: YouTube stills appear
      // only once the browser has read it, after the first render.)
      // Papers overlap; the one you touch comes to the top of the pile.
      let top = 20;
      const toFront = (e: Event) => ((e.currentTarget as HTMLElement).style.zIndex = String(++top));
      const items = Array.from(el.querySelectorAll<HTMLElement>("[data-scrap]"));
      items.forEach((i) => i.addEventListener("pointerdown", toFront));
      const unlisten = () => items.forEach((i) => i.removeEventListener("pointerdown", toFront));
      if (!window.matchMedia("(pointer: fine) and (min-width: 1025px)").matches) return unlisten;

      const area = el.closest<HTMLElement>("[data-case-inner]");
      type Box = { minX: number; maxX: number; minY: number; maxY: number };
      // Per paper: the x/y range where it may rest, close around the folder.
      const resting = new WeakMap<Element, Box>();
      const drags = Draggable.create(el.querySelectorAll("[data-drag]"), {
        type: "x,y",
        // Pictures and buttons can be grabbed too (a plain click still opens them).
        dragClickables: true,
        // Past the folder's edge it drags with growing resistance...
        edgeResistance: 0.8,
        onDragStart() {
          (this.target as HTMLElement).dataset.dragged = "true";
        },
        onPress() {
          const t = this.target as HTMLElement;
          t.classList.add(styles.grabbing);
          if (!area) return;
          // Measured on press, not at creation: during the entrance the papers
          // sit 50vh lower, and limits taken then would be wrong.
          const r = t.getBoundingClientRect();
          const a = area.getBoundingClientRect();
          // x/y that keep it exactly on the folder...
          const on = {
            minX: this.x + (a.left - r.left),
            maxX: this.x + (a.right - r.right),
            minY: this.y + (a.top - r.top),
            maxY: this.y + (a.bottom - r.bottom),
          };
          // ...where it may rest: hanging off the folder by up to ~3/4 of its
          // size at the sides and top, a little at the bottom (the next folder
          // starts below), and never off the screen sideways.
          const sx = r.width * 0.75;
          const sy = r.height * 0.75;
          const screenMin = this.x - r.left + 8;
          const screenMax = this.x + (document.documentElement.clientWidth - r.right) - 8;
          const rest = {
            minX: Math.max(on.minX - sx, screenMin),
            maxX: Math.min(on.maxX + sx, screenMax),
            minY: on.minY - sy,
            maxY: on.maxY + r.height * 0.25,
          };
          resting.set(t, rest);
          // While dragging it can go further still, with growing resistance.
          this.applyBounds({
            minX: Math.min(rest.minX, on.minX - r.width * 1.6),
            maxX: Math.max(rest.maxX, on.maxX + r.width * 1.6),
            minY: on.minY - r.height * 1.6,
            maxY: on.maxY + r.height * 1.2,
          });
        },
        onRelease() {
          const t = this.target as HTMLElement;
          t.classList.remove(styles.grabbing);
          // the click that follows this release isn't a click
          setTimeout(() => delete t.dataset.dragged, 0);
          const rest = resting.get(t);
          if (!rest) return;
          const outX = Math.max(rest.minX - this.x, this.x - rest.maxX, 0);
          const outY = Math.max(rest.minY - this.y, this.y - rest.maxY, 0);
          // Dropped off the folder but close by: it stays. Dropped too far away:
          // it springs back to rest just beside the folder (not onto it).
          if (outX > 0.5 || outY > 0.5) {
            gsap.to(t, {
              x: gsap.utils.clamp(rest.minX, rest.maxX, this.x),
              y: gsap.utils.clamp(rest.minY, rest.maxY, this.y),
              duration: 0.9,
              ease: "elastic.out(1, 0.55)",
              // keep the Draggable's idea of x/y in step (arrow fn: same `this`)
              onUpdate: () => this.update(),
            });
          }
        },
      });
      return () => {
        unlisten();
        drags.forEach((d) => d.kill());
      };
    },
    { scope: root, dependencies: [scraps, media] },
  );

  const render = (s: Scrap): ReactNode => {
    switch (s.type) {
      case "note":
        return (
          <div className={styles.note} data-drag>
            <ClipFor spec={s.clip} fallback={{ at: "top", offset: "78%", tilt: 6 }} />
            <div
              className={`${styles.notePaper} ${styles[`paper_${s.paper ?? "sticky"}`] ?? ""}`}
              style={s.color ? { background: s.color } : undefined}
            >
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

      case "photo": {
        // "yt:maxresdefault", "yt:maxres2"…: a still from the trailer (only with
        // YouTube consent). Anything else: the review's own image.
        const name = s.src.startsWith("yt:") ? s.src.slice(3) : null;
        if (name && (!media || !film?.trailer)) return null;
        const n = name?.match(/\d$/)?.[0] ?? "default";
        const image = name
          ? {
              src: yt(film!.trailer!, name),
              fallback: yt(film!.trailer!, `hq${n}`),
              thumb: yt(film!.trailer!, `sd${n}`),
              ratio: 16 / 9,
              title: s.caption ?? `${film!.title} (${film!.year})`,
              source: s.source ?? labels.trailerSource,
            }
          : { src: s.src, thumb: s.src, ratio: s.ratio ?? 4 / 3, title: s.caption, source: s.source, alt: s.alt };
        return <Still image={image} caption={name ? undefined : s.caption} clip={s.clip} labels={labels} />;
      }

      case "torn":
        return (
          <div className={`${styles.torn} ${styles[`torn_${s.edge ?? "bottom"}`] ?? ""}`} data-drag>
            {s.clip && <ClipFor spec={s.clip} fallback={{ kind: "tape", at: "top", offset: "50%" }} />}
            <div className={styles.tornPaper} style={s.color ? ({ "--paper": s.color } as CSSProperties) : undefined}>
              {s.title && <h3>{s.title}</h3>}
              {s.label && <strong>{s.label}</strong>}
              <p>{s.text}</p>
            </div>
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

      case "object":
        if (s.src)
          return (
            <ObjectPhoto
              src={s.src}
              ratio={s.ratio}
              title={s.title}
              alt={s.alt}
              credit={s.credit}
              url={s.url}
              width={(s.place?.w ?? 16) * (s.place?.s ?? 1)}
              labels={labels}
            />
          );
        if (!s.kind) return null;
        return (
          <div className={styles.object} data-object={s.kind} data-drag aria-hidden="true">
            <FilmObject kind={s.kind} />
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
          "--y": p.y !== undefined && p.on !== "paper" ? `${p.y}rem` : undefined,
          "--yp": p.on === "paper" && p.y !== undefined ? String(p.y) : undefined,
          "--r": p.r !== undefined ? `${p.r}deg` : undefined,
          "--w": p.w !== undefined ? `${p.w}rem` : undefined,
          "--s": p.s !== undefined ? String(p.s) : undefined,
        } as CSSProperties;
        return (
          <div
            key={i}
            className={`${styles.item} ${styles[`${s.type}Item`] ?? ""} ${p.mobile === false ? styles.desktopOnly : ""} ${p.on === "paper" ? styles.onPaper : ""}`}
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
