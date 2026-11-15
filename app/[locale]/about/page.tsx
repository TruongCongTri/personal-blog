import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import CaseFolder from "@/components/CaseFolder/CaseFolder";
import { scrapLabels } from "@/i18n/labels";
import { alternates, baseOpenGraph } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.about.title,
    description: dict.about.body[1],
    alternates: alternates(locale, "/about"),
    openGraph: {
      ...baseOpenGraph(locale, dict.meta.title), title: dict.about.title, description: dict.about.body[1], url: `/${locale}/about` },
  };
}

/** About is filed like everything else: a single folder of its own. */
export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const color = "#1E4BD7";

  return (
    <CaseFolder
      locale={locale}
      path={`/${locale}/about`}
      title={dict.about.title}
      color={color}
      coverColor={color}
      textColor="#fff"
      groupIndex={-1}
      groupCount={0}
      tags={[{ label: dict.about.tab, href: `/${locale}/about`, color, textColor: "#fff", active: true }]}
      info={dict.about.info}
      body={dict.about.body.map((text) => ({ type: "p" as const, text }))}
      links={{
        label: dict.legal.privacy,
        items: [
          { href: `/${locale}/legal/privacy`, label: dict.legal.privacy },
          { href: `/${locale}/legal/terms`, label: dict.legal.terms },
          { href: `/${locale}/legal/cookies`, label: dict.legal.cookies },
        ],
        settings: dict.legal.settings,
      }}
      plate={`${dict.post.plate} 00 — ${dict.about.tab}`}
      scrap={{
        scraps: [
          { type: "note", text: dict.about.note, place: { x: 4, y: -4 } },
          { type: "stamp", label: dict.about.tab, text: "2026", place: { x: 60, y: 4 } },
          { type: "sticker", shape: "badge", icon: "clapper", text: dict.meta.title, place: { x: 40, y: 14 } },
          { type: "ruler", place: { x: 20, y: 18, mobile: false } },
        ],
        desk: 24,
        labels: scrapLabels(dict),
      }}
    />
  );
}
