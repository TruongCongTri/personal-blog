"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CookieSettingsButton from "@/components/Consent/CookieSettingsButton";
import Clip from "@/components/Clip/Clip";
import type { Block } from "@/lib/schema";
import { partId } from "@/lib/parts";
import styles from "./CaseSheet.module.css";

type Props = {
  info: string[];
  /** The saying this film is tested against. */
  quote?: { label: string; text: string; by: string };
  body: Block[];
  /** Shown while the analysis hasn't been written (empty body). */
  soon?: string;
  plate: string;
  title: string;
  still?: string;
  /** The print shows a poster: portrait 2:3. */
  stillIsPoster?: boolean;
  /** Links typed at the foot of the sheet (About: the policies), plus a cookie-settings button. */
  links?: { label: string; items: { href: string; label: string }[]; settings?: string };
};

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** A4: 210 × 297 mm. */
const A4 = 297 / 210;
/** Below this width the sheet is one continuous page (phones). */
const PAGED = "(min-width: 769px)";

/** A paragraph's share of a page: characters [from, to) of its text. */
type Piece = { from: number; to?: number };

/**
 * One block of the review's text: a paragraph, heading, pull quote or clipped
 * image. A paragraph can be a piece of itself, when it runs on to the next
 * page. `measure`: the hidden copy used to find where lines break.
 */
