import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllPostSlugs, getPost } from "@/lib/content";
import { DEFAULT_DESK, defaultScraps } from "@/lib/scraps";
import { essayParts } from "@/lib/parts";
import { scrapLabels } from "@/i18n/labels";
import CaseFolder from "@/components/CaseFolder/CaseFolder";
import JsonLd from "@/components/JsonLd/JsonLd";
import { SITE_URL, AUTHOR, alternates, baseOpenGraph } from "@/lib/site";

const textOn = (theme: string) => (theme === "dark" ? "#000" : "#fff");

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/posts/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const [dict, entry] = await Promise.all([
    getDictionary(locale),
    getPost(locale, slug),
  ]);
  if (!entry) return {};
  const { post, folder } = entry;
  const title = `${post.title} (${post.year})`;
  const description =
    [
      post.quote && `“${post.quote}”`,
      post.excerpt ?? post.topic,
      post.body.length ? "" : dict.post.soon,
    ]
      .filter(Boolean)
      .join(" — ") || dict.meta.description;
  return {
    title,
    description,
    keywords: [
      post.title,
      folder.title,
      post.genre,
      String(post.year),
      post.topic ?? "",
    ].filter(Boolean),
    alternates: alternates(locale, `/posts/${slug}`),
    openGraph: {
      ...baseOpenGraph(locale, dict.meta.title),
      type: "article",
      title,
      description,
      url: `/${locale}/posts/${slug}`,
      publishedTime: post.date,
      authors: [AUTHOR],
      section: folder.title,
      tags: [post.genre, folder.title],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PostPage({
  params,
}: PageProps<"/[locale]/posts/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();

  const [dict, entry] = await Promise.all([
    getDictionary(locale),
    getPost(locale, slug),
  ]);
  if (!entry) notFound();
  const { post, folder, next, groupIndex, groupCount, pageIndex } = entry;

  const url = `${SITE_URL}/${locale}/posts/${post.slug}`;
  const written = post.body.length > 0;
  const verdict = post.verdict
    ? dict.post.verdict[post.verdict]
    : dict.post.pending;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              // Until the analysis is written the page is a placeholder, not a review.
              "@type": written ? "Review" : "WebPage",
              "@id": `${url}#review`,
              name: `${post.title} (${post.year})`,
              headline: post.quote,
              description: post.excerpt ?? post.topic,
              reviewBody: written
                ? post.body
                    .flatMap((b) => (b.type === "p" ? [b.text] : []))
                    .join(" ")
                : undefined,
              inLanguage: locale,
              url,
              datePublished: post.date,
              author: { "@type": "Person", name: AUTHOR },
              publisher: {
                "@type": "Organization",
                name: dict.meta.title,
                url: `${SITE_URL}/${locale}`,
              },
              image: `${url}/opengraph-image`,
              timeRequired: post.minutes ? `PT${post.minutes}M` : undefined,
              [written ? "itemReviewed" : "about"]: {
                "@type": "Movie",
                name: post.title,
                dateCreated: String(post.year),
                genre: post.genre,
                director: { "@type": "Person", name: folder.title },
                trailer: post.trailer && {
                  "@type": "VideoObject",
                  name: `${post.title} (${post.year}) — ${dict.post.trailer}`,
                  embedUrl: `https://www.youtube-nocookie.com/embed/${post.trailer}`,
                  thumbnailUrl: `https://i.ytimg.com/vi/${post.trailer}/hqdefault.jpg`,
                },
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: dict.meta.title,
                  item: `${SITE_URL}/${locale}`,
                },
                { "@type": "ListItem", position: 2, name: folder.title },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: `${post.title} (${post.year})`,
                  item: url,
                },
              ],
            },
          ],
        }}
      />
      <CaseFolder
        key={post.slug}
        locale={locale}
        path={`/${locale}/posts/${post.slug}`}
        title={post.title}
        color={post.color}
        coverColor={folder.posts[0].color}
        textColor={textOn(post.theme)}
        groupIndex={groupIndex}
        groupCount={groupCount}
        tags={folder.posts.map((p, i) => ({
          label: p.tab,
          href: `/${locale}/posts/${p.slug}`,
          color: p.color,
          textColor: textOn(p.theme),
          active: i === pageIndex,
        }))}
        info={[
          `${post.title} (${post.year})`,
          `${dict.post.directedBy} ${folder.title}`,
          post.genre,
          post.topic && `${dict.post.topic}: ${post.topic}`,
          `${dict.post.verdictLabel}: ${verdict}`,
          [
            post.dateLabel,
            post.minutes && `${post.minutes} ${dict.post.minutes}`,
          ]
            .filter(Boolean)
            .join(" · "),
        ].filter((line): line is string => Boolean(line))}
        quote={
          post.quote
            ? {
                label: dict.post.testing,
                text: post.quote,
                by: post.quoteBy ?? "",
              }
            : undefined
        }
        body={post.body}
        soon={dict.post.soon}
        plate={`${!post.still && post.poster ? dict.post.poster : dict.post.plate} — ${post.title} (${post.year})`}
        still={post.still ?? post.poster}
        stillIsPoster={!post.still && Boolean(post.poster)}
        scrap={{
          scraps: post.scraps ?? [
            ...defaultScraps({
              seed: post.slug,
              note: post.excerpt ?? dict.post.soon,
              title: `${post.title} (${post.year})`,
              quote: post.quote,
              quoteBy: post.quoteBy,
              topic: post.topic,
              takeaways: post.takeaways,
              object: post.object,
              lastBlock: post.body.length ? post.body.length - 1 : undefined,
              labels: { saying: dict.post.testing, topic: dict.post.topic },
              hasTrailer: Boolean(post.trailer),
              genre: post.genre,
              director: folder.title,
              year: post.year,
              cutLabel: dict.post.cut,
            }),
            ...(post.extraScraps ?? []),
          ],
          desk: post.desk ?? (post.scraps ? undefined : DEFAULT_DESK),
          film: {
            title: post.title,
            year: post.year,
            trailer: post.trailer,
            verdict,
            poster: post.poster,
          },
          labels: scrapLabels(dict),
        }}
        footer={{ dict: dict.footer, aboutLabel: dict.nav.about }}
        next={{
          href: `/${locale}/posts/${next.post.slug}`,
          title: `${next.post.title} (${next.post.year})`,
          category: next.folder.title,
          color: next.post.color,
          textColor: textOn(next.post.theme),
          label: dict.post.next,
          keep: dict.post.keepScrolling,
          read: dict.post.read,
          parts: essayParts(post.body, dict.post.intro),
          partsLabel: dict.post.contents,
          sameGroup: next.folder.slug === folder.slug,
        }}
      />
    </>
  );
}
