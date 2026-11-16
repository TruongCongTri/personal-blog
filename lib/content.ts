import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/i18n/config";
import { r2BucketUrl, r2Configured, r2GetJson, r2PublicUrl } from "@/lib/r2";
import type { Block, FilmObjectPhoto, Scrap, Theme, Verdict } from "@/lib/schema";

export type { Block, Scrap, Theme, Verdict } from "@/lib/schema";

/**
 * Content loader. The archive lives in Cloudflare R2 (folders.json plus one
 * reviews/<slug>/review.json per review, images alongside). The local
 * content/ folder has the same layout: it is where reviews are written and
 * previewed, and `npm run content:push` uploads it (see CONTENT.md).
 *
 * CONTENT_SOURCE=r2|local picks the source; by default R2 when its variables
 * are set. If R2 has no archive yet, the local folder is used instead.
 *
 * Everything is read once into one cache entry tagged "content", refreshed
 * hourly and on demand: the push script calls /api/revalidate afterwards.
 */

/** Text in the files: one string for every language, or one per language. */
type Text = string | Record<Locale, string>;

type RawFolder = { slug: string; title: Text; description: Text; posts: string[] };
type RawIndex = { folders: RawFolder[] };
// Review files use the resolved shape with Text in place of strings.
type RawReview = Record<string, unknown> & { slug: string; folder: string };

type Archive = { source: "r2" | "local"; index: RawIndex; reviews: Record<string, RawReview> };

export type Post = {
  slug: string;
  folder: string;
  tab: string;
  title: string;
  year: number;
  color: string;
  theme: Theme;
  date: string;
  dateLabel: string;
  genre: string;
  /** What the analysis will be about, e.g. "War journalism". */
  topic?: string;
  // The analysis itself. All optional: a review can be filed before it is
  // written, and then shows "The analysis is coming out soon".
  minutes?: number;
  verdict?: Verdict;
  quote?: string;
  quoteBy?: string;
  excerpt?: string;
  /** YouTube video id */
  trailer?: string;
  /** Image for the clipped print at the top of the sheet (overrides the poster). */
  still?: string;
  /** The film's poster, shown in the clipped print at the top of the sheet. */
  poster?: string;
  body: Block[];
  /** Loose papers on the folder. Missing = the standard set. */
  scraps?: Scrap[];
  /** An object that matters in the film, on its desk: a cut-out photo, or a drawn kind. */
  object?: FilmObjectPhoto | "dogtags" | "press" | "rifle" | "deed";
  /** Short takeaways from the essay, put on the desk as torn-off papers. */
  takeaways?: { title?: string; label?: string; text: string }[];
  /** Height of the desk area under the sheet on wide screens, in rem. */
  desk?: number;
};

export type Folder = { slug: string; title: string; description: string; posts: Post[] };

const LOCAL_ROOT = path.join(process.cwd(), "content");

const readsFromR2 = () => (process.env.CONTENT_SOURCE ?? (r2Configured ? "r2" : "local")) === "r2";

async function readLocal<T>(key: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(LOCAL_ROOT, key), "utf8")) as T;
}

async function loadArchive(): Promise<Archive> {
  "use cache";
  cacheTag("content");
  // Production: hourly, and at once after `content:push` (which revalidates
  // the tag). Development: re-read about every second so edits show up after
  // a reload or two. Kept just above the limits (5 min expiry, 30 s stale)
  // below which Next.js would stop prerendering the pages.
  if (process.env.NODE_ENV === "development") cacheLife({ stale: 30, revalidate: 1, expire: 300 });
  else cacheLife("hours");

  if (readsFromR2()) {
    const index = await r2GetJson<RawIndex>("folders.json");
    if (index) {
      const slugs = index.folders.flatMap((f) => f.posts);
      const files = await Promise.all(slugs.map((s) => r2GetJson<RawReview>(`reviews/${s}/review.json`)));
      const reviews: Record<string, RawReview> = {};
      slugs.forEach((s, i) => {
        if (files[i]) reviews[s] = files[i]!;
        else console.warn(`[content] R2 is missing reviews/${s}/review.json — skipped`);
      });
      return { source: "r2", index, reviews };
    }
    console.warn("[content] No folders.json in R2 yet — using the local content/ folder. Run `npm run content:push`.");
  }

  const index = await readLocal<RawIndex>("folders.json");
  const slugs = index.folders.flatMap((f) => f.posts);
  const files = await Promise.all(slugs.map((s) => readLocal<RawReview>(`reviews/${s}/review.json`)));
  return { source: "local", index, reviews: Object.fromEntries(slugs.map((s, i) => [s, files[i]])) };
}

