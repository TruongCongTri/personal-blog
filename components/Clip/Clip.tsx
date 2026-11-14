import type { CSSProperties } from "react";
import styles from "./Clip.module.css";

export type ClipEdge =
  "top" | "right" | "bottom" | "left" | "corner" | "corner-right";
export type ClipTone = "silver" | "brass" | "red" | "blue" | "black";

type Props = {
  /** paper: a wire paperclip; binder: a black bulldog clip for thicker things. */
  kind?: "paper" | "binder";
  /** Which edge of the object it grips. Corners grip diagonally. */
  at: ClipEdge;
  /** Where along that edge (any CSS length/percentage). */
  offset?: string;
  /** A few degrees off square, so no two clips look placed by a machine. */
  tilt?: number;
  tone?: ClipTone;
  /** Clip width (CSS length). */
  size?: string;
};

// Gem clip, drawn with the open end pointing down into the object. The paper
// edge crosses the drawing at y = 24 of 64: the short inner loop lies on top
// of the paper, the long outer loop goes behind it.
const GEM_FULL =
  "M9 14v34a6 6 0 0 0 12 0V10a9 9 0 0 0-18 0v40a11 11 0 0 0 22 0V20";
const GEM_FRONT = "M9 14v34a6 6 0 0 0 12 0V10a9 9 0 0 0-18 0";

function Wire({ d }: { d: string }) {
  return (
    <>
      <path d={d} className={styles.wire} />
      <path d={d} className={styles.shine} transform="translate(-0.45 -0.45)" />
    </>
  );
}

/**
 * A clip holding an object to the folder. Place it as a direct child of the
 * object, next to the object's paper (which needs `position: relative;
 * z-index: 1`). It renders as two layers so it can wrap the edge: one behind
 * the paper and one in front.
 */
export default function Clip({
  kind = "paper",
  at,
  offset,
  tilt = 0,
  tone = kind === "binder" ? "black" : "silver",
  size,
}: Props) {
  const style = {
    "--offset": offset,
    "--tilt": `${tilt}deg`,
    "--w": size,
  } as CSSProperties;
  const cls = `${styles.clip} ${styles[kind]} ${styles[at.replace("-", "_")]} ${styles[tone]}`;

  if (kind === "binder") {
    // A bulldog clip sits wholly in front; its back plate is hidden by the paper.
    return (
      <svg
        className={`${cls} ${styles.front}`}
        style={style}
        viewBox="0 0 40 56"
        aria-hidden="true"
      >
        <path
          d="M11 23V7.5Q11 3 15.5 3h9Q29 3 29 7.5V23"
          className={styles.wire}
        />
        <path
          d="M11 23V7.5Q11 3 15.5 3h9Q29 3 29 7.5V23"
          className={styles.shine}
          transform="translate(-0.45 -0.45)"
        />
        <path d="M14 23V10q0-3 3-3h6q3 0 3 3v13" className={styles.wire} />
        <path
          d="M4 20h32l-2.6 23.5a2 2 0 0 1-2 1.5H8.6a2 2 0 0 1-2-1.5z"
          className={styles.body}
        />
        <path d="M5.5 21.5h29" className={styles.rim} />
        <path d="M8 40h24" className={styles.rim} opacity=".4" />
      </svg>
    );
  }

  return (
    <>
      <svg
        className={`${cls} ${styles.back}`}
        style={style}
        viewBox="0 0 26 64"
        aria-hidden="true"
      >
        <Wire d={GEM_FULL} />
      </svg>
      <svg
        className={`${cls} ${styles.front}`}
        style={style}
        viewBox="0 0 26 64"
        aria-hidden="true"
      >
        <Wire d={GEM_FRONT} />
      </svg>
    </>
  );
}
