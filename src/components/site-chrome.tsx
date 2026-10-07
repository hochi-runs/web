"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialLinks } from "@/components/social-links";
import { ThemeToggle } from "@/components/theme-toggle";
import styles from "./site-chrome.module.css";

/**
 * Fixed-corner chrome (year0001 / Surf Gang model): instead of a header bar
 * and footer bar, the navigation lives in the four corners of the viewport,
 * pinned with `position: fixed`. Only the page content scrolls behind it.
 *
 *   top-left     → logo
 *   top-right    → primary nav (Releases · Live · Shop) + mobile menu button
 *   bottom-left  → label social profiles
 *   bottom-right → About · Legal · Contact
 *
 * On small screens the nav collapses into a single overlay menu so the fixed
 * corners never collide.
 */
type NavigationItem = {
  label: string;
  href: string;
  disabled?: boolean;
};

const PRIMARY: readonly NavigationItem[] = [
  { label: "Artists", href: "/roster" },
  { label: "Releases", href: "/" },
  { label: "Live", href: "/shows" },
  { label: "Shop", href: "/merch", disabled: true },
];

const SECONDARY: readonly NavigationItem[] = [
  { label: "About", href: "/about" },
  { label: "Legal", href: "/legal" },
  { label: "Contact", href: "/contact" },
];

