import { locales, defaultLocale, type Locale } from "@/i18n/config";

/**
 * The public address of the site, used for canonical URLs, the sitemap and
 * social cards. Set NEXT_PUBLIC_SITE_URL in production (no trailing slash).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const AUTHOR = "Film Files";

export const ogLocale: Record<Locale, string> = { vi: "vi_VN", en: "en_US" };

/** `path` without the locale prefix, e.g. "" or "/posts/warfare-2025". */
export function alternates(locale: Locale, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
      "x-default": `/${defaultLocale}${path}`,
    },
  };
}

/**
 * Open Graph fields every page shares. A page's `openGraph` replaces the
 * layout's wholesale (no deep merge), so pages spread this in.
 */
export function baseOpenGraph(locale: Locale, siteName: string) {
  return {
    siteName,
    locale: ogLocale[locale],
    alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
  };
}
