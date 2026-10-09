"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialLinks } from "@/components/social-links";
import styles from "./site-footer.module.css";

/** Site information remains in document flow, separate from the listening dock. */
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/beta/radio")) return null;

  return (
    <footer className={styles.footer} aria-label="Site information">
      <SocialLinks />
      <nav className={styles.legalLinks} aria-label="Legal and contact">
        <Link href="/legal" aria-current={pathname === "/legal" ? "page" : undefined}>Legal</Link>
        <Link href="/contact" aria-current={pathname === "/contact" ? "page" : undefined}>Contact</Link>
      </nav>
    </footer>
  );
}