function RadioSiteChrome({ logoUrl }: { logoUrl?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const chromeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!menuOpen) return;
    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    // Radio chrome lives inside the radio scene, so inert only its siblings;
    // making the page's <main> inert would also disable this menu.
    const siblings = Array.from(chromeRef.current?.parentElement?.children ?? [])
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== chromeRef.current)
      .map((element) => ({ element, inert: element.inert }));
    siblings.forEach(({ element }) => { element.inert = true; });
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();

    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const targets = menuRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!targets?.length) return;
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const desktop = window.matchMedia("(min-width: 640px)");
    function resize(event: MediaQueryListEvent) {
      if (event.matches) setMenuOpen(false);
    }
    document.addEventListener("keydown", keydown);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", keydown);
      desktop.removeEventListener("change", resize);
      siblings.forEach(({ element, inert }) => { element.inert = inert; });
      document.body.style.overflow = previousOverflow;
      if (!desktop.matches) menuButton?.focus();
    };
  }, [menuOpen]);

  return (
    <div ref={chromeRef} className={styles.radioChrome}>
      <Link
        href="/"
        aria-label="Hochi Runs home"
        inert={menuOpen}
        className={`${styles.radioLogo} fixed left-[20px] top-[5px] z-50 transition-opacity hover:opacity-70 sm:top-[17px]`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl ?? "/logo.png"} alt="Hochi Runs" width={75} height={63} className="w-[75px]" />
      </Link>

      <nav
        aria-label="Primary"
        className="corner-surface fixed right-[20px] top-[20px] z-50 hidden items-center gap-[15px] text-xs uppercase tracking-widest sm:flex"
      >
        {PRIMARY.map((link) => link.disabled ? (
          <span key={link.href} role="link" aria-disabled="true" title="Shop is not available yet" className="cursor-default text-muted opacity-50">
            {link.label}
          </span>
        ) : (
          <Link key={link.href} href={link.href} className={link.href === pathname ? "text-accent" : "text-muted transition-colors hover:text-accent"}>
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        ref={menuButtonRef}
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        aria-controls="radio-mobile-menu"
        disabled={menuOpen}
        className={`corner-surface fixed right-[20px] top-[20px] z-50 text-xs uppercase tracking-widest text-foreground sm:hidden ${menuOpen ? "invisible" : ""}`}
      >
        Menu
      </button>

      <SocialLinks className={`${styles.radioSocials} corner-surface fixed bottom-[16px] left-[16px] z-50 hidden sm:block`} />
      <nav
        aria-label="Secondary"
        className={`${styles.radioSecondary} corner-surface fixed bottom-[20px] right-[20px] z-50 hidden items-center gap-[15px] text-xs uppercase tracking-widest text-muted sm:flex`}
      >
        {SECONDARY.map((link) => (
          <Link key={link.href} href={link.href} className="transition-colors hover:text-accent">{link.label}</Link>
        ))}
      </nav>

      {menuOpen && (
        <div ref={menuRef} id="radio-mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu" className={`${styles.radioMenu} fixed inset-0 z-40 flex flex-col justify-center gap-8 px-8 sm:hidden`}>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="fixed right-[20px] top-[20px] text-xs uppercase tracking-widest text-foreground">
            Close
          </button>
          <nav aria-label="Mobile" className="flex flex-col gap-5 text-sm uppercase tracking-widest">
            {[...PRIMARY, ...SECONDARY].map((link) => link.disabled ? (
              <span key={link.href} role="link" aria-disabled="true" title="Shop is not available yet" className="cursor-default text-muted opacity-50">{link.label}</span>
            ) : (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="text-foreground">{link.label}</Link>
            ))}
          </nav>
          <SocialLinks className="corner-surface -ml-3 w-fit" onNavigate={() => setMenuOpen(false)} />
        </div>
      )}
    </div>
  );
}

export function SiteChrome({ logoUrl, variant = "archive" }: { logoUrl?: string; variant?: "archive" | "radio" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  if (variant === "radio") return <RadioSiteChrome logoUrl={logoUrl} />;
  if (pathname.startsWith("/beta/radio")) return null;

  return (
    <>
      {/* Top-left: logo */}
      <Link
        href="/"
        onClick={() => setMenuOpen(false)}
        aria-label="Hochi Runs home"
        className="fixed left-[20px] top-[5px] z-50 transition-opacity hover:opacity-70 sm:top-[17px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl ?? "/logo.png"}
          alt="Hochi Runs"
          width={75}
          height={63}
          className="w-[75px] dark:invert"
        />
      </Link>

      {/* Top-right: primary nav (desktop) */}
      <nav
        aria-label="Primary"
        className="corner-surface fixed right-[20px] top-[20px] z-50 hidden items-center gap-[15px] text-xs uppercase tracking-widest sm:flex"
      >
        {PRIMARY.map((link) => {
          if (link.disabled) {
            return (
              <span
                key={link.href}
                role="link"
                aria-disabled="true"
                title="Shop is not available yet"
                className="cursor-default text-muted opacity-50"
              >
                {link.label}
              </span>
            );
          }
          const active = link.href === pathname;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "text-accent"
                  : "text-muted transition-colors hover:text-accent"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Top-right: mobile menu button */}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        className="corner-surface fixed right-[20px] top-[20px] z-50 text-xs uppercase tracking-widest text-foreground sm:hidden"
      >
        {menuOpen ? "Close" : "Menu"}
      </button>

      {/* Bottom-left: theme toggle (quiet) — DISABLED while site is light-only.
          Re-enable by removing `hidden` (and restoring themeScript in layout). */}
      <div className="fixed bottom-[20px] left-[20px] z-50 hidden">
        <ThemeToggle />
      </div>

      {/* Bottom-left: social profiles (desktop) */}
      <SocialLinks className="corner-surface fixed bottom-[16px] left-[16px] z-50 hidden sm:block" />

      {/* Bottom-right: secondary nav */}
      <nav
        aria-label="Secondary"
        className="corner-surface fixed bottom-[20px] right-[20px] z-50 hidden items-center gap-[15px] text-xs uppercase tracking-widest text-muted sm:flex"
      >
        {SECONDARY.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-accent"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Mobile overlay menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-center gap-8 bg-background px-8 sm:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-5 text-sm uppercase tracking-widest">
            {[...PRIMARY, ...SECONDARY].map((link) =>
              link.disabled ? (
                <span
                  key={link.href}
                  role="link"
                  aria-disabled="true"
                  title="Shop is not available yet"
                  className="cursor-default text-muted opacity-50"
                >
                  {link.label}
                </span>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-foreground"
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>
          <SocialLinks
            className="corner-surface -ml-3 w-fit"
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
      )}
    </>
  );
}
