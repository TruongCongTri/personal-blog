"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { ALL, NONE, onOpenConsentSettings, setConsent, type Consent } from "@/lib/consent";
import { useConsent } from "./useConsent";
import styles from "./ConsentBanner.module.css";

type Props = { locale: Locale; dict: Dictionary["consent"]; legal: Dictionary["legal"] };

const subscribeNothing = () => () => {};

/**
 * Cookie & sound consent. Shown on the first visit (and again after 12
 * months), from the bottom of the screen without blocking the page:
 * Accept all · Choose · Reject all, with links to the policies. "Choose"
 * opens one switch per category, plus the two sound choices. The "Cookie
 * settings" links (footer, policies) reopen it at any time.
 *
 * Rejecting is as easy as accepting (one tap), nothing optional is pre-ticked,
 * and choices are only saved on a button press, as the GDPR and Vietnam's
 * PDP Law (Decree 356/2025: no consent by silence or default) require.
 */
export default function ConsentBanner({ locale, dict, legal }: Props) {
  const consent = useConsent();
  // Rendered on the client only: the server can't know the reader's choice.
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [reopened, setReopened] = useState(false);
  const [detail, setDetail] = useState(false);
  const [draft, setDraft] = useState<Consent>(NONE);
  const titleId = useId();

  useEffect(
    () =>
      onOpenConsentSettings(() => {
        setDraft({ preferences: consent.preferences, media: consent.media, autoplay: consent.autoplay, background: consent.background });
        setDetail(true);
        setReopened(true);
      }),
    [consent],
  );

  if (!mounted || (consent.decided && !reopened)) return null;

  const choose = (c: Consent) => {
    setConsent(c);
    setReopened(false);
    setDetail(false);
  };

  const rows: { key: keyof Consent | "necessary"; group: "cookies" | "sound" }[] = [
    { key: "necessary", group: "cookies" },
    { key: "preferences", group: "cookies" },
    { key: "media", group: "cookies" },
    { key: "autoplay", group: "sound" },
    { key: "background", group: "sound" },
  ];

  return (
    <section className={styles.banner} role="dialog" aria-modal="false" aria-labelledby={titleId} data-detail={detail}>
      <h2 id={titleId} className={styles.title}>
        {dict.title}
      </h2>

      {!detail ? (
        <p className={styles.text}>{dict.text}</p>
      ) : (
        <div className={styles.options}>
          {(["cookies", "sound"] as const).map((group) => (
            <fieldset key={group} className={styles.group}>
              <legend>{group === "cookies" ? dict.cookiesHeading : dict.soundHeading}</legend>
              {rows
                .filter((r) => r.group === group)
                .map(({ key }) => {
                  const fixed = key === "necessary";
                  const checked = fixed ? true : draft[key as keyof Consent];
                  return (
                    <label key={key} className={styles.option}>
                      <span>
                        <strong>{dict[key].title}</strong>
                        <small>{dict[key].text}</small>
                      </span>
                      {fixed ? (
                        <em className={styles.always}>{dict.always}</em>
                      ) : (
                        <input
                          type="checkbox"
                          role="switch"
                          className={styles.switch}
                          checked={checked}
                          onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
                        />
                      )}
                    </label>
                  );
                })}
            </fieldset>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={() => choose(NONE)}>
          {dict.rejectAll}
        </button>
        {detail ? (
          <button type="button" className={styles.secondary} onClick={() => choose(draft)}>
            {dict.save}
          </button>
        ) : (
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              setDraft(NONE);
              setDetail(true);
            }}
          >
            {dict.customize}
          </button>
        )}
        <button type="button" className={styles.primary} onClick={() => choose(ALL)}>
          {dict.acceptAll}
        </button>
      </div>

      <nav className={styles.links} aria-label={legal.privacy}>
        <Link href={`/${locale}/legal/privacy`}>{legal.privacy}</Link>
        <Link href={`/${locale}/legal/cookies`}>{legal.cookies}</Link>
        <Link href={`/${locale}/legal/terms`}>{legal.terms}</Link>
      </nav>
    </section>
  );
}
