import { Fragment } from "react";
import styles from "./SplitText.module.css";

type Props = {
  text: string;
  /** Split into "chars" (inside unbreakable words) or just "lines" (words). */
  by?: "chars" | "words";
  className?: string;
};

// Grapheme-aware split so Vietnamese diacritics stay attached to their letter.
const graphemes = (word: string) => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(word), (s) => s.segment);
  }
  return Array.from(word);
};

/**
 * Renders text as animatable spans: `.word > .char`. Screen readers get the
 * plain string through aria-label on the parent and aria-hidden spans.
 */
export default function SplitText({ text, by = "chars", className }: Props) {
  const words = text.normalize("NFC").split(/\s+/).filter(Boolean);
  return (
    <span className={`${styles.split} ${className ?? ""}`} aria-label={text} role="text">
      {words.map((word, w) => (
        // The space lives between the inline-blocks (inside one it collapses).
        <Fragment key={w}>
          {w > 0 && " "}
          <span className={styles.word} data-word aria-hidden="true">
            {by === "chars"
              ? graphemes(word).map((c, i) => (
                  <span key={i} className={styles.char} data-char>
                    {c}
                  </span>
                ))
              : word}
          </span>
        </Fragment>
      ))}
    </span>
  );
}
