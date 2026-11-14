import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllPostSlugs, getPost } from "@/lib/content";
import { ogCard, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Film Files";

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const l = hasLocale(locale) ? locale : "en";
  const [dict, entry] = await Promise.all([getDictionary(l), getPost(l, slug)]);
  if (!entry) return ogCard({ kicker: "", title: dict.meta.title, color: "#191919", ink: "#fff", site: dict.meta.title });
  const { post, folder } = entry;
  return ogCard({
    kicker: [folder.title, post.year, post.verdict ? dict.post.verdict[post.verdict] : dict.post.soon].join(" · "),
    title: post.title,
    quote: post.quote ?? post.topic,
    color: post.color,
    ink: post.theme === "dark" ? "#000" : "#fff",
    site: dict.meta.title,
  });
}
