import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getFolders } from "@/lib/content";
import Hero from "@/components/Hero/Hero";
import Stack from "@/components/Stack/Stack";
import styles from "./page.module.css";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  const [dict, folders] = await Promise.all([getDictionary(locale), getFolders(locale)]);

  return (
    <div className={styles.home}>
      <Hero dict={dict.hero} />
      <Stack locale={locale} folders={folders} footer={dict.footer} aboutLabel={dict.nav.about} />
    </div>
  );
}
