import type { CSSProperties, MouseEvent } from "react";
import Link from "next/link";
import Tag from "@/components/Tag/Tag";
import styles from "./CaseTags.module.css";

export type CaseTag = {
  label: string;
  href: string;
  color: string;
  textColor: string;
  active: boolean;
};

type Props = {
  tags: CaseTag[];
  onSelect: (e: MouseEvent<HTMLAnchorElement>, href: string) => void;
};

/**
 * The group's tabs, running down the right edge of the open folder (the same
 * row as in the drawer, turned 90°). The active one sits on top.
 */
export default function CaseTags({ tags, onSelect }: Props) {
  return (
    <div className={styles.tags} data-case-tags>
      {tags.map((tag, i) => (
        <div
          key={tag.href}
          className={`${styles.page} ${tag.active ? styles.active : ""}`}
          style={{ "--bg-color": tag.color, "--z": tags.length - i } as CSSProperties}
        >
          {tags.map((t, j) =>
            j === i ? (
              <Link
                key={t.href}
                href={t.href}
                className={styles.item}
                aria-current={t.active ? "page" : undefined}
                onClick={(e) => onSelect(e, t.href)}
                data-case-tag={t.active ? "active" : "other"}
              >
                <Tag label={t.label} color={t.textColor} bg={t.color} visible />
              </Link>
            ) : (
              <Tag key={t.href} label={t.label} color={t.textColor} bg={t.color} visible={false} />
            ),
          )}
        </div>
      ))}
    </div>
  );
}
