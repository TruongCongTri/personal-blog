import type { Block } from "@/lib/schema";

/** Anchor id of a block that starts a part of the essay. */
export const partId = (index: number) => `part-${index}`;

export type Part = { id: string; label: string; level: 2 | 3 };

/**
 * The essay's parts, for the contents in the progress card: every heading,
 * plus the opening paragraphs before the first one ("Introduction").
 */
export function essayParts(body: Block[], introLabel: string): Part[] {
  const parts: Part[] = [];
  body.forEach((b, i) => {
    if (b.type === "h") parts.push({ id: partId(i), label: b.text, level: b.level ?? 2 });
    else if (i === 0) parts.push({ id: partId(0), label: introLabel, level: 2 });
  });
  return parts.length > 1 ? parts : [];
}
