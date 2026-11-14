import Image from "next/image";
import Clip from "@/components/Clip/Clip";
import type { Block } from "@/lib/schema";
import styles from "./CaseSheet.module.css";

type Props = {
  info: string[];
  /** The saying this film is tested against. */
  quote?: { label: string; text: string; by: string };
  body: Block[];
  /** Shown while the analysis hasn't been written (empty body). */
  soon?: string;
  plate: string;
  title: string;
  still?: string;
};

/** One block of the review's text: a paragraph, heading, pull quote or clipped image. */
function BodyBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "h":
      return <h2 className={styles.subhead}>{block.text}</h2>;
    case "quote":
      return (
        <blockquote className={styles.pull}>
          <p>“{block.text}”</p>
          {block.by && <cite>— {block.by}</cite>}
        </blockquote>
      );
    case "image": {
      const clip =
        block.clip === false
          ? null
          : { tilt: -4, ...block.clip, at: block.clip?.at ?? "top", offset: block.clip?.offset ?? (block.clip?.at ? undefined : "18%") };
      return (
        <figure className={styles.figure}>
          {clip && <Clip kind={clip.kind} at={clip.at} offset={clip.offset} tilt={clip.tilt} tone={clip.tone} />}
          <div className={styles.figureImage} style={{ aspectRatio: block.ratio ?? 16 / 9 }}>
            <Image src={block.src} alt={block.alt ?? block.caption ?? ""} fill sizes="(min-width: 1025px) 40vw, 85vw" />
          </div>
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    }
  }
}

/**
 * The typed sheet inside the folder: a full row of binder holes down the
 * left, a clipped "plate" and file info, then the text with a drop cap.
 */
export default function CaseSheet({ info, quote, body, soon, plate, title, still }: Props) {
  return (
    <div className={styles.sheet} data-sheet>
      {/* Nine punched holes down the binding edge */}
      <div className={styles.holes} aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className={styles.inner}>
        <div className={styles.left}>
          <figure className={styles.photo}>
            <Clip at="top" offset="80%" tilt={4} size="1.7rem" />
            <div className={`${styles.plate} ${still ? styles.hasStill : ""}`}>
              {still ? (
                <Image src={still} alt={title} fill sizes="(min-width: 1025px) 22vw, 80vw" preload />
              ) : (
                <span className={styles.plateTitle}>{title}</span>
              )}
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
              <figcaption className={styles.quoteLabel}>
                {quote.label}
              </figcaption>
              <blockquote>
                <p>“{quote.text}”</p>
              </blockquote>
              <p className={styles.quoteBy}>— {quote.by}</p>
            </figure>
          )}
          {body.length > 0 ? (
            <div className={styles.desc}>
              {body.map((block, i) => (
                <BodyBlock key={i} block={block} />
              ))}
            </div>
          ) : (
            <p className={styles.soon}>{soon}</p>
          )}
        </div>
      </div>

      <span className={styles.grain} aria-hidden="true" />
    </div>
  );
}
