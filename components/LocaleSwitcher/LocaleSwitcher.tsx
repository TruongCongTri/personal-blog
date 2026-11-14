"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import styles from "./LocaleSwitcher.module.css";

type Props = { locale: Locale; label: string };

// Read by proxy.ts so bare URLs ("/") open in the last chosen language.
function rememberLocale(target: Locale) {
  document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=31536000; samesite=lax`;
}

export default function LocaleSwitcher({ locale, label }: Props) {
  const pathname = usePathname() ?? `/${locale}`;

  const hrefFor = (target: Locale) => {
    const parts = pathname.split("/");
    parts[1] = target;
    return parts.join("/") || `/${target}`;
  };

  return (
    <div className={styles.switcher} role="group" aria-label={label}>
      {locales.map((l) => (
        <Link
          key={l}
          href={hrefFor(l)}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          className={styles.option}
          onClick={() => rememberLocale(l)}
          scroll={false}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
