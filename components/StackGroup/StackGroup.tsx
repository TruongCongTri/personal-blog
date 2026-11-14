import type { CSSProperties, MouseEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Folder } from "@/lib/content";
import type { HoverState } from "@/components/Stack/Stack";
import StackCover from "@/components/StackCover/StackCover";
import StackPage from "@/components/StackPage/StackPage";
import styles from "./StackGroup.module.css";

type Props = {
  locale: Locale;
  folder: Folder;
  index: number;
  count: number;
  hover: HoverState;
  footer: Dictionary["footer"];
  aboutLabel: string;
  onOpen: (e: MouseEvent<HTMLAnchorElement>, g: number, p: number) => void;
  onPageEnter: (g: number, p: number) => void;
  onPageLeave: () => void;
  onUnfoldEnter: (g: number, p: number) => void;
  onUnfoldLeave: () => void;
};

export const themeText = (theme: string) => (theme === "dark" ? "#000" : "#fff");

/** One topic: a cover in front, its folders (posts) filed behind it. */
export default function StackGroup(props: Props) {
  const { folder, index: g, count, hover } = props;
  const first = folder.posts[0];
  const tabs = folder.posts.map((p) => p.tab);
  const isLast = g === count - 1;

  // Groups in front of the hovered one lean forward / drop to reveal it.
  const rotated = hover.hovered && g > hover.group;
  const unfolded = hover.unfolded && g > hover.group;
  const active = hover.group === g;

  const style = {
    "--cover-color": themeText(first.theme),
    "--cover-bg-color": first.color,
    "--gi": g,
    "--gr": count - g - 1,
  } as CSSProperties;

  return (
    <div
      className={`${styles.group} ${rotated ? styles.rotated : ""} ${unfolded ? styles.unfolded : ""}`}
      style={style}
      data-group
    >
      <div className={styles.inner} data-group-inner>
        <StackCover
          category={folder.title}
          desc={folder.description}
          isLast={isLast}
          hovered={hover.hovered && hover.page === 0 && active}
          rotated={hover.hovered && hover.page >= 0 && active}
          unfolded={((hover.unfolded || hover.hovered) && active) || (!hover.unfolded && hover.page === -1 && isLast)}
          footer={props.footer}
          locale={props.locale}
          aboutLabel={props.aboutLabel}
        />
        {folder.posts.map((post, p) => (
          <StackPage
            key={post.slug}
            href={`/${props.locale}/posts/${post.slug}`}
            title={post.title}
            color={post.color}
            textColor={themeText(post.theme)}
            tabs={tabs}
            index={p}
            hovered={hover.hovered && p === hover.page && active}
            rotated={hover.hovered && p < hover.page && active}
            onClick={(e) => props.onOpen(e, g, p)}
            onEnter={() => props.onPageEnter(g, p)}
            onLeave={props.onPageLeave}
            onUnfoldEnter={() => props.onUnfoldEnter(g, p)}
            onUnfoldLeave={props.onUnfoldLeave}
          />
        ))}
      </div>
    </div>
  );
}
