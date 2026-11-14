import "server-only";
import type { Locale } from "@/i18n/config";
import type en from "@/content/posts/en.json";

type RawArchive = typeof en;
type RawFolder = RawArchive["folders"][number];
type RawPost = RawFolder["posts"][number];

export type Theme = "light" | "dark";
/** How the film answers the saying it is tested against. */
export type Verdict = "agrees" | "against" | "between";
export type Post = Omit<RawPost, "theme" | "verdict"> & { theme: Theme; verdict: Verdict; dateLabel: string };
export type Folder = Omit<RawFolder, "posts"> & { posts: Post[] };

const archives: Record<Locale, () => Promise<RawArchive>> = {
  en: () => import("@/content/posts/en.json").then((m) => m.default),
  vi: () => import("@/content/posts/vi.json").then((m) => m.default),
};

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

export async function getFolders(locale: Locale): Promise<Folder[]> {
  const archive = await archives[locale]();
  return archive.folders.map((folder) => ({
    ...folder,
    posts: folder.posts.map((post) => ({
      ...post,
      theme: post.theme as Theme,
      verdict: post.verdict as Verdict,
      dateLabel: formatDate(post.date, locale),
    })),
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
