import type { ClipSpec, FilmObjectPhoto, Scrap } from "@/lib/schema";

/** Small seeded random generator (mulberry32): same review, same desk, every visit. */
function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    /** A number between lo and hi, rounded to 2 decimals. */
    range: (lo: number, hi: number) => Math.round((lo + next() * (hi - lo)) * 100) / 100,
    pick: <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)],
  };
}

/** Pale papers for torn-off takeaways */
const TORN_COLORS = ["#f6d97a", "#9dbcf2", "#e2a7b1", "#b9d6a3", "#efe6d2"];

/** How tall the desk is for the standard set, in rem. */
export const DEFAULT_DESK = 44;

const STICKER_COLORS = [
  { color: "#ffe927", ink: "#191919" }, // the site's yellow
  { color: "#fdfaf7", ink: "#191919" },
  { color: "#1E4BD7", ink: "#ffffff" },
  { color: "#191919", ink: "#fdfaf7" },
  { color: "#c3372c", ink: "#ffffff" },
];

/**
 * The standard loose papers for a review that doesn't list its own `scraps`.
 * The layout (tuned for a 34rem desk) is the same for every film, but each
 * review gets its own variation of it, seeded from its slug: which paper
 * the note is on, how each thing is held (clip, tape or pin), sizes, sticker
 * colours, and small shifts in position and angle. Papers may overlap; the
 * one touched last comes to the top.
 *
 * A review can copy this list into its review.json and change anything.
 */
