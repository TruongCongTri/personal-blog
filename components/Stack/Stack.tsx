"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Folder } from "@/lib/content";
import { gsap, prefersReducedMotion, useEntrance } from "@/lib/gsap";
import { scrollToTop } from "@/lib/lenis";
import { clearPending, isBusy, readPending, setBusy, setPending, toRect } from "@/lib/transition";
import { appReady } from "@/lib/ready";
import StackGroup from "@/components/StackGroup/StackGroup";
import styles from "./Stack.module.css";

type Props = {
  locale: Locale;
  folders: Folder[];
  footer: Dictionary["footer"];
  aboutLabel: string;
};

export type HoverState = {
  hovered: boolean;
  unfolded: boolean;
  group: number;
  page: number;
};

const IDLE: HoverState = { hovered: false, unfolded: false, group: -1, page: -1 };
const RESET_PROPS = "transform,opacity,visibility,display,clipPath";
/** Pause between a folder peeking open and the drawer parting to show its blurb. */
const UNFOLD_DELAY = 260;
/** Seconds the drawer holds its lean before the other folders drop away. */
const LEAN_BEAT = 0.35;

/**
 * The drawer: one group per topic, standing on end. Groups further back are
 * taller, so their tabs peek out above the ones in front.
 */
export default function Stack({ locale, folders, footer, aboutLabel }: Props) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const locked = useRef(false);
  const unfoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hover, setHover] = useState<HoverState>(IDLE);

  // ---- Enter: first load, or returning from a folder ----------------------
  useEntrance(
    () => {
      const home = `/${locale}`;
      const pending = readPending(home);
      // A folder is being opened from here: this page is leaving, hands off.
      if (pending === "leaving") return;
      const returning = pending?.type === "close" ? pending.groupIndex : -1;
      setBusy(false);

      // The router may restore this page's previous DOM (React Activity), still
      // carrying inline styles from the leave animation. Start from clean.
      locked.current = false;
      setHover(IDLE);
      // Only clear what the animations touch. (clearProps "all" would also wipe
      // the inline CSS variables that carry each folder's colour and z-order.)
      gsap.set(
        root.current!.querySelectorAll(
          "[data-group-inner], [data-page], [data-page-header], [data-cover-desc], [data-cover-category], [data-site-footer]",
        ),
        { clearProps: RESET_PROPS },
      );
      gsap.set(document.querySelectorAll("[data-hero-title] [data-word], [data-hero-title] [data-char], [data-hero-desc]"), {
        clearProps: RESET_PROPS,
      });
      if (prefersReducedMotion()) return clearPending(home);

      const groups = gsap.utils.toArray<HTMLElement>("[data-group-inner]", root.current);
      const hero = document.querySelector("[data-hero]");

      // ---- First load (or arriving from anywhere but a folder) -------------
      // The drawer rises from below the screen almost as one block, the title
      // letters climb out of a mask line by line, then the blurb fades in.
      // Start states are set now; it plays once the preload gate opens.
      if (returning < 0) {
        const words = hero ? gsap.utils.toArray<HTMLElement>("[data-hero-title] [data-word]", hero) : [];
        // Clip only below each word, so stacked diacritics above stay visible.
        gsap.set(words, { clipPath: "inset(-1em -0.3em 0 -0.3em)" });
        const intro = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
        intro.fromTo(groups, { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.03, clearProps: "transform" }, 0.1);
        if (hero) {
          intro
            .fromTo(
              hero.querySelectorAll("[data-hero-title] [data-char]"),
              { yPercent: 115 },
              { yPercent: 0, duration: 0.9, stagger: 0.025, clearProps: "transform" },
              0.15,
            )
            .fromTo(
              hero.querySelector("[data-hero-desc]"),
              { y: "2rem", opacity: 0 },
              { y: 0, opacity: 1, duration: 0.65, clearProps: "transform,opacity" },
              0.9,
            );
        }
        intro
          .fromTo(
            root.current!.querySelectorAll("[data-cover-desc], [data-cover-category], [data-site-footer]"),
            { opacity: 0 },
            { opacity: 1, duration: 0.45, clearProps: "opacity" },
            0.9,
          )
          .call(() => gsap.set(words, { clearProps: "clipPath" }));
        appReady().then(() => intro.play());
        return;
      }

      // ---- Back from a folder: it has landed in its slot; the rest return --
      const others = groups.filter((_, i) => i !== returning);
      const tl = gsap.timeline({
        defaults: { duration: 0.75, ease: "power2.out" },
        onComplete: () => clearPending(home),
      });
      tl.fromTo(
        others,
        { yPercent: 120 },
        { yPercent: 0, duration: 0.9, stagger: 0.1, ease: "power4.out", clearProps: "transform" },
        0,
      );
      if (hero) {
        tl.fromTo(
          hero.querySelectorAll("[data-hero-title] [data-word]"),
          { y: "2rem", opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.2 },
          0,
        ).fromTo(
          hero.querySelector("[data-hero-desc]"),
          { y: "2rem", opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65 },
          0.4,
        );
      }
      tl.from("[data-cover-desc], [data-site-footer]", { opacity: 0, duration: 0.45 }, 0.9);
      tl.from("[data-cover-category]", { opacity: 0, duration: 0.45 }, 0.4);
    },
    root,
    [locale],
  );

  // Pending "part the drawer" timer for body hovers (see Hover below).
  const cancelUnfold = useCallback(() => {
    if (unfoldTimer.current) clearTimeout(unfoldTimer.current);
    unfoldTimer.current = null;
  }, []);
  useEffect(() => cancelUnfold, [cancelUnfold]);

  // ---- Leave: lift the chosen folder out of the drawer --------------------
  const open = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, g: number, p: number) => {
      // Let modified clicks open a new tab as usual.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if (isBusy()) return;
      setBusy(true);
      locked.current = true;
      cancelUnfold();
      // Like reaching for it: the folders in front lean forward first and stay
      // leaned while the rest of the drawer drops away.
      setHover({ hovered: true, unfolded: false, group: g, page: p });

      const href = e.currentTarget.getAttribute("href")!;
      const groupEls = gsap.utils.toArray<HTMLElement>("[data-group]", root.current);
      const group = groupEls[g];
      const inner = group.querySelector<HTMLElement>("[data-group-inner]")!;

      const go = () => {
        if (window.scrollY > 1) window.scrollTo(0, 0);
        setPending(href, { type: "open", rect: toRect(inner.getBoundingClientRect()), groupIndex: g, leaned: true });
        router.push(href, { scroll: false });
      };

      if (prefersReducedMotion()) return go();

      const others = groupEls.filter((_, i) => i !== g).map((el) => el.querySelector("[data-group-inner]"));
      const pages = gsap.utils.toArray<HTMLElement>("[data-page]", group);
      const otherPages = pages.filter((_, i) => i !== p);
      const otherHeaders = otherPages.map((el) => el.querySelector("[data-page-header]"));

      const tl = gsap.timeline({
        defaults: { duration: 0.75, ease: "power2.out" },
        delay: LEAN_BEAT,
        onStart: () => scrollToTop(tl.duration()),
        onComplete: go,
      });
      tl.to("[data-hero-desc]", { y: "2rem", opacity: 0, duration: 0.45 }, 0.05)
        .to("[data-hero-title] [data-word]", { y: "2rem", opacity: 0, duration: 0.45, stagger: -0.05 }, 0.15)
        .to(others, { yPercent: 120, stagger: 0.1 }, 0)
        .to(group.querySelectorAll("[data-cover-desc], [data-cover-category], [data-site-footer]"), { opacity: 0, duration: 0.15 }, 0);
      if (otherHeaders.length) tl.to(otherHeaders, { yPercent: 110, duration: 0.4 }, 0);
      if (otherPages.length) tl.set(otherPages, { display: "none" });
    },
    [router, cancelUnfold],
  );

  // ---- Hover (mouse only; touch goes straight to the folder) --------------
  //  • On a folder's tab: everything filed in front of it leans forward, so
  //    a folder that only shows its tab can be seen and picked out.
  //  • On a folder's body: the same peek, then — a beat later — the folders
  //    in front sink to uncover this category's description.
  const onPageEnter = useCallback(
    (g: number, p: number) => {
      if (locked.current) return;
      cancelUnfold();
      setHover({ hovered: true, unfolded: false, group: g, page: p });
    },
    [cancelUnfold],
  );
  const onPageLeave = useCallback(() => {
    if (locked.current) return;
    cancelUnfold();
    setHover(IDLE);
  }, [cancelUnfold]);
  const onUnfoldEnter = useCallback(
    (g: number, p: number) => {
      if (locked.current) return;
      cancelUnfold();
      unfoldTimer.current = setTimeout(() => {
        if (!locked.current) setHover({ hovered: true, unfolded: true, group: g, page: p });
      }, UNFOLD_DELAY);
    },
    [cancelUnfold],
  );
  const onUnfoldLeave = useCallback(() => {
    if (locked.current) return;
    cancelUnfold();
    setHover((h) => ({ ...h, unfolded: false }));
  }, [cancelUnfold]);

  return (
    <div className={`container ${styles.wrap}`}>
      <div
        ref={root}
        className={styles.stack}
        style={{ "--n": folders.length } as CSSProperties}
        data-preload
      >
        {folders.map((folder, g) => (
          <StackGroup
            key={folder.slug}
            locale={locale}
            folder={folder}
            index={g}
            count={folders.length}
            hover={hover}
            footer={footer}
            aboutLabel={aboutLabel}
            onOpen={open}
            onPageEnter={onPageEnter}
            onPageLeave={onPageLeave}
            onUnfoldEnter={onUnfoldEnter}
            onUnfoldLeave={onUnfoldLeave}
          />
        ))}
      </div>
    </div>
  );
}
