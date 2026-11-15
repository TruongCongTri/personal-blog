import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { preconnect } from "react-dom";
import { Newsreader, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import SmoothScroll from "@/components/SmoothScroll/SmoothScroll";
import Header from "@/components/Header/Header";
import { SITE_URL, AUTHOR, baseOpenGraph } from "@/lib/site";
import Cursor from "@/components/Cursor/Cursor";
import { AudioProvider } from "@/components/Audio/AudioProvider";
import AudioControl from "@/components/Audio/AudioControl";
import ConsentBanner from "@/components/Consent/ConsentBanner";
import { liteScript } from "@/lib/perf";
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
    metadataBase: new URL(SITE_URL),
    title: { default: dict.meta.title, template: `%s — ${dict.meta.title}` },
    description: dict.meta.description,
    applicationName: dict.meta.title,
    authors: [{ name: AUTHOR }],
    creator: AUTHOR,
    keywords: dict.meta.keywords,
    openGraph: { type: "website", ...baseOpenGraph(locale, dict.meta.title) },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    appleWebApp: { capable: true, title: dict.meta.title, statusBarStyle: "black-translucent" },
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

  // Soundtracks and images stream from R2: open that connection (DNS + TLS)
  // while the page loads, so the first note doesn't wait for it.
  const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (r2) preconnect(new URL(r2).origin);

  return (
    <html
      lang={locale}
      className={`${newsreader.variable} ${hanken.variable} ${plexMono.variable}`}
      // lite / mouse / ready flags are added to <html> before hydration
      suppressHydrationWarning
    >
      <body>
        {/* Flags weak devices and mouse users before the first paint (see lib/perf.ts). */}
        <script dangerouslySetInnerHTML={{ __html: liteScript }} />
        <noscript>
          <style>{`[data-preload]{opacity:1!important}[data-site-header]{transform:none!important}`}</style>
        </noscript>
        <a className="skip-link" href="#main">
          {dict.nav.skip}
        </a>
        <SmoothScroll />
        <Cursor labels={dict.cursor} />
        {/* One audio element for the whole visit: the soundtrack of the open folder. */}
        <AudioProvider>
          <Header locale={locale} dict={dict.nav} />
          <main id="main">{children}</main>
          <AudioControl labels={dict.audio} />
          <ConsentBanner locale={locale} dict={dict.consent} legal={dict.legal} />
        </AudioProvider>
      </body>
    </html>
  );
}
