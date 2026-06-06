"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { socials } from "@/data/site";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Fixed-corner chrome (year0001 / Surf Gang model): instead of a header bar
 * and footer bar, the navigation lives in the four corners of the viewport,
 * pinned with `position: fixed`. Only the page content scrolls behind it.
 *
 *   top-left     → logo
 *   top-right    → primary nav (Releases · Live · Shop) + mobile menu button
 *   bottom-left  → theme toggle (quiet)
 *   bottom-right → About · Legal · Contact
 *
 * On small screens the nav collapses into a single overlay menu so the fixed
 * corners never collide.
 */
const PRIMARY = [
  { label: "Artists", href: "/roster" },
  { label: "Releases", href: "/" },
  { label: "Live", href: "/shows" },
  { label: "Shop", href: "/merch" },
] as const;

const SECONDARY = [
  { label: "About", href: "/about" },
  { label: "Legal", href: "/legal" },
] as const;

export function SiteChrome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

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
          src="/logo.png"
          alt="Hochi Runs"
          width={75}
          height={63}
          className="w-[75px] dark:invert"
        />
      </Link>

      {/* Top-right: primary nav (desktop) */}
      <nav
        aria-label="Primary"
        className="fixed right-[20px] top-[20px] z-50 hidden items-center gap-[15px] text-xs uppercase tracking-widest sm:flex"
      >
        {PRIMARY.map((link) => {
          const active = link.href === pathname;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "text-foreground"
                  : "text-muted transition-colors hover:text-foreground"
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
        className="fixed right-[20px] top-[20px] z-50 text-xs uppercase tracking-widest text-foreground sm:hidden"
      >
        {menuOpen ? "Close" : "Menu"}
      </button>

      {/* Bottom-left: theme toggle (quiet) — DISABLED while site is light-only.
          Re-enable by removing `hidden` (and restoring themeScript in layout). */}
      <div className="fixed bottom-[20px] left-[20px] z-50 hidden">
        <ThemeToggle />
      </div>

      {/* Bottom-right: secondary nav */}
      <nav
        aria-label="Secondary"
        className="fixed bottom-[20px] right-[20px] z-50 hidden items-center gap-[15px] text-xs uppercase tracking-widest text-muted sm:flex"
      >
        {SECONDARY.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
        <a
          href="mailto:info@hochiruns.com"
          className="transition-colors hover:text-foreground"
        >
          Contact
        </a>
      </nav>

      {/* Mobile overlay menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-center gap-8 bg-background px-8 sm:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-5 text-sm uppercase tracking-widest">
            {[...PRIMARY, ...SECONDARY].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="mailto:info@hochiruns.com"
              className="text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </a>
          </nav>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs uppercase tracking-widest text-muted">
            {socials.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
