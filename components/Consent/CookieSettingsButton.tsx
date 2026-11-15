"use client";

import { openConsentSettings } from "@/lib/consent";

/** Reopens the cookie & sound choices. */
export default function CookieSettingsButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" className={className} onClick={openConsentSettings}>
      {label}
    </button>
  );
}
