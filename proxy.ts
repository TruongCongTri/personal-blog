import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, locales, type Locale } from "./i18n/config";

const COOKIE = "NEXT_LOCALE";

function pickLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(COOKIE)?.value;
  if (saved && hasLocale(saved)) return saved;

  // Accept-Language: "vi-VN,vi;q=0.9,en;q=0.8" -> ["vi", "vi", "en"] sorted by q
  const header = request.headers.get("accept-language") ?? "";
  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of preferred) if (hasLocale(lang)) return lang;
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasPrefix) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes and any file with an extension (public assets).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
