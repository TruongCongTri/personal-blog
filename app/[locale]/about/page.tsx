import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import CaseFolder from "@/components/CaseFolder/CaseFolder";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.about.title };
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
      body={dict.about.body}
      plate={`${dict.post.plate} 00 — ${dict.about.tab}`}
      scrap={{
        note: dict.about.note,
        noteLabel: dict.post.noteLabel,
        stamp: "2026",
        stampLabel: dict.about.tab,
      }}
    />
  );
}
