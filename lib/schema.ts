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
  | { kind?: "paper" | "binder" | "tape" | "pin"; at?: ClipEdge; offset?: string; tilt?: number; tone?: ClipTone };

/**
 * Where a loose paper lies on the desk (wide screens). x: % from the left of
 * the folder; y: rem from the bottom of the sheet (negative overlaps the
 * sheet); r: rotation in degrees; w: width in rem. Phones ignore x/y and lay
 * the papers out in order. s: size, as a scale (0.8 smaller, 1.2 bigger).
 * `mobile: false` hides one on phones.
 */
export type Place = {
  x?: number;
  y?: number;
  r?: number;
  w?: number;
  s?: number;
  mobile?: boolean;
  /** "paper": lies on the sheet itself; y is then % down page 1 (0 top, 100 bottom). */
  on?: "paper" | "desk";
  /**
   * Lie on the sheet next to this block of the essay (its index in `body`),
   * at the level where it starts (or, with `after`, just below where it ends).
   * Wide screens only; y then nudges it in rem. Overlaps the text freely.
   */
  near?: number;
  after?: boolean;
};

type Base = { place?: Place };

export type Scrap =
  | (Base & {
      type: "note";
      text: string;
      label?: string;
      color?: string;
      /** sticky (yellow, default) · lined · grid · kraft · index (ruled card) */
      paper?: "sticky" | "lined" | "grid" | "kraft" | "index";
      clip?: ClipSpec;
    })
  | (Base & { type: "stamp"; label?: string; text?: string })
  | (Base & { type: "trailer"; clip?: ClipSpec })
  | (Base & {
      type: "photo";
      /** An image, or "yt:maxresdefault" / "yt:maxres1".."yt:maxres3" for a still from the trailer. */
      src: string;
      caption?: string;
      /** Shown only in the large view (when there's no room for a caption on the desk). */
      title?: string;
      /** Credited on the large view ("Source: …"). */
      source?: string;
      alt?: string;
      ratio?: number;
      clip?: ClipSpec;
    })
  | (Base & {
      /** A piece of coloured paper torn off along one edge: a takeaway from the essay. */
      type: "torn";
      title?: string;
      label?: string;
      text: string;
      /** Paper colour (default: a pale yellow). */
      color?: string;
      /** Which edge is torn: bottom (default) · top · both */
      edge?: "bottom" | "top" | "both";
      clip?: ClipSpec;
    })
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
  | (Base & { type: "ruler" })
  /**
   * An object that matters in the film: a cut-out photo (src, with its credit),
   * or one of the drawn ones (kind: dogtags · press · rifle · deed).
   */
  | (Base & { type: "object"; kind?: "dogtags" | "press" | "rifle" | "deed" } & Partial<FilmObjectPhoto>);

export type FilmObjectPhoto = {
  /** The object's photo, cut out (transparent), next to the review. */
  src: string;
  /** width / height of the photo */
  ratio?: number;
  /** Width on the desk, in rem. */
  w?: number;
  title?: string;
  alt?: string;
  /** Author, licence, where it's from: shown when it opens large, and in the Terms. */
  credit?: string;
  url?: string;
};

export type Block =
  | { type: "p"; text: string }
  /** A heading. level 2 (default): a main part, listed in the contents; 3: a point within it. */
  | { type: "h"; text: string; level?: 2 | 3 }
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
