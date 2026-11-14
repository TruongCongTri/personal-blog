import Link from "next/link";
import styles from "./not-found.module.css";

// Not-found boundaries don't receive params, so this page is bilingual.
export default function NotFound() {
  return (
    <section className={`container ${styles.wrap}`}>
      <p className={styles.code}>404</p>
      <h1 className={`heading-1 ${styles.title}`}>
        File missing
        <span lang="vi">Thất lạc hồ sơ</span>
      </h1>
      <Link href="/" className={styles.cta}>
        ← Cabinet / Tủ hồ sơ
      </Link>
    </section>
  );
}
