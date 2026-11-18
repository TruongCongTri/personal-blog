import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/i18n/config";
import { SITE_URL, AUTHOR, alternates, baseOpenGraph } from "@/lib/site";
import JsonLd from "@/components/JsonLd/JsonLd";
import { getDictionary } from "@/i18n/dictionaries";
import { getFolders } from "@/lib/content";
import Hero from "@/components/Hero/Hero";
import Stack from "@/components/Stack/Stack";
import styles from "./page.module.css";

// Allow blocking navigation so Stack's full DOM is present for GSAP folder transitions
export const instant = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: { absolute: `${dict.meta.title} — ${dict.meta.tagline}` },
    alternates: alternates(locale, ""),
    openGraph: {
      ...baseOpenGraph(locale, dict.meta.title),
      title: dict.meta.title,
      description: dict.meta.description,
      url: `/${locale}`,
    },
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  const [dict, folders] = await Promise.all([
    getDictionary(locale),
    getFolders(locale),
  ]);

  return (
    <div className={styles.home}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: dict.meta.title,
          description: dict.meta.description,
          url: `${SITE_URL}/${locale}`,
          inLanguage: locale,
          author: { "@type": "Person", name: AUTHOR },
          workTranslation: locales
            .filter((l) => l !== locale)
            .map((l) => ({ "@id": `${SITE_URL}/${l}` })),
          blogPost: folders.flatMap((f) =>
            f.posts.map((p) => ({
              "@type": "BlogPosting",
              headline: `${p.title} (${p.year})`,
              url: `${SITE_URL}/${locale}/posts/${p.slug}`,
              datePublished: p.date,
              about: {
                "@type": "Movie",
                name: p.title,
                director: { "@type": "Person", name: f.title },
              },
            })),
          ),
        }}
      />
      <Hero dict={dict.hero} />
      <Stack
        locale={locale}
        folders={folders}
        footer={dict.footer}
        aboutLabel={dict.nav.about}
      />
    </div>
  );
}