export function defaultScraps(opts: {
  /** Seeds the variation: the review's slug. */
  seed: string;
  note: string;
  /** Small caption on the note (default: "In short"). */
  noteLabel?: string;
  hasTrailer: boolean;
  genre: string;
  director: string;
  year: number;
  cutLabel: string;
  title: string;
  /** The saying under test, and who said it: a torn-off paper. */
  quote?: string;
  quoteBy?: string;
  /** What the essay is about: another torn-off paper. */
  topic?: string;
  /** The film's object (a cut-out photo, or a drawn kind), in place of the old ruler. */
  object?: FilmObjectPhoto | "dogtags" | "press" | "rifle" | "deed";
  /** The essay's takeaways: one torn-off paper each (up to three). */
  takeaways?: { title?: string; label?: string; text: string; near?: number }[];
  /** Index of the essay's last block: the note goes under it ("In short", at the end). */
  lastBlock?: number;
  labels: { saying: string; topic: string };
}): Scrap[] {
  const rnd = seeded(opts.seed);
  /** A position near (x, y), turned a little and sized between lo and hi. */
  const at = (x: number, y: number, r: number, size: [number, number] = [0.9, 1.1]) => ({
    x: Math.round((x + rnd.range(-3, 3)) * 10) / 10,
    y: Math.round((y + rnd.range(-1.5, 1.5)) * 10) / 10,
    r: Math.round(r + rnd.range(-4, 4)),
    s: rnd.range(size[0], size[1]),
  });
  /** On the sheet itself: x %, y % down page 1. */
  const paper = (x: number, y: number, r: number, size: [number, number] = [0.9, 1.1]) => ({
    ...at(x, 0, r, size),
    y: Math.round((y + rnd.range(-2, 2)) * 10) / 10,
    on: "paper" as const,
  });
  /** How a paper is held: one of a few ways that make sense for it. */
  const hold = (options: ClipSpec[]) => rnd.pick(options);
  const sticker = () => rnd.pick(STICKER_COLORS);

  const round = sticker();
  const badge = rnd.pick(STICKER_COLORS.filter((c) => c.color !== round.color));
  // Torn papers: a different pale colour each, in an order set by the film.
  const torn = [...TORN_COLORS].sort(() => rnd.range(-1, 1));
  const edge = () => rnd.pick(["bottom", "bottom", "top", "both"] as const);

  // Torn-off papers: the saying, then the takeaways (or, until there are any, the topic).
  const papers: Scrap[] = [];
  if (opts.quote)
    papers.push({
      type: "torn",
      title: opts.labels.saying,
      label: opts.quoteBy,
      text: `“${opts.quote}”`,
      color: torn[0],
      edge: edge(),
      place: { ...paper(5, 52, -3, [0.95, 1.05]), w: 18 },
    });
  const notes = opts.takeaways?.length
    ? opts.takeaways.slice(0, 3)
    : opts.topic
      ? [{ title: opts.title, label: opts.labels.topic, text: opts.topic }]
      : [];
  const slots: [number, number, number, number][] = [
    [38, 18, 2, 18],
    [44, 29, -3, 17],
    [80, 32, 4, 15],
  ];
  notes.forEach(({ near, ...t }, i) => {
    const [x, y, r, w] = slots[i];
    // A takeaway that names its paragraph lies beside it on the sheet, in the
    // side column, over the text if it has to. Otherwise: on the desk.
    const place =
      near !== undefined
        ? { ...at(3 + (i % 2) * 2, 0, i % 2 ? 3 : -3, [0.95, 1.03]), y: rnd.range(-0.5, 1.5), on: "paper" as const, near, w: 17 }
        : { ...at(x, y, r, [0.9, 1.05]), w };
    papers.push({ type: "torn", ...t, color: torn[i + 1], edge: edge(), place });
  });

  const list: Scrap[] = [
    {
      type: "note",
      text: opts.note,
      label: opts.noteLabel,
      paper: rnd.pick(["sticky", "lined", "kraft", "index", "grid"] as const),
      clip: hold([
        { at: "top", offset: "78%", tilt: 6 },
        { kind: "tape", at: "top", offset: "50%", tilt: rnd.range(-6, 6) },
        { kind: "pin", at: "top", offset: "50%", tone: rnd.pick(["red", "blue", "brass"] as const) },
        { kind: "tape", at: "corner" },
      ]),
      // At the end of the essay, under its last line; without one, on the desk.
      place:
        opts.lastBlock !== undefined
          ? { ...at(60, 0, -3, [0.95, 1.05]), y: 1.5, on: "paper" as const, near: opts.lastBlock, after: true }
          : at(3, -6, -3, [0.95, 1.1]),
    },
    ...papers,
    { type: "stamp", place: paper(14, 84, 8, [0.85, 1.15]) },
    {
      type: "sticker",
      shape: "round",
      text: opts.genre.split("/")[0].trim(),
      color: round.color,
      ink: round.ink,
      place: at(29, 30, -12, [0.8, 1.3]),
    },
    {
      type: "sticker",
      shape: "badge",
      icon: rnd.pick(["reel", "clapper"] as const),
      text: `35mm · ${opts.year}`,
      color: badge.color,
      ink: badge.ink,
      place: paper(87, 1, 9, [0.85, 1.1]),
    },
    { type: "sticker", shape: "label", text: opts.cutLabel, sub: opts.director, place: at(62, 37, -4, [0.85, 1.2]) },
    ...(opts.object
      ? [
          typeof opts.object === "string"
            ? { type: "object" as const, kind: opts.object, place: at(4, 34, rnd.range(-6, 6), [0.95, 1.1]) }
            : {
                type: "object" as const,
                ...opts.object,
                place: { ...at(4, 30, rnd.range(-6, 6), [0.95, 1.05]), w: opts.object.w },
              },
        ]
      : []),
  ];

  if (opts.hasTrailer) {
    list.splice(
      1,
      0,
      {
        type: "trailer",
        clip: hold([
          { kind: "binder", at: "top", offset: "50%", tilt: -3 },
          { kind: "tape", at: "top", offset: "50%", tilt: rnd.range(-5, 5) },
          { kind: "tape", at: "corner-right" },
        ]),
        place: { ...at(25, 3, 2.5, [0.95, 1.1]), w: 19 },
      },
      // Stills from the trailer (shown with YouTube consent), taped down. YouTube
      // offers only the thumbnail and three frames; the thumbnail is the trailer
      // print already, so these are frames 1 and 3. Own stills (R2) add variety.
      {
        type: "photo",
        src: "yt:maxres1",
        clip: hold([{ kind: "tape", at: "top", offset: "50%", tilt: rnd.range(-6, 6) }, { kind: "tape", at: "corner" }]),
        place: { ...at(66, 4, 3, [0.95, 1.1]), w: 20 },
      },
      {
        type: "photo",
        src: "yt:maxres3",
        clip: hold([{ kind: "tape", at: "corner-right" }, { kind: "pin", at: "top", offset: "50%", tone: "red" }]),
        place: { ...paper(62, 66, 4, [0.9, 1.05]), w: 16 },
      },
      {
        type: "ticket",
        clip: hold([
          { at: "left", offset: "50%", tilt: -8 },
          { kind: "pin", at: "left", offset: "50%", tone: "brass" },
          { kind: "tape", at: "right", offset: "50%" },
        ]),
        place: at(68, 20, -5, [0.85, 1.1]),
      },
      {
        type: "strip",
        clip: hold([
          { at: "corner-right", offset: "1.1rem", tone: "brass" },
          { kind: "tape", at: "corner" },
          { kind: "tape", at: "top", offset: "30%" },
        ]),
        place: at(3, 16, -4, [0.9, 1.15]),
      },
    );
  }
  return list;
}