function BodyBlock({ block, index, piece, measure }: { block: Block; index: number; piece?: Piece; measure?: boolean }) {
  // the first piece (or the whole block) carries the anchors; the rest are marked as continuations
  const marks = measure
    ? { "data-mblock": index }
    : piece && piece.from > 0
      ? { "data-block-cont": index }
      : { "data-block": index };
  switch (block.type) {
    case "p": {
      const text = piece ? block.text.slice(piece.from, piece.to) : block.text;
      return (
        <p
          {...marks}
          id={!measure && index === 0 && !(piece && piece.from > 0) ? partId(0) : undefined}
          className={piece && piece.from > 0 ? styles.contPiece : undefined}
        >
          {text}
        </p>
      );
    }
    case "h": {
      // anchors for the contents in the progress card
      const Tag = block.level === 3 ? "h3" : "h2";
      return (
        <Tag className={`${styles.subhead} ${block.level === 3 ? styles.point : ""}`} {...marks} id={measure ? undefined : partId(index)}>
          {block.text}
        </Tag>
      );
    }
    case "quote":
      return (
        <blockquote className={styles.pull} {...marks}>
          <p>“{block.text}”</p>
          {block.by && <cite>— {block.by}</cite>}
        </blockquote>
      );
    case "image": {
      const clip =
        block.clip === false
          ? null
          : { tilt: -4, ...block.clip, at: block.clip?.at ?? "top", offset: block.clip?.offset ?? (block.clip?.at ? undefined : "18%") };
      return (
        <figure className={styles.figure} {...marks}>
          {clip && <Clip kind={clip.kind} at={clip.at} offset={clip.offset} tilt={clip.tilt} tone={clip.tone} />}
          <div className={styles.figureImage} style={{ aspectRatio: block.ratio ?? 16 / 9 }}>
            <Image src={block.src} alt={block.alt ?? block.caption ?? ""} fill sizes="(min-width: 1025px) 40vw, 85vw" />
          </div>
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    }
  }
}

type Seg = { i: number } & Piece;

const sameLayout = (a: Seg[][], b: Seg[][]) => JSON.stringify(a) === JSON.stringify(b);

/** Lines of a laid-out paragraph: where each starts in its text, and its top and bottom (px, from the paragraph's top). */
function linesOf(p: HTMLElement) {
  const node = p.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return [];
  const text = node.textContent ?? "";
  const top0 = p.getBoundingClientRect().top;
  const range = document.createRange();
  const lines: { start: number; top: number; bottom: number }[] = [];
  for (let k = 0; k < text.length; k++) {
    if (/\s/.test(text[k])) continue;
    range.setStart(node, k);
    range.setEnd(node, k + 1);
    const r = range.getClientRects()[0];
    if (!r) continue;
    const last = lines[lines.length - 1];
    if (!last || r.top >= last.bottom - 2) lines.push({ start: k, top: r.top - top0, bottom: r.bottom - top0 });
    else last.bottom = Math.max(last.bottom, r.bottom - top0);
  }
  return lines;
}

/**
 * Lays the essay out on A4 pages, filling each one to its last line: a
 * paragraph that doesn't fit is split at a line break and carries on at the
 * top of the next page (headings, quotes and images move whole). A heading
 * never ends a page alone, and a paragraph never leaves a single line behind.
 *
 * Measured on a hidden copy of the text at the same width (`measure`), so the
 * visible pages can change without feeding back into the measurement.
 * Re-measured on resize and once the web fonts are in. On phones: one page.
 */
function usePages(root: React.RefObject<HTMLDivElement | null>, body: Block[]) {
  const [paged, setPaged] = useState(false);
  const [pages, setPages] = useState<Seg[][]>([]);

  useIsoLayoutEffect(() => {
    const mq = window.matchMedia(PAGED);
    const sync = () => setPaged(mq.matches && body.length > 0);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [body.length]);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el || !paged) {
      setPages((prev) => (prev.length ? [] : prev));
      return;
    }
    let frame = 0;

    const measure = () => {
      const page = el.querySelector<HTMLElement>("[data-page]");
      const inner = page?.querySelector<HTMLElement>("[data-inner]");
      const desc = page?.querySelector<HTMLElement>("[data-desc]");
      const copy = el.querySelector<HTMLElement>("[data-measure]");
      if (!page || !inner || !desc || !copy || !page.offsetWidth) return;
      copy.style.width = `${desc.offsetWidth}px`;

      const pageCss = getComputedStyle(page);
      const innerCss = getComputedStyle(inner);
      // Where text must stop on any page: above the inner padding and the closing line.
      const limit =
        page.offsetWidth * A4 -
        parseFloat(pageCss.paddingBottom) -
        parseFloat(innerCss.paddingBottom) -
        parseFloat(innerCss.borderBottomWidth);
      const firstTop = desc.offsetTop; // below the saying, on page 1
      const nextTop = parseFloat(pageCss.paddingTop); // straight from the top on later pages
      const gap = parseFloat(getComputedStyle(copy).rowGap) || 0;
      const lineH = parseFloat(getComputedStyle(copy).fontSize) * 1.4;

      const els = body.map((_, i) => copy.querySelector<HTMLElement>(`[data-mblock="${i}"]`));
      const outer = (e: HTMLElement) => {
        const css = getComputedStyle(e);
        return e.offsetHeight + parseFloat(css.marginTop) + parseFloat(css.marginBottom);
      };

      const out: Seg[][] = [[]];
      let room = limit - firstTop;
      let used = 0;
      const newPage = () => {
        out.push([]);
        room = limit - nextTop;
        used = 0;
      };
      const put = (seg: Seg, h: number) => {
        used += (used ? gap : 0) + h;
        out[out.length - 1].push(seg);
      };

      body.forEach((block, i) => {
        const e = els[i];
        if (!e) return;
        const h = outer(e);
        const free = () => room - used - (used ? gap : 0);

        if (block.type === "p") {
          if (h <= free()) return put({ i, from: 0 }, h);
          const lines = linesOf(e);
          let s0 = 0; // first line still to place
          while (s0 < lines.length) {
            const top = lines[s0].top;
            let n = 0;
            while (s0 + n < lines.length && lines[s0 + n].bottom - top <= free()) n++;
            const left = lines.length - s0 - n;
            // never strand a single line on either side of a page break
            if (left === 1 && n > 1) n--;
            if (n < 2 && left > 0 && used > 0) {
              newPage();
              continue;
            }
            n = Math.max(n, 1);
            const to = s0 + n < lines.length ? lines[s0 + n].start : undefined;
            put({ i, from: s0 ? lines[s0].start : 0, to }, (to === undefined ? e.offsetHeight : lines[s0 + n - 1].bottom) - top);
            s0 += n;
            if (s0 < lines.length) newPage();
          }
          return;
        }

        // A heading needs a couple of lines of what follows it on the same page.
        const keep = block.type === "h" && i + 1 < body.length ? gap + Math.min(els[i + 1] ? outer(els[i + 1]!) : 0, lineH * 2) : 0;
        if (used && h + keep > free()) newPage();
        put({ i, from: 0 }, h);
      });

      setPages((prev) => (sameLayout(prev, out) ? prev : out));
    };

    measure();
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(later);
    ro.observe(el);
    document.fonts?.ready.then(later);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [root, body, paged]);

  return { paged, pages };
}

