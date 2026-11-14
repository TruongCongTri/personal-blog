import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Newsreader, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import SmoothScroll from "@/components/SmoothScroll/SmoothScroll";
import Header from "@/components/Header/Header";
import "../global.css";

// Free stand-ins with Vietnamese support: a sharp text serif for body copy,
// a bold grotesk for uppercase display, and a mono for labels.
const newsreader = Newsreader({
  subsets: ["latin", "vietnamese"],
  variable: "--font-newsreader",
  axes: ["opsz"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin", "vietnamese"],
  variable: "--font-hanken",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#191919",
  colorScheme: "dark",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: { default: dict.meta.title, template: `%s — ${dict.meta.title}` },
    description: dict.meta.description,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${newsreader.variable} ${hanken.variable} ${plexMono.variable}`}
    >
      <body>
        <noscript>
          <style>{`[data-preload]{opacity:1!important}[data-site-header]{transform:none!important}`}</style>
        </noscript>
        <a className="skip-link" href="#main">
          {dict.nav.skip}
        </a>
        <SmoothScroll />
        <Header locale={locale} dict={dict.nav} />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
