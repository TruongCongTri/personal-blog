import type { Scrap } from "@/lib/schema";

/**
 * The standard loose papers for a review that doesn't list its own
 * `scraps`. Positions match the desk layout tuned for a 34rem desk.
 * A review can copy this list into its review.json and change anything.
 */
export function defaultScraps(opts: {
  note: string;
  /** Small caption on the note (default: "In short"). */
  noteLabel?: string;
  hasTrailer: boolean;
  genre: string;
  director: string;
  year: number;
  cutLabel: string;
}): Scrap[] {
  const list: Scrap[] = [
    { type: "note", text: opts.note, label: opts.noteLabel, place: { x: 4, y: -4 } },
    { type: "stamp", place: { x: 71, y: 2 } },
    { type: "sticker", shape: "round", text: opts.genre.split("/")[0].trim(), place: { x: 30, y: 22 } },
    { type: "sticker", shape: "badge", icon: "reel", text: `35mm · ${opts.year}`, place: { x: 88, y: 7 } },
    { type: "sticker", shape: "label", text: opts.cutLabel, sub: opts.director, place: { x: 58, y: 25 } },
    { type: "ruler", place: { x: 4, y: 29, mobile: false } },
  ];
  if (opts.hasTrailer) {
    list.splice(
      1,
      0,
      { type: "trailer", place: { x: 37, y: 4 } },
      { type: "ticket", place: { x: 67, y: 15.5 } },
      { type: "strip", place: { x: 7, y: 15 } },
    );
  }
  return list;
}
