import type { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/i18n/config";
import { getFolders } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import { LEGAL_DOCS, LEGAL_UPDATED } from "@/i18n/legal";

const languages = (path: string) => ({
  ...Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`])),
  "x-default": `${SITE_URL}/${defaultLocale}${path}`,
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const folders = await getFolders("en");
  const posts = folders.flatMap((f) => f.posts);
  const latest = posts.map((p) => p.date).sort().pop();

  const entries: MetadataRoute.Sitemap = [];
  for (const l of locales) {
    entries.push({
      url: `${SITE_URL}/${l}`,
      lastModified: latest,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: languages("") },
    });
    for (const p of posts) {
      entries.push({
        url: `${SITE_URL}/${l}/posts/${p.slug}`,
        lastModified: p.date,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: { languages: languages(`/posts/${p.slug}`) },
      });
    }
    for (const doc of LEGAL_DOCS)
      entries.push({
        url: `${SITE_URL}/${l}/legal/${doc}`,
        lastModified: LEGAL_UPDATED,
        changeFrequency: "yearly",
        priority: 0.2,
        alternates: { languages: languages(`/legal/${doc}`) },
      });
    entries.push({
      url: `${SITE_URL}/${l}/about`,
      changeFrequency: "yearly",
      priority: 0.4,
      alternates: { languages: languages("/about") },
    });
  }
  return entries;
}
