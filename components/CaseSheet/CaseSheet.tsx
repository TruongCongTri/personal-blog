"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CookieSettingsButton from "@/components/Consent/CookieSettingsButton";
import Clip from "@/components/Clip/Clip";
import type { Block } from "@/lib/schema";
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

/** One block of the review's text: a paragraph, heading, pull quote or clipped image. */
function BodyBlock({ block, index }: { block: Block; index: number }) {
  switch (block.type) {
    case "p":
      return <p data-block={index}>{block.text}</p>;
    case "h":
      return (
        <h2 className={styles.subhead} data-block={index}>
          {block.text}
        </h2>
      );
    case "quote":
      return (
        <blockquote className={styles.pull} data-block={index}>
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
        <figure className={styles.figure} data-block={index}>
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

const sameList = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Where the text has to move on to a new page. Measured from the laid-out
 * blocks (layout sizes, so the folder's flight transforms don't skew it) and
 * re-measured on resize and once the web fonts are in. Breaks fall between
 * blocks, never inside a paragraph. Returns the indices of the blocks that
 * start pages 2, 3, …; empty on phones, where the sheet is one long page.
 */
function usePageBreaks(root: React.RefObject<HTMLDivElement | null>, count: number) {
  const [breaks, setBreaks] = useState<number[]>([]);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const mq = window.matchMedia(PAGED);
    let frame = 0;

    const measure = () => {
      if (!mq.matches || count === 0) {
        setBreaks((prev) => (prev.length ? [] : prev));
        return;
      }
      const page = el.querySelector<HTMLElement>("[data-page]");
      const inner = page?.querySelector<HTMLElement>("[data-inner]");
      const desc = page?.querySelector<HTMLElement>("[data-desc]");
      if (!page || !inner || !desc || !page.offsetWidth) return;

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
      const gap = parseFloat(getComputedStyle(desc).rowGap) || 0;

      const heights: number[] = [];
      el.querySelectorAll<HTMLElement>("[data-block]").forEach((b) => {
        const css = getComputedStyle(b);
        heights[Number(b.dataset.block)] = b.offsetHeight + parseFloat(css.marginTop) + parseFloat(css.marginBottom);
      });

      const next: number[] = [];
      let used = 0;
      let room = limit - firstTop;
      heights.forEach((h, i) => {
        const need = (used ? gap : 0) + h;
        if (used && used + need > room) {
          next.push(i);
          used = h;
          room = limit - nextTop;
        } else {
          used += need;
        }
      });
      setBreaks((prev) => (sameList(prev, next) ? prev : next));
    };

    measure();
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(later);
    ro.observe(el);
    document.fonts?.ready.then(later);
    mq.addEventListener("change", later);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      mq.removeEventListener("change", later);
    };
  }, [root, count]);

  return breaks;
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
  const breaks = usePageBreaks(root, body.length);

  const starts = [0, ...breaks];
  const pages = body.length ? starts.map((s, i) => ({ from: s, blocks: body.slice(s, starts[i + 1] ?? body.length) })) : [{ from: 0, blocks: [] }];
  const total = pages.length;

  return (
    <div ref={root} className={styles.stack} data-sheet>
      {pages.map(({ from, blocks }, p) => (
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
                  {blocks.map((block, i) => (
                    <BodyBlock key={from + i} block={block} index={from + i} />
                  ))}
                </div>
              ) : (
                <p className={styles.soon}>{soon}</p>
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
