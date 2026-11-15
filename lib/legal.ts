import { SITE_URL } from "@/lib/site";

/** Who to write to about privacy, rights or takedowns (set NEXT_PUBLIC_CONTACT_EMAIL). */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
/** The website host named in the privacy policy (set NEXT_PUBLIC_HOSTING_PROVIDER). */
export const HOSTING_PROVIDER = process.env.NEXT_PUBLIC_HOSTING_PROVIDER || "";

/** Fills the {contact}, {host} and {site} placeholders of the policy texts. */
export function fillLegal(text: string, fallbacks: { contact: string; host: string }) {
  return text
    .replaceAll("{contact}", CONTACT_EMAIL || fallbacks.contact)
    .replaceAll("{host}", HOSTING_PROVIDER || fallbacks.host)
    .replaceAll("{site}", SITE_URL.replace(/^https?:\/\//, ""));
}
