"use client";

import { useRef } from "react";
import { Draggable, useGSAP } from "@/lib/gsap";
import { Paperclip } from "@/components/CaseSheet/CaseSheet";
import styles from "./Scrapbook.module.css";

type Props = {
  note: string;
  noteLabel: string;
  stamp: string;
  stampLabel: string;
};

/**
 * Loose items lying on the open folder: a note, a rubber stamp, a ruler.
 * Draggable with a mouse; on touch screens they sit in the flow so they
 * never fight with scrolling.
 */
export default function Scrapbook({ note, noteLabel, stamp, stampLabel }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!window.matchMedia("(pointer: fine) and (min-width: 1025px)").matches) return;
      const bounds = root.current?.closest("[data-case-inner]") ?? undefined;
      const drags = Draggable.create(root.current!.querySelectorAll("[data-drag]"), {
        type: "x,y",
        bounds,
        zIndexBoost: true,
        onPress() {
          (this.target as HTMLElement).classList.add(styles.grabbing);
        },
        onRelease() {
          (this.target as HTMLElement).classList.remove(styles.grabbing);
        },
      });
      return () => drags.forEach((d) => d.kill());
    },
    { scope: root },
  );

  return (
    <div ref={root} className={styles.scrapbook} data-scrapbook>
      <div className={`${styles.item} ${styles.noteItem}`} data-scrap>
        <div className={styles.note} data-drag>
          <Paperclip className={styles.clip} />
          <span className={styles.label}>{noteLabel}</span>
          <p>{note}</p>
        </div>
      </div>

      <div className={`${styles.item} ${styles.stampItem}`} data-scrap>
        <div className={styles.stamp} data-drag>
          <span>{stampLabel}</span>
          <strong>{stamp}</strong>
        </div>
      </div>

      <div className={`${styles.item} ${styles.rulerItem}`} data-scrap>
        <div className={styles.ruler} data-drag aria-hidden="true">
          {Array.from({ length: 31 }, (_, i) => (
            <span key={i} className={i % 5 === 0 ? styles.major : undefined}>
              {i % 5 === 0 ? <em>{i}</em> : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
