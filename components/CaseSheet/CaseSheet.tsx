import styles from "./CaseSheet.module.css";

type Props = {
  info: string[];
  /** The saying this film is tested against. */
  quote?: { label: string; text: string; by: string };
  body: string[];
  plate: string;
  title: string;
};

/** Paperclip drawn in SVG. */
export function Paperclip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 64" aria-hidden="true">
      <path
        d="M8 14v34a6 6 0 0 0 12 0V10a9 9 0 0 0-18 0v40a11 11 0 0 0 22 0V20"
        fill="none"
        stroke="#9aa0a6"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The typed sheet inside the folder: binder holes on the left, a clipped
 * "plate" and file info, then the text with a drop cap.
 */
export default function CaseSheet({ info, quote, body, plate, title }: Props) {
  return (
    <div className={styles.sheet} data-sheet>
      <div className={styles.clip} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className={styles.inner}>
        <div className={styles.left}>
          <figure className={styles.photo}>
            <Paperclip className={styles.paperclip} />
            <div className={styles.plate}>
              <span className={styles.plateTitle}>{title}</span>
            </div>
            <figcaption className={styles.caption}>{plate}</figcaption>
          </figure>

          <div className={styles.info}>
            {info.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          {quote && (
            <figure className={styles.quote}>
              <figcaption className={styles.quoteLabel}>{quote.label}</figcaption>
              <blockquote>
                <p>“{quote.text}”</p>
              </blockquote>
              <p className={styles.quoteBy}>— {quote.by}</p>
            </figure>
          )}
          <div className={styles.desc}>
            {body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>

      <span className={styles.grain} aria-hidden="true" />
    </div>
  );
}