const isText = (v: unknown): v is Record<Locale, string> =>
  !!v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  typeof (v as Record<string, unknown>).en === "string" &&
  typeof (v as Record<string, unknown>).vi === "string";

const IMAGE_KEYS = new Set(["src", "still", "poster"]);

/** Picks the locale's text everywhere and turns relative image paths into URLs. */
function resolve(value: unknown, locale: Locale, media: (file: string) => string, key?: string): unknown {
  if (isText(value)) return value[locale];
  if (Array.isArray(value)) return value.map((v) => resolve(v, locale, media, key === "frames" ? "src" : undefined));
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, locale, media, k)]));
  if (typeof value === "string" && key && IMAGE_KEYS.has(key)) return media(value);
  return value;
}

function mediaFor(source: Archive["source"], slug: string) {
  return (file: string) => {
    if (/^(https?:)?\/\//.test(file) || file.startsWith("/")) return file;
    // "r2:movies/rose/poster.webp": anywhere in the bucket, outside the content folder
    if (file.startsWith("r2:")) return r2BucketUrl(file.slice(3));
    const key = `reviews/${slug}/${file}`;
    return source === "r2" ? r2PublicUrl(key) : `/media/${key}`;
  };
}

// Dates are formatted on the server so client components never re-format
// them (avoids Intl differences between Node and the browser).
function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

const REQUIRED = ["title", "year", "color", "date"] as const;

function toPost(raw: RawReview, locale: Locale, source: Archive["source"]): Post {
  const missing = REQUIRED.filter((k) => raw[k] === undefined);
  if (missing.length) throw new Error(`[content] review "${raw.slug}" is missing: ${missing.join(", ")}`);
  const post = resolve(raw, locale, mediaFor(source, raw.slug)) as Omit<Post, "dateLabel">;
  return {
    ...post,
    tab: post.tab ?? post.title,
    theme: post.theme ?? "light",
    genre: post.genre ?? "",
    body: post.body ?? [],
    dateLabel: formatDate(post.date, locale),
  };
}

export async function getFolders(locale: Locale): Promise<Folder[]> {
  const { index, reviews, source } = await loadArchive();
  return index.folders.map((f) => ({
    slug: f.slug,
    title: resolve(f.title, locale, String) as string,
    description: resolve(f.description, locale, String) as string,
    posts: f.posts.filter((s) => reviews[s]).map((s) => toPost(reviews[s], locale, source)),
  }));
}

export async function getPost(locale: Locale, slug: string) {
  const folders = await getFolders(locale);
  for (let g = 0; g < folders.length; g++) {
    const p = folders[g].posts.findIndex((post) => post.slug === slug);
    if (p === -1) continue;
    const folder = folders[g];
    // "Next file" walks forward through the whole cabinet and wraps around.
    const flat = folders.flatMap((f) => f.posts.map((post) => ({ post, folder: f })));
    const i = flat.findIndex((e) => e.post.slug === slug);
    return {
      folder,
      post: folder.posts[p],
      groupIndex: g,
      groupCount: folders.length,
      pageIndex: p,
      next: flat[(i + 1) % flat.length],
      prev: flat[(i - 1 + flat.length) % flat.length],
    };
  }
  return null;
}

export async function getAllPostSlugs() {
  const folders = await getFolders("en");
  return folders.flatMap((f) => f.posts.map((p) => p.slug));
}

/** Where the content came from on this request ("r2" or "local"). */
export async function contentSource() {
  return (await loadArchive()).source;
}

/**
 * Public URL of a file in the content folder (e.g. "pages/about/still.webp"):
 * served from R2 once pushed, from content/ (at /media/…) while previewing.
 */
export async function contentMediaUrl(key: string) {
  return (await contentSource()) === "r2" ? r2PublicUrl(key) : `/media/${key}`;
}
