import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import WindRose from "@/components/WindRose/WindRose";
import styles from "./SiteFooter.module.css";

type Props = { dict: Dictionary["footer"]; locale: Locale; aboutLabel: string };

/** Lives inside the front-most cover of the drawer. */
export default function SiteFooter({ dict, locale, aboutLabel }: Props) {
  return (
    <footer className={styles.footer} data-site-footer>
      <div className={styles.roses}>
        <WindRose variant={0} hideOnMobile />
        <WindRose variant={1} />
        <WindRose variant={2} />
        <WindRose variant={1} />
        <WindRose variant={0} hideOnMobile />
      </div>

      <div className={styles.bottom}>
        <span className={styles.scale}>
          <svg viewBox="0 0 140 14" aria-hidden="true">
            <path d="M0.5 0v14M35 6v8M70 3v11M105 6v8M139.5 0v14M0 13.5h140" stroke="currentColor" fill="none" />
            <rect x="0.5" y="9" width="35" height="4" fill="currentColor" />
            <rect x="70" y="9" width="35" height="4" fill="currentColor" />
          </svg>
          <span>{dict.scale}</span>
        </span>

        <span className={styles.year}>© 2026</span>

        <span className={styles.signature}>
          <Link href={`/${locale}/about`} className={styles.about}>
            {aboutLabel} →
          </Link>
          <span>{dict.signature}</span>
        </span>
      </div>
    </footer>
  );
}
