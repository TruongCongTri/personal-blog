import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ogCard, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Film Files";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(hasLocale(locale) ? locale : "en");
  return ogCard({
    kicker: dict.post.testing,
    title: dict.meta.title,
    quote: dict.about.note,
    color: "#0C7866",
    ink: "#fff",
    site: dict.meta.title,
  });
}
