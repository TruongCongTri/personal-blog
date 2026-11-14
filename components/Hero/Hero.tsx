import type { Dictionary } from "@/i18n/dictionaries";
import SplitText from "@/components/SplitText/SplitText";
import DustField from "@/components/DustField/DustField";
import styles from "./Hero.module.css";

type Props = { dict: Dictionary["hero"] };

/** Centred title block. Its motion is driven by <Stack/> transitions. */
export default function Hero({ dict }: Props) {
  return (
    <section className={`container ${styles.hero}`} id="hero" data-hero>
      <DustField />
      <div className={styles.inner} data-preload>
        <h1 className={`heading-1 ${styles.title}`} data-hero-title>
          <SplitText text={dict.title} />
        </h1>
        <p className={`par-1 ${styles.desc}`} data-hero-desc>
          {dict.desc}
        </p>
      </div>
    </section>
  );
}
