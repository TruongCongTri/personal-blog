import type { CSSProperties, MouseEvent, PointerEvent } from "react";
import Link from "next/link";
import Tag from "@/components/Tag/Tag";
import styles from "./StackPage.module.css";

type Props = {
  href: string;
  title: string;
  color: string;
  textColor: string;
  tabs: string[];
  index: number;
  hovered: boolean;
  rotated: boolean;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
  onEnter: () => void;
  onLeave: () => void;
  onUnfoldEnter: () => void;
  onUnfoldLeave: () => void;
};

const isMouse = (e: PointerEvent) => e.pointerType === "mouse";

/** One folder (post). Clicking it lifts it out of the drawer. */
export default function StackPage(props: Props) {
  const style = {
    "--color": props.textColor,
    "--bg-color": props.color,
    "--pz": -props.index,
  } as CSSProperties;

  return (
    <Link
      href={props.href}
      className={`${styles.page} ${props.rotated ? styles.rotated : ""}`}
      style={style}
      onClick={props.onClick}
      onPointerEnter={(e) => isMouse(e) && props.onEnter()}
      onPointerLeave={(e) => isMouse(e) && props.onLeave()}
      aria-label={props.title}
      data-page
    >
      <span className={styles.bg} />
      <span className={styles.header} data-page-header>
        {props.tabs.map((tab, i) => (
          <Tag
            key={tab}
            label={tab}
            color={props.textColor}
            bg={props.color}
            visible={i === props.index}
          />
        ))}
      </span>
      <span
        className={styles.unfold}
        onPointerEnter={(e) => isMouse(e) && props.onUnfoldEnter()}
        onPointerLeave={(e) => isMouse(e) && props.onUnfoldLeave()}
      />
    </Link>
  );
}
