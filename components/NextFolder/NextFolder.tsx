import type { CSSProperties, MouseEvent } from "react";
import Link from "next/link";
import styles from "./NextFolder.module.css";

type Props = {
  href: string;
  title: string;
  category: string;
  color: string;
  textColor: string;
  onNext: (e: MouseEvent<HTMLAnchorElement>, href: string) => void;
};

/**
 * The top of the next folder, peeking up at the end of the page in its own
 * colour. Keep scrolling (or tap it) to go there.
 */
export default function NextFolder({ href, title, category, color, textColor, onNext }: Props) {
  return (
    <Link
      href={href}
      className={styles.next}
      style={{ "--bg": color, "--fg": textColor } as CSSProperties}
      onClick={(e) => onNext(e, href)}
      data-next-folder
    >
      <span className={styles.category}>{category}</span>
      <span className={`heading-2 ${styles.title}`}>{title}</span>
    </Link>
  );
}
