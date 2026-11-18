import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  LEGAL,
  LEGAL_DOCS,
  LEGAL_UPDATED,
  type LegalBlock,
  type LegalDocId,
} from "@/i18n/legal";
import { CONTACT_EMAIL, fillLegal } from "@/lib/legal";
import { DISCOGRAPHY } from "@/lib/discography";
import { getFolders } from "@/lib/content";
import { alternates, baseOpenGraph } from "@/lib/site";
import CookieSettingsButton from "@/components/Consent/CookieSettingsButton";
import styles from "@/components/LegalDoc/LegalDoc.module.css";

// Allow blocking route navigation when reading params outside of <Suspense>
export const instant = false;

const isDoc = (d: string): d is LegalDocId =>
  (LEGAL_DOCS as readonly string[]).includes(d);

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    LEGAL_DOCS.map((doc) => ({ locale, doc })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/legal/[doc]">): Promise<Metadata> {
  const { locale, doc } = await params;
  if (!hasLocale(locale) || !isDoc(doc)) return {};
  const dict = await getDictionary(locale);
  const d = LEGAL[locale][doc];
  return {
    title: d.title,
    description: d.description,
    alternates: alternates(locale, `/legal/${doc}`),
    openGraph: {
      ...baseOpenGraph(locale, dict.meta.title),
      title: d.title,
      description: d.description,
      url: `/${locale}/legal/${doc}`,
    },
  };
}

/** Privacy Policy, Cookie Policy and Terms of Use, typed on a plain sheet. */
export default async function LegalPage({
  params,
}: PageProps<"/[locale]/legal/[doc]">) {
  const { locale, doc } = await params;
  if (!hasLocale(locale) || !isDoc(doc)) notFound();

  const [dict, folders] = await Promise.all([
    getDictionary(locale),
    getFolders(locale),
  ]);
  const d = LEGAL[locale][doc];

  // Object photos and their credits, from the reviews
  const credits = folders
    .flatMap((f) => f.posts)
    .flatMap((p) =>
      p.object && typeof p.object === "object" && p.object.credit
        ? [{ film: `${p.title} (${p.year})`, ...p.object }]
        : [],
    );
  const fill = (t: string) =>
    fillLegal(t, {
      contact: dict.legal.contactFallback,
      host: dict.legal.hostFallback,
    });
  const date = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(LEGAL_UPDATED));

  const block = (b: LegalBlock, i: number) => {
    if (typeof b === "string") return <p key={i}>{fill(b)}</p>;
    if ("credits" in b)
      return (
        <ul key={i}>
          {credits.map((c) => (
            <li key={c.film}>
              <em>{c.film}</em> — {c.title}:{" "}
              {c.url ? (
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  {c.credit}
                </a>
              ) : (
                c.credit
              )}
            </li>
          ))}
        </ul>
      );
    if ("music" in b)
      return (
        <ul key={i}>
          {/* Only songs that actually play somewhere: a review's folder, or a page. */}
          {DISCOGRAPHY.filter((a) => a.postSlug || a.pages?.length).flatMap(
            (album) =>
              album.tracks.map((t) => (
                <li key={t.id}>
                  “{t.title}” — <em>{album.title}</em>
                </li>
              )),
          )}
        </ul>
      );
    if ("list" in b)
      return (
        <ul key={i}>
          {b.list.map((li, j) => (
            <li key={j}>{fill(li)}</li>
          ))}
        </ul>
      );
    return (
      <div key={i} className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              {b.table.head.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} data-label={b.table.head[c]}>
                    {fill(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <article className={`container ${styles.page}`}>
      <nav className={styles.tabs} aria-label={dict.legal.privacy}>
        {LEGAL_DOCS.map((id) => (
          <Link
            key={id}
            href={`/${locale}/legal/${id}`}
            aria-current={id === doc ? "page" : undefined}
          >
            {LEGAL[locale][id].title}
          </Link>
        ))}
      </nav>

      <div className={styles.sheet}>
        <header className={styles.head}>
          <h1>{d.title}</h1>
          <p className={styles.updated}>
            {dict.legal.updated}: <time dateTime={LEGAL_UPDATED}>{date}</time>
          </p>
        </header>

        {d.sections.map((s) => (
          <section key={s.h} className={styles.section}>
            <h2>{s.h}</h2>
            {s.body.map(block)}
          </section>
        ))}

        <footer className={styles.foot}>
          <CookieSettingsButton
            label={dict.legal.settings}
            className={styles.settings}
          />
          {CONTACT_EMAIL && (
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          )}
        </footer>
      </div>
    </article>
  );
}