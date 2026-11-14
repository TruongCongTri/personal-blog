import type { CSSProperties, MouseEvent } from "react";
import Link from "next/link";
import type { NextState } from "@/lib/useFolderScroll";
import styles from "./NextWidget.module.css";

type Props = {
  href: string;
  title: string;
  category: string;
  color: string;
  textColor: string;
  label: string;
  /** Shown in the button at the bottom of the page. */
  keepLabel: string;
  state: NextState;
  onNext: (e: MouseEvent<HTMLAnchorElement>, href: string) => void;
};

/**
 * Fixed bottom-right: a card naming the next folder, and the Next button.
 *  - hidden: both wait below the screen;
 *  - shown:  the button rises first, then the card grows out from behind it;
 *  - merge:  at the bottom the card folds back into the button, which widens,
 *            reads "keep scrolling…" and fills up with the scroll progress
 *            (the --progress variable, written by useFolderScroll).
 */
export default function NextWidget({ href, title, category, color, textColor, label, keepLabel, state, onNext }: Props) {
  const idle = state === "hidden";
  return (
    <aside
      className={styles.widget}
      style={{ "--bg": color, "--fg": textColor } as CSSProperties}
      data-state={state}
      data-next-widget
      aria-hidden={idle}
    >
      <Link href={href} className={styles.card} onClick={(e) => onNext(e, href)} tabIndex={-1} aria-hidden="true">
        <span className={styles.name}>{title}</span>
        <span className={styles.category}>{category}</span>
      </Link>

      <Link href={href} className={styles.button} onClick={(e) => onNext(e, href)} tabIndex={idle ? -1 : 0}>
        <span className={styles.fill} aria-hidden="true" />
        <span className={styles.next}>
          {label}
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </span>
        <span className={styles.keep} aria-hidden={state !== "merge"}>
          {keepLabel}
        </span>
        <span className="sr-only">{title}</span>
      </Link>
    </aside>
  );
}