/**
 * The typed sheet inside the folder. On tablets and desktops it is A4 paper:
 * each page keeps A4 proportions with its closing line at the foot, and
 * longer text carries on onto another A4 page below (with its own holes),
 * breaking between paragraphs. On phones it stays one continuous sheet.
 *
 * Page 1: binder holes, the clipped print and file info, the saying, then the
 * text with a drop cap. Following pages: the text continues.
 */
export default function CaseSheet({ info, quote, body, soon, plate, title, still, stillIsPoster, links }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const { paged, pages: laid } = usePages(root, body);

  // Until it's measured (and always on phones): one page holding everything.
  const pages: Seg[][] = laid.length ? laid : [body.map((_, i) => ({ i, from: 0 }))];
  const total = pages.length;

  return (
    <div ref={root} className={styles.stack} data-sheet>
      {pages.map((segs, p) => (
        <div key={p} className={styles.sheet} data-page>
          {/* Nine punched holes down the binding edge, on every page */}
          <div className={styles.holes} aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} />
            ))}
          </div>

          <div className={styles.inner} data-inner>
            <div className={styles.left}>
              {p === 0 ? (
                <>
                  <figure className={styles.photo}>
                    <Clip at="top" offset="80%" tilt={4} size="1.7rem" />
                    <div className={`${styles.plate} ${still ? styles.hasStill : ""} ${stillIsPoster ? styles.isPoster : ""}`}>
                      {still ? (
                        <Image src={still} alt={stillIsPoster ? `${title} — poster` : title} fill sizes="(min-width: 1025px) 22vw, 80vw" preload />
                      ) : (
                        <span className={styles.plateTitle}>{title}</span>
                      )}
                    </div>
                    <figcaption className={styles.caption}>{plate}</figcaption>
                  </figure>

                  <div className={styles.info}>
                    {info.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </>
              ) : (
                <p className={styles.contHead} aria-hidden="true">
                  {title} — {p + 1} / {total}
                </p>
              )}
            </div>

            <div className={styles.right}>
              {p === 0 && quote && (
                <figure className={styles.quote}>
                  <figcaption className={styles.quoteLabel}>{quote.label}</figcaption>
                  <blockquote>
                    <p>“{quote.text}”</p>
                  </blockquote>
                  <p className={styles.quoteBy}>— {quote.by}</p>
                </figure>
              )}
              {body.length > 0 ? (
                <div className={`${styles.desc} ${p > 0 ? styles.cont : ""}`} data-desc>
                  {segs.map((seg) => (
                    <BodyBlock
                      key={`${seg.i}-${seg.from}`}
                      block={body[seg.i]}
                      index={seg.i}
                      piece={seg.from > 0 || seg.to !== undefined ? seg : undefined}
                    />
                  ))}
                </div>
              ) : (
                <p className={styles.soon}>{soon}</p>
              )}
              {/* Hidden copy of the whole text, to measure where lines break (client only) */}
              {p === 0 && paged && (
                <div className={`${styles.desc} ${styles.measure}`} data-measure aria-hidden="true">
                  {body.map((block, i) => (
                    <BodyBlock key={i} block={block} index={i} measure />
                  ))}
                </div>
              )}
              {links && p === total - 1 && (
                <nav className={styles.links} aria-label={links.label}>
                  {links.items.map((l) => (
                    <Link key={l.href} href={l.href}>
                      {l.label}
                    </Link>
                  ))}
                  {links.settings && <CookieSettingsButton label={links.settings} />}
                </nav>
              )}
            </div>
          </div>

          {total > 1 && (
            <span className={styles.folio} aria-hidden="true">
              {p + 1} / {total}
            </span>
          )}
          <span className={styles.grain} aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
