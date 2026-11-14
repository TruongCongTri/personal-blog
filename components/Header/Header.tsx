"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import LocaleSwitcher from "@/components/LocaleSwitcher/LocaleSwitcher";
import { getFolderHeader, getServerFolderHeader, subscribeFolderHeader } from "@/lib/folderHeader";
import { prefersReducedMotion } from "@/lib/gsap";
import { scrollToTop } from "@/lib/lenis";
import { requestClose } from "@/lib/transition";
import styles from "./Header.module.css";

type Props = { locale: Locale; dict: Dictionary["nav"] };

/** Time the header takes to slide out before its contents are swapped (ms). */
const SWAP_OUT = 330;

/**
 * Fixed, blurred top bar with two faces:
 *  - site:   the site name, centred (home, and the top of a folder page);
 *  - folder: the open folder's title, once the reader scrolls past the title
 *            into the folder's content. The bar slides away, swaps, slides back.
 * On the home page it also hides while scrolling down. Inside a folder it never
 * hides; it carries the close button back to the drawer.
 */
export default function Header({ locale, dict }: Props) {
  const pathname = usePathname() ?? "";
  const bar = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);
  const inFolder = /\/(posts|about)(\/|$)/.test(pathname);
  const folder = useSyncExternalStore(subscribeFolderHeader, getFolderHeader, getServerFolderHeader);
  const face = inFolder && folder.active ? "folder" : "site";

  // Home only: hide while scrolling down, return on scroll up.
  useEffect(() => {
    if (inFolder) return;
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - last) > 6) {
          setHidden(y > last && y > 80);
          last = y;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [inFolder]);

  // Swap faces: slide out, change what is shown, slide back in. The face lives
  // in a data attribute so the swap happens while the bar is off screen.
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const current = el.dataset.face ?? "site";
    if (current === face) {
      delete el.dataset.swap;
      return;
    }
    if (prefersReducedMotion()) {
      el.dataset.face = face;
      return;
    }
    el.dataset.swap = "out";
    const timer = setTimeout(() => {
      el.dataset.face = face;
      delete el.dataset.swap;
    }, SWAP_OUT);
    return () => clearTimeout(timer);
  }, [face]);

  // Both the X and the site name close the open folder back into the drawer
  // (animated) instead of jumping straight home.
  const closeFolder = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!inFolder || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (requestClose()) e.preventDefault();
  };

  return (
    <header ref={bar} className={`${styles.header} ${hidden && !inFolder ? styles.hidden : ""}`} data-site-header>
      <div className={`container ${styles.content}`}>
        {inFolder && (
          <Link href={`/${locale}`} className={styles.close} aria-label={dict.close} onClick={closeFolder} data-cursor="close">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
        )}

        <Link href={`/${locale}`} className={styles.logo} onClick={closeFolder}>
          {dict.logo}
        </Link>

        {/* Folder face: the open folder's title; tapping it returns to the top. */}
        <button type="button" className={styles.folderTitle} onClick={() => scrollToTop(0.8)}>
          {folder.title}
        </button>

        <nav className={styles.nav} aria-label="Primary">
          <Link
            href={`/${locale}/about`}
            className={styles.item}
            aria-current={pathname.endsWith("/about") ? "page" : undefined}
          >
            {dict.about}
          </Link>
          <LocaleSwitcher locale={locale} label={dict.language} />
        </nav>
      </div>
    </header>
  );
}
