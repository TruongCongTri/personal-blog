import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import SiteFooter from "@/components/SiteFooter/SiteFooter";
import styles from "./StackCover.module.css";

type Props = {
  category: string;
  desc: string;
  isLast: boolean;
  hovered: boolean;
  rotated: boolean;
  unfolded: boolean;
  footer: Dictionary["footer"];
  locale: Locale;
  aboutLabel: string;
};

/** Front cover of a group: topic name + blurb; the front-most one holds the footer. */
export default function StackCover(props: Props) {
  const cls = [
    styles.cover,
    props.hovered && styles.hovered,
    props.rotated && styles.rotated,
    props.unfolded && styles.unfolded,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls}>
      <div className={`caption ${styles.desc}`} data-cover-desc>
        <p>{props.desc}</p>
      </div>
      <div className={`caption ${styles.category}`} data-cover-category>
        <span>{props.category}</span>
        <svg className={styles.arrow} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
      {props.isLast && (
        <div className={styles.footer}>
          <SiteFooter dict={props.footer} locale={props.locale} aboutLabel={props.aboutLabel} />
        </div>
      )}
    </div>
  );
}
