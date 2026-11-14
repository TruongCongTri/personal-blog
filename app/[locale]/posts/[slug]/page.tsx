import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllPostSlugs, getPost } from "@/lib/content";
import CaseFolder from "@/components/CaseFolder/CaseFolder";

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
  const entry = await getPost(locale, slug);
  if (!entry) return {};
  return { title: `${entry.post.title} (${entry.post.year})`, description: `${entry.post.quote} — ${entry.post.excerpt}` };
}

export default async function PostPage({ params }: PageProps<"/[locale]/posts/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();

  const [dict, entry] = await Promise.all([getDictionary(locale), getPost(locale, slug)]);
  if (!entry) notFound();
  const { post, folder, next, groupIndex, groupCount, pageIndex } = entry;

  return (
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
        `${dict.post.verdictLabel}: ${dict.post.verdict[post.verdict]}`,
        `${post.dateLabel} · ${post.minutes} ${dict.post.minutes}`,
      ]}
      quote={{ label: dict.post.testing, text: post.quote, by: post.quoteBy }}
      body={post.body}
      plate={`${dict.post.plate} — ${post.title} (${post.year})`}
      scrap={{
        note: post.excerpt,
        noteLabel: dict.post.noteLabel,
        stamp: dict.post.verdict[post.verdict],
        stampLabel: dict.post.verdictLabel,
      }}
      next={{
        href: `/${locale}/posts/${next.post.slug}`,
        title: `${next.post.title} (${next.post.year})`,
        category: next.folder.title,
        color: next.post.color,
        textColor: textOn(next.post.theme),
        label: dict.post.next,
        keep: dict.post.keepScrolling,
        sameGroup: next.folder.slug === folder.slug,
      }}
    />
  );
}
