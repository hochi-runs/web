"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialLinks } from "@/components/social-links";
import { useModalMenu } from "@/components/use-modal-menu";
import styles from "./site-chrome.module.css";

const PRIMARY = [
  { label: "Artists", href: "/roster" },
  { label: "Releases", href: "/" },
  { label: "Live", href: "/shows" },
] as const;
const SECONDARY = [
  { label: "About", href: "/about" },
  { label: "Legal", href: "/legal" },
  { label: "Contact", href: "/contact" },
] as const;

/** Expanded Radio keeps site links inside its existing INFO panel. */
export function RadioSiteInfo() {
  return <div className={styles.radioSiteInfo}>
    <nav aria-label="Site information">
      {SECONDARY.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
    </nav>
    <SocialLinks />
  </div>;
}

/** Shared contents; the archive places these inside its format-filter rail. */
export function SiteContextLinks() {
  const pathname = usePathname();
  return <div className={styles.contextGroup}>
    <nav aria-label="Explore Hochi Runs" className={styles.contextLinks}>
      <Link href="/about" aria-current={pathname === "/about" ? "page" : undefined}>About</Link>
      <Link href="/beta/radio">Radio</Link>
    </nav>
  </div>;
}

function Chrome({ logoUrl, radio, pathname }: { logoUrl?: string; radio: boolean; pathname: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const homeRef = useRef<HTMLAnchorElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useModalMenu(menuOpen, closeMenu, menuRef, menuButtonRef, homeRef);
  const secondary = radio ? SECONDARY : [{ label: "Radio", href: "/beta/radio" }, ...SECONDARY];
  const menuId = radio ? "radio-mobile-menu" : "archive-mobile-menu";

  return (
    <>
      <header className={`${styles.siteHeader} ${radio ? styles.radioChrome : styles.archiveChrome}`}
        data-menu-open={menuOpen ? "true" : undefined}>
        <Link ref={homeRef} href="/" aria-label="Hochi Runs home"
          className={`${styles.logo} transition-opacity hover:opacity-70`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl ?? (radio ? "/logo-radio.svg" : "/logo.svg")} alt="Hochi Runs" width={75} height={63} className="w-[75px]" />
        </Link>
        <nav aria-label="Primary" className={`${styles.primary} hidden items-center gap-[15px] text-xs uppercase tracking-widest sm:flex`}>
          {PRIMARY.map((link) => <Link key={link.href} href={link.href}
            aria-current={link.href === pathname ? "page" : undefined}
            className={link.href === pathname ? "text-accent" : "text-muted transition-colors hover:text-accent"}>{link.label}</Link>)}
        </nav>
        <button ref={menuButtonRef} type="button" onClick={() => setMenuOpen(true)}
          aria-label="Open menu" aria-expanded={menuOpen} aria-controls={menuId}
          className={`${styles.menuTrigger} text-xs uppercase tracking-widest text-foreground sm:hidden`}>Menu</button>
        {menuOpen && <div ref={menuRef} id={menuId} role="dialog" aria-modal="true" aria-label="Site menu" tabIndex={-1}
          className={`${styles.mobileMenu} fixed inset-0 flex flex-col gap-8 px-8 sm:hidden`}>
          <button type="button" onClick={closeMenu} aria-label="Close menu" className={`${styles.menuClose} text-xs uppercase tracking-widest text-foreground`}>Close</button>
          <nav aria-label="Mobile" className="flex flex-col gap-5 text-sm uppercase tracking-widest">
            {[...PRIMARY, ...secondary].map((link) => <Link key={link.href} href={link.href} onClick={closeMenu} className="text-foreground">{link.label}</Link>)}
          </nav>
          <SocialLinks className="corner-surface -ml-3 w-fit" onNavigate={closeMenu} />
        </div>}
      </header>
      {!radio && <aside className={`${styles.contextRail} ${pathname === "/" ? styles.homeContext : ""}`} aria-label="About Hochi Runs">
        <SiteContextLinks />
      </aside>}
    </>
  );
}

export function SiteChrome({ logoUrl, variant = "archive" }: { logoUrl?: string; variant?: "archive" | "radio" }) {
  const pathname = usePathname();
  if (variant === "archive" && pathname.startsWith("/beta/radio")) return null;
  // A route change unmounts the menu and runs its isolation/scroll cleanup.
  return <Chrome key={pathname} logoUrl={logoUrl} radio={variant === "radio"} pathname={pathname} />;
}
