import type { CSSProperties } from "react";
import styles from "./Tag.module.css";

type Props = {
  label: string;
  color: string; // text
  bg: string; // folder stock
  visible: boolean;
};

/**
 * Shoulder of a folder tab (right side; mirrored for the left), 62×44 —
 * the same 1.409 ratio as the tab height. Rounded top corner, a straight
 * slope, then a flared foot that blends into the folder's top edge.
 */
function Shoulder({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 62 44" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 0H1C11 0 20.3 4.9 25.9 13.1L38.5 31.6C43.8 39.4 52.6 44 62 44H0Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * A folder tab. Every page renders the full row of tabs for its group but only
 * shows its own, so tabs sit side by side exactly like a real file drawer.
 */
export default function Tag({ label, color, bg, visible }: Props) {
  return (
    <span
      className={`${styles.tag} ${visible ? styles.visible : ""}`}
      style={{ "--color": color, "--bg-color": bg } as CSSProperties}
      aria-hidden={!visible}
      data-tag={visible ? "visible" : "hidden"}
    >
      <Shoulder className={`${styles.side} ${styles.start}`} />
      <span className={styles.middle}>
        <span>{label}</span>
      </span>
      <Shoulder className={`${styles.side} ${styles.end}`} />
    </span>
  );
}
