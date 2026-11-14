/**
 * The shape of the content files (content/folders.json and
 * content/reviews/<slug>/review.json, mirrored in R2). See CONTENT.md.
 *
 * Any text can be one string (same in every language) or {"en": …, "vi": …}.
 * Image paths are relative to the review's folder ("still.jpg") or absolute
 * URLs. The loader resolves both before components ever see them, so the
 * types below describe the *resolved* content: plain strings, full URLs.
 */
import type { ClipEdge, ClipTone } from "@/components/Clip/Clip";

export type Verdict = "agrees" | "against" | "between";
export type Theme = "light" | "dark";

/** How an object is held to the folder. `false` = not clipped. */
export type ClipSpec =
  | false
  | { kind?: "paper" | "binder"; at?: ClipEdge; offset?: string; tilt?: number; tone?: ClipTone };

/**
 * Where a loose paper lies on the desk (wide screens). x: % from the left of
 * the folder; y: rem from the bottom of the sheet (negative overlaps the
 * sheet); r: rotation in degrees; w: width in rem. Phones ignore x/y and lay
 * the papers out in order. `mobile: false` hides one on phones.
 */
export type Place = { x?: number; y?: number; r?: number; w?: number; mobile?: boolean };

type Base = { place?: Place };

export type Scrap =
  | (Base & { type: "note"; text: string; label?: string; color?: string; clip?: ClipSpec })
  | (Base & { type: "stamp"; label?: string; text?: string })
  | (Base & { type: "trailer"; clip?: ClipSpec })
  | (Base & { type: "photo"; src: string; caption?: string; alt?: string; ratio?: number; clip?: ClipSpec })
  | (Base & { type: "ticket"; clip?: ClipSpec })
  | (Base & { type: "strip"; frames?: string[]; clip?: ClipSpec })
  | (Base & {
      type: "sticker";
      text: string;
      sub?: string;
      shape?: "round" | "label" | "badge";
      color?: string;
      ink?: string;
      icon?: "reel" | "clapper";
    })
  | (Base & { type: "clipping"; text: string; title?: string; source?: string; clip?: ClipSpec })
  | (Base & { type: "ruler" });

export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "quote"; text: string; by?: string }
  | {
      type: "image";
      src: string;
      alt?: string;
      caption?: string;
      /** width / height, so the page reserves the space before it loads */
      ratio?: number;
      clip?: ClipSpec;
    };
