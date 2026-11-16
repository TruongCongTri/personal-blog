import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import FilmIcons from "@/components/FilmIcons/FilmIcons";
import CookieSettingsButton from "@/components/Consent/CookieSettingsButton";
import styles from "./SiteFooter.module.css";

type Props = { dict: Dictionary["footer"]; locale: Locale; aboutLabel: string };

/** Lives inside the front-most cover of the drawer. */
export default function SiteFooter({ dict, locale, aboutLabel }: Props) {
  return (
    <footer className={styles.footer} data-site-footer>
      <FilmIcons />

      <nav className={styles.legal} aria-label={dict.privacy}>
        <Link href={`/${locale}/legal/privacy`}>{dict.privacy}</Link>
        <Link href={`/${locale}/legal/cookies`}>{dict.cookies}</Link>
        <Link href={`/${locale}/legal/terms`}>{dict.terms}</Link>
        <CookieSettingsButton label={dict.settings} />
      </nav>

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
          <span className={styles.credit}>
            {dict.createdBy}{" "}
            <a href="https://truong-cong-tri-portfolio.vercel.app/en" target="_blank" rel="noopener noreferrer">
              Công Trí ↗
            </a>
          </span>
        </span>
      </div>
    </footer>
  );
}
