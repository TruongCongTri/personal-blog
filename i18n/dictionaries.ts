import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "./config";
import type en from "./dictionaries/en.json";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  vi: () => import("./dictionaries/vi.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  "use cache";
  cacheTag("dictionaries", `dictionary:${locale}`);
  cacheLife("max");
  return dictionaries[locale]();
}