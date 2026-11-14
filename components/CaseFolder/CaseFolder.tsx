"use client";

import { useCallback, useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { gsap, prefersReducedMotion, useEntrance } from "@/lib/gsap";
import { scrollToEnd, scrollToTop } from "@/lib/lenis";
import { clearPending, isBusy, readPending, registerClose, setBusy, setPending } from "@/lib/transition";
import { appReady } from "@/lib/ready";
import SplitText from "@/components/SplitText/SplitText";
import CaseSheet from "@/components/CaseSheet/CaseSheet";
import CaseTags, { type CaseTag } from "@/components/CaseTags/CaseTags";
import Scrapbook, { type ScrapFilm, type ScrapLabels } from "@/components/Scrapbook/Scrapbook";
import type { Block, Scrap } from "@/lib/schema";
import NextWidget from "@/components/NextWidget/NextWidget";
import NextFolder from "@/components/NextFolder/NextFolder";
import { useFolderScroll } from "@/lib/useFolderScroll";
import styles from "./CaseFolder.module.css";

type Props = {
  locale: Locale;
  path: string; // this page's own address, e.g. /en/posts/warfare-2025
  title: string;
  color: string; // this file's stock (inside of the folder)
  coverColor: string; // the category's colour in the drawer (its first folder)
  textColor: string; // ink that reads on `color`
  groupIndex: number; // -1 when not filed in the drawer (About)
  groupCount: number; // how many categories the drawer holds
  tags: CaseTag[];
  info: string[];
  quote?: { label: string; text: string; by: string };
  body: Block[];
  /** Shown on the sheet while `body` is empty. */
  soon?: string;
  plate: string;
  /** Image for the clipped print at the top of the sheet. */
  still?: string;
  scrap: { scraps: Scrap[]; labels: ScrapLabels; film?: ScrapFilm; desk?: number };
  next?: {
    href: string;
    title: string;
    category: string;
    color: string;
    textColor: string;
    label: string;
    keep: string; // button text at the bottom of the page
    sameGroup: boolean; // next file belongs to the same director
  };
};

// Everything the transitions set inline. Never clear "all": that would also
// wipe the inline CSS variables React uses for each tab's colours.
const RESET_PROPS = "transform,transformOrigin,opacity,visibility,width,height,position,left,top,zIndex,overflow,flexShrink,backgroundColor,margin";
const DUR = 1.5;
const EASE = "power3.inOut";

/** Per-letter delay, capped so long titles still finish inside `cap` seconds. */
const each = (count: number, per: number, cap: number) => Math.min(per, cap / Math.max(count, 1));

/**
 * The open folder. Enter/leave transitions:
 *  - open:  lifted from the drawer — turned upright → flat, cover swings open
 *  - close: the reverse, landing exactly where it came from in the drawer
 *  - turn:  sibling tab — the cover closes and reopens on the new file
 *  - next:  the folder drops away and the next one slides up from below
 */
export default function CaseFolder(props: Props) {
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const q = useCallback(<T extends Element = HTMLElement>(sel: string) => root.current!.querySelector<T>(sel)!, []);
  // Always scoped to this page: the router can keep other pages mounted but hidden.
  const qa = useCallback((sel: string) => Array.from(root.current!.querySelectorAll<HTMLElement>(sel)), []);

  // While the folder changes shape in flight, its contents must not reflow:
  // the sheet keeps its own width (so every line of text sits still on the
  // paper) and stays pinned to the tab edge, where the folder simply crops it.
  const freezeContents = useCallback(() => {
    const sheet = q("[data-sheet]");
    const scrapbook = q("[data-scrapbook]");
    gsap.set(sheet, { width: sheet.offsetWidth, flexShrink: 0 });
    gsap.set(scrapbook, { width: scrapbook.offsetWidth });
  }, [q]);

  // ---- Enter --------------------------------------------------------------
  useEntrance(
    () => {
      const pending = readPending(props.path);
      // Navigating away to another page: this one is leaving, hands off.
      if (pending === "leaving") return;

      // A restored page (React Activity) may still hold its leave styles.
      gsap.set(
        root.current!.querySelectorAll(
          "[data-case-folder], [data-case-inner], [data-sheet-wrap], [data-folder-inner], [data-sheet], [data-cover], [data-cover-front], [data-cover-front-shadow], [data-cover-shadow], [data-case-title] [data-char], [data-scrap], [data-scrapbook], [data-next-widget], [data-next-folder], [data-next-folder] > *, [data-case-title], [data-case-tag] [data-tag]",
        ),
        { clearProps: RESET_PROPS },
      );
      if (prefersReducedMotion()) {
        setBusy(false);
        clearPending(props.path);
        return;
      }
      const folder = q("[data-case-folder]");
      const cover = q("[data-cover]");
      const frontShadow = q("[data-cover-front-shadow]");
      const coverShadow = q("[data-cover-shadow]");
      const chars = qa("[data-case-title] [data-char]");
      const scraps = qa("[data-scrap]");
      const otherTags = qa("[data-case-tag='other'] [data-tag]");
      const done = () => {
        setBusy(false);
        clearPending(props.path);
      };

      if (pending?.type === "open") {
        const S = pending.rect;
        const inner = q("[data-case-inner]");
        const F = folder.getBoundingClientRect();

        // Freeze surrounding layout + the sheet's size while the box morphs.
        gsap.set(inner, { height: inner.offsetHeight });
        freezeContents();
        gsap.set(q("[data-folder-inner]"), { overflow: "hidden" });

        // Start: standing upright exactly where it was in the drawer.
        // rotate(-90deg) about the top-left corner maps width→height, so the
        // tabs on the right edge end up on top, as in the stack.
        gsap.set(folder, {
          transformOrigin: "0 0",
          x: S.left - F.left,
          y: S.top + S.height - F.top,
          rotation: -90,
          width: S.height,
          height: S.width,
        });

        const tl = gsap.timeline({
          defaults: { duration: DUR, ease: EASE },
          onComplete: () => {
            gsap.set([folder, inner, q("[data-folder-inner]"), q("[data-sheet]"), q("[data-scrapbook]")], {
              clearProps: RESET_PROPS,
            });
            done();
          },
        });
        // If it was lifted from a leaning drawer, the cover starts slightly
        // ajar, exactly as it was leaning, and settles flush as it opens.
        const lean = pending.leaned ? { rotateY: -3, x: "-1rem" } : { rotateY: 0, x: 0 };
        tl.to(folder, { x: 0, y: 0, rotation: 0, width: F.width, height: F.height }, 0)
          .fromTo(cover, { rotateY: lean.rotateY }, { rotateY: -180 }, 0)
          .fromTo(cover, { x: lean.x }, { x: 0, duration: 0.5 }, 0)
          .from(
            chars,
            { xPercent: -150, opacity: 0, duration: 0.65, stagger: each(chars.length, 0.025, 0.4), ease: "power2.out" },
            0.65,
          )
          .to(coverShadow, { opacity: 1, duration: 0.35 }, 0.25)
          .to(coverShadow, { opacity: 0, duration: 0.3 }, 0.6)
          .fromTo(frontShadow, { opacity: 1 }, { opacity: 0, duration: 0.5 }, 0)
          .fromTo(
            q("[data-cover-front]"),
            { backgroundColor: props.coverColor },
            { backgroundColor: props.color, duration: 0.35, ease: "none", clearProps: "backgroundColor" },
            0,
          )
          .from(otherTags, { yPercent: 110, duration: 0.75, ease: "power3.out", clearProps: "transform" }, 0.85)
          .from(scraps, { y: "50vh", opacity: 0, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" }, 1);
        return;
      }

      // "advance": the reader scrolled on from the end of the previous folder.
      // That page slid this folder's colour block up to `top`; this folder
      // starts there, closed, settles the last few pixels and unfolds.
      if (pending?.type === "advance") {
        const rest = folder.getBoundingClientRect().top;
        gsap
          .timeline({ defaults: { ease: "power3.inOut" }, onComplete: done })
          .fromTo(folder, { y: pending.top - rest }, { y: 0, duration: 0.6, ease: "power2.out", clearProps: "transform" }, 0)
          .fromTo(cover, { rotateY: 0 }, { rotateY: -180, duration: 0.9 }, 0)
          .fromTo(frontShadow, { opacity: 1 }, { opacity: 0, duration: 0.6 }, 0)
          .from(
            chars,
            { xPercent: -100, opacity: 0, duration: 0.65, stagger: each(chars.length, 0.025, 0.4), ease: "power2.out" },
            0.15,
          )
          .from(
            qa("[data-case-tag] [data-tag]"),
            { yPercent: 110, duration: 0.6, ease: "power3.out", stagger: 0.05, clearProps: "transform" },
            0.35,
          )
          .from(scraps, { y: "50vh", opacity: 0, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" }, 0.65)
          .from(qa("[data-next-folder]"), { opacity: 0, duration: 0.5, ease: "none", clearProps: "opacity" }, 0.65);
        return;
      }

      // "turn": arriving from another folder that was just folded shut — the
      // cover swings open in place on this file.
      if (pending?.type === "turn") {
        const front = q("[data-cover-front]");
        const tl = gsap
          .timeline({ defaults: { duration: 0.75, ease: "power3.in" }, onComplete: done })
          .from(
            chars,
            { xPercent: 150, opacity: 0, duration: 0.5, stagger: -each(chars.length, 0.025, 0.4), ease: "power2.out" },
            0.2,
          )
          .fromTo(cover, { rotateY: 0 }, { rotateY: -180 }, 0)
          .fromTo(frontShadow, { opacity: 1 }, { opacity: 0 }, 0)
          .from(scraps, { y: "50vh", opacity: 0, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" }, 0.55)
          .from(qa("[data-next-widget]"), { opacity: 0, duration: 0.4, ease: "none", clearProps: "opacity" }, 0.55);
        // The closed cover blends from the previous folder's colour to this one's.
        if (pending.fromCover && pending.fromCover !== props.color) {
          tl.fromTo(
            front,
            { backgroundColor: pending.fromCover },
            { backgroundColor: props.color, duration: 0.3, ease: "none", clearProps: "backgroundColor" },
            0,
          );
        }
        // A different director: this folder's own tabs slide out from under it.
        if (pending.sameGroup === false) {
          tl.from(
            qa("[data-case-tag] [data-tag]"),
            { yPercent: 110, duration: 0.6, ease: "power3.out", stagger: 0.05, clearProps: "transform" },
            0.35,
          );
        }
        return;
      }

      // "next", a direct visit (preload) or arriving from another page: the
      // open folder rises up from below the screen while the title slides in.
      // Start states are set now; a first load plays once the preload gate opens.
      const top = folder.getBoundingClientRect().top;
      const rise = gsap
        .timeline({ paused: true, defaults: { ease: "power3.out" }, onComplete: done })
        .from(chars, { xPercent: -100, opacity: 0, duration: 0.65, stagger: each(chars.length, 0.025, 0.4) }, 0)
        .from(folder, { y: window.innerHeight - top, duration: 1, clearProps: "transform" }, 0)
        .from(q("[data-sheet]"), { y: "10rem", duration: 1, clearProps: "transform" }, 0.1)
        .from(qa("[data-next-folder]"), { opacity: 0, duration: 0.6, ease: "none", clearProps: "opacity" }, 0.6);
      appReady().then(() => rise.play());
    },
    root,
    [props.path],
  );

  // ---- Leave: close back into the drawer ----------------------------------
  const close = useCallback(() => {
    if (isBusy()) return;
    const home = `/${props.locale}`;
    const go = () => {
      setPending(home, { type: "close", groupIndex: props.groupIndex });
      router.push(home, { scroll: false });
    };
    setBusy(true);
    if (prefersReducedMotion()) return go();

    const folder = q("[data-case-folder]");
    const chars = qa("[data-case-title] [data-char]");

    // Not filed in the drawer (About): the folder simply drops off the desk.
    if (props.groupIndex < 0) {
      scrollToTop(0.65);
      gsap
        .timeline({ defaults: { duration: 0.65, ease: "power3.out" }, onComplete: go })
        .to(chars, { xPercent: -100, opacity: 0, stagger: each(chars.length, 0.025, 0.3) }, 0)
        .to(qa("[data-scrap]"), { y: "50vh", duration: 0.25, ease: "power2.in" }, 0)
        .to(folder, { y: () => window.innerHeight - folder.getBoundingClientRect().top, ease: "power3.in" }, 0.1);
      return;
    }

    const inner = q("[data-case-inner]");
    const cover = q("[data-cover]");
    const frontShadow = q("[data-cover-front-shadow]");
    // Exactly where this folder stands in the drawer on the home page.
    const T = q("[data-probe]").getBoundingClientRect();

    // The loose items fall away first, then the folder is lifted off the page.
    gsap.to(qa("[data-scrap]"), {
      y: "50vh",
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        const F = folder.getBoundingClientRect();
        gsap.set(inner, { height: inner.offsetHeight });
        freezeContents();
        gsap.set(q("[data-folder-inner]"), { overflow: "hidden" });
        gsap.set(folder, {
          position: "fixed",
          left: F.left,
          top: F.top,
          width: F.width,
          height: F.height,
          zIndex: 60,
          transformOrigin: "0 0",
        });
        scrollToTop(DUR);

        // Everything fits inside DUR, so the drawer appears the moment the
        // folder lands. Its tabs stay on: they line up with the drawer's row.
        gsap
          .timeline({ defaults: { duration: DUR, ease: EASE }, onComplete: go })
          .to(folder, { x: T.left - F.left, y: T.top + T.height - F.top, rotation: -90, width: T.height, height: T.width }, 0)
          .to(cover, { rotateY: 0 }, 0)
          .to(
            chars,
            { xPercent: -150, opacity: 0, duration: 1.15, stagger: each(chars.length, 0.035, 0.35), ease: "power2.inOut" },
            0,
          )
          .to(frontShadow, { opacity: 1, duration: 1 }, 0)
          .to(frontShadow, { opacity: 0, duration: 0.4 }, 1)
          .to(q("[data-cover-front]"), { backgroundColor: props.coverColor, duration: 0.4, ease: "none" }, DUR - 0.4)
          .to(qa("[data-scrapbook], [data-next-widget], [data-next-folder]"), { opacity: 0, duration: 0.75 }, 0);
      },
    });
  }, [props.locale, props.groupIndex, props.coverColor, q, qa, router, freezeContents]);

  useEffect(() => {
    registerClose(close);
    return () => registerClose(null);
  }, [close]);

  // ---- Leave: to another folder (a tab here, or "Next") --------------------
  // The current folder is folded shut first; the next page then opens it again
  // on the new file. `sameGroup` = a sibling tab of the same director.
  const goFold = useCallback(
    (href: string, sameGroup: boolean) => {
      if (isBusy()) return;
      setBusy(true);
      const go = () => {
        setPending(href, { type: "turn", fromCover: props.color, sameGroup });
        window.scrollTo(0, 0);
        router.push(href, { scroll: false });
      };
      if (prefersReducedMotion()) return go();

      const chars = qa("[data-case-title] [data-char]");
      // From far down the page, travel back up first so the fold is seen.
      const lead = window.scrollY > 200 ? 0.6 : 0;
      scrollToTop(lead || 0.75);
      const tl = gsap
        .timeline({ defaults: { duration: 0.75, ease: "power3.out" }, delay: lead, onComplete: go })
        .to(qa("[data-scrap]"), { y: "50vh", duration: 0.25, ease: "power2.in" }, 0)
        .to(chars, { xPercent: 150, opacity: 0, duration: 0.5, stagger: each(chars.length, 0.02, 0.3) }, 0.15)
        .fromTo(q("[data-cover]"), { rotateY: -180 }, { rotateY: 0 }, 0.15)
        .fromTo(q("[data-cover-front-shadow]"), { opacity: 0 }, { opacity: 1 }, 0.15)
        .to(qa("[data-next-widget]"), { opacity: 0, duration: 0.3 }, 0);
      // Another director's folder has a different set of tabs: tuck these away.
      if (!sameGroup) tl.to(qa("[data-case-tag] [data-tag]"), { yPercent: 110, duration: 0.4 }, 0.15);
    },
    [props.color, q, qa, router],
  );
  const foldTo = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, href: string, sameGroup: boolean) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      goFold(href, sameGroup);
    },
    [goFold],
  );
  const turn = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, href: string) => foldTo(e, href, true),
    [foldTo],
  );

  // ---- Leave: on to the next folder (Next, its block, or scrolling past the end)
  // One continuous upward motion, never a jump back to the top: this folder
  // slides up and away while the next folder's colour block at the end of the
  // page rises into the reading position. The next page takes over from there
  // and unfolds it.
  const advance = useCallback(
    async (href: string) => {
      if (isBusy()) return;
      setBusy(true);
      const block = root.current?.querySelector<HTMLElement>("[data-next-folder]");
      const folder = q("[data-case-folder]");
      // Where a folder's top edge rests on a page scrolled to the top.
      const restTop = folder.getBoundingClientRect().top + window.scrollY;
      const go = (top: number) => {
        setPending(href, { type: "advance", top });
        window.scrollTo(0, 0);
        router.push(href, { scroll: false });
      };
      if (prefersReducedMotion() || !block) return go(restTop);

      // Clicked "Next" part-way down: travel to the end first, like scrolling on.
      await scrollToEnd(0.9);

      const inner = q("[data-case-inner]");
      const from = block.getBoundingClientRect();
      gsap
        .timeline({
          defaults: { duration: 0.75, ease: "power3.inOut" },
          onComplete: () => {
            // Pin the block where it is and hide the rest, so nothing shows
            // through while the page scrolls back to the top underneath.
            const at = block.getBoundingClientRect();
            gsap.set(block, {
              position: "fixed",
              left: at.left,
              top: at.top,
              width: at.width,
              height: at.height,
              margin: 0,
              zIndex: 40,
              y: 0,
            });
            gsap.set([inner, q("[data-case-title]")], { visibility: "hidden" });
            go(at.top);
          },
        })
        .to(inner, { y: -(inner.getBoundingClientRect().bottom + 40), ease: "power2.in" }, 0)
        .to(block, { y: restTop - from.top, height: "100vh" }, 0)
        .to(Array.from(block.children), { opacity: 0, duration: 0.3, ease: "none" }, 0)
        .to(qa("[data-next-widget]"), { opacity: 0, duration: 0.3, ease: "none" }, 0);
    },
    [q, qa, router],
  );
  const next = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      advance(href);
    },
    [advance],
  );

  // Header title swap, next card/button states, and "keep scrolling" at the end.
  const nextHref = props.next?.href;
  const nextState = useFolderScroll(
    root,
    props.title,
    nextHref ? () => advance(nextHref) : undefined,
  );

  const style = {
    "--case-color": props.color,
    "--case-ink": props.textColor,
    "--n": props.groupCount,
    "--gi": Math.max(props.groupIndex, 0),
  } as CSSProperties;

  return (
    <article ref={root} className={styles.page} style={style}>
      {/* Invisible stand-in for this folder's slot in the drawer on the home page. */}
      <span className={styles.probe} data-probe aria-hidden="true" />

      <header className={`container ${styles.hero}`}>
        <h1 className={`heading-2 ${styles.title}`} data-case-title data-preload>
          <SplitText text={props.title} />
        </h1>
      </header>

      <section className={`container ${styles.content}`} data-case-content>
        <div className={styles.inner} data-case-inner>
          <div className={styles.folder} data-case-folder data-preload>
            <div className={styles.folderInner} data-folder-inner>
              <div className={styles.sheetWrap} data-sheet-wrap>
                <CaseSheet info={props.info} quote={props.quote} body={props.body} soon={props.soon} plate={props.plate} title={props.title} still={props.still} />
              </div>
              {/* Loose items lie on the folder itself, below and over the sheet. */}
              <Scrapbook {...props.scrap} />
            </div>

            <div className={styles.cover} data-cover aria-hidden="true">
              <div className={styles.front} data-cover-front>
                <span className={styles.frontShadow} data-cover-front-shadow />
              </div>
              <div className={styles.back} />
            </div>
            <span className={styles.coverShadow} data-cover-shadow aria-hidden="true" />

            {props.tags.length > 0 && <CaseTags tags={props.tags} onSelect={turn} />}
          </div>
        </div>

        {props.next && (
          <>
            {/* The next folder peeks up at the end of the page */}
            <NextFolder
              href={props.next.href}
              title={props.next.title}
              category={props.next.category}
              color={props.next.color}
              textColor={props.next.textColor}
              onNext={next}
            />
            <NextWidget
              href={props.next.href}
              title={props.next.title}
              category={props.next.category}
              color={props.next.color}
              textColor={props.next.textColor}
              label={props.next.label}
              keepLabel={props.next.keep}
              state={nextState}
              onNext={next}
            />
          </>
        )}
      </section>
    </article>
  );
}
