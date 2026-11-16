import type { Dictionary } from "@/i18n/dictionaries";
import type { ScrapLabels } from "@/components/Scrapbook/Scrapbook";

/** The words the loose papers need, picked from a page's dictionary. */
export const scrapLabels = (dict: Dictionary): ScrapLabels => ({
  note: dict.post.noteLabel,
  verdict: dict.post.verdictLabel,
  trailer: dict.post.trailer,
  play: dict.post.play,
  close: dict.post.closeTrailer,
  admit: dict.post.admit,
  row: dict.post.row,
  seat: dict.post.seat,
  ask: { notice: dict.consent.trailerNotice, allow: dict.consent.allowPlay, external: dict.consent.external },
  frame: dict.post.frame,
  prevFrame: dict.post.prevFrame,
  nextFrame: dict.post.nextFrame,
  source: dict.post.source,
  trailerSource: dict.post.trailerSource,
});
