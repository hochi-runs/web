"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialLinks } from "@/components/social-links";

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
const PRIMARY = [
  { label: "Artists", href: "/roster" },
  { label: "Releases", href: "/" },
  { label: "Live", href: "/shows" },
  { label: "Shop", href: "/merch" },
] as const;

const SECONDARY = [
  { label: "About", href: "/about" },
  { label: "Legal", href: "/legal" },
  { label: "Contact", href: "/contact" },
] as const;

function currentSection(pathname: string, href: string): "page" | "location" | undefined {
  if (pathname === href) return "page";
  if (href === "/") return pathname.startsWith("/releases/") ? "location" : undefined;
  return pathname.startsWith(`${href}/`) ? "location" : undefined;
}

export function SiteChrome({ logoUrl }: { logoUrl?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);

  function closeMenu() {
    dialogRef.current?.close();
    setMenuOpen(false);
  }

  function handleDialogClose() {
    setMenuOpen(false);
    const target = window.matchMedia("(min-width: 640px)").matches ? logoRef.current : triggerRef.current;
    target?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!menuOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const body = document.body;
    const previousOverflow = body.style.getPropertyValue("overflow");
    const previousPriority = body.style.getPropertyPriority("overflow");
    const desktop = window.matchMedia("(min-width: 640px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) dialog.close();
    };

    // showModal supplies native focus containment, Escape dismissal, and background isolation.
    if (!dialog.open) dialog.showModal();
    body.style.setProperty("overflow", "hidden");
    dialog.querySelector<HTMLAnchorElement>('nav[aria-label="Mobile"] a')?.focus();
    desktop.addEventListener("change", closeOnDesktop);
    if (desktop.matches) dialog.close();

    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      if (dialog.open) dialog.close();
      if (previousOverflow) body.style.setProperty("overflow", previousOverflow, previousPriority);
      else body.style.removeProperty("overflow");
    };
  }, [menuOpen]);

  useEffect(() => {
    // Also dismiss on history navigation, not only clicks inside the menu.
    if (dialogRef.current?.open) dialogRef.current.close();
  }, [pathname]);

  return (
    <>
      {/* Top-left: logo */}
      <Link
        ref={logoRef}
        href="/"
        onClick={closeMenu}
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
          const current = currentSection(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={current}
              data-active={Boolean(current)}
              className="nav-link"
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Top-right: mobile menu button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        className="mobile-menu-trigger corner-surface fixed right-[20px] top-[20px] z-50 text-xs uppercase tracking-widest text-foreground sm:hidden"
      >
        Menu
      </button>

      {/* Bottom-left: social profiles (desktop) */}
      <SocialLinks className="corner-surface fixed bottom-[16px] left-[16px] z-50 hidden sm:block" />

      {/* Bottom-right: secondary nav */}
      <nav
        aria-label="Secondary"
        className="corner-surface fixed bottom-[20px] right-[20px] z-50 hidden items-center gap-[15px] text-xs uppercase tracking-widest text-muted sm:flex"
      >
        {SECONDARY.map((link) => {
          const current = currentSection(pathname, link.href);
          return (
            <Link key={link.href} href={link.href} aria-current={current} data-active={Boolean(current)} className="nav-link">
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* The modal keeps its own corner controls in the native top layer. */}
      <dialog ref={dialogRef} id="mobile-navigation" className="mobile-menu" aria-label="Site navigation" onClose={handleDialogClose}>
        <Link
          href="/"
          onClick={closeMenu}
          aria-label="Hochi Runs home"
          className="fixed left-[20px] top-[5px] transition-opacity hover:opacity-70"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl ?? "/logo.png"} alt="Hochi Runs" width={75} height={63} className="w-[75px] dark:invert" />
        </Link>
        <button
          type="button"
          onClick={closeMenu}
          aria-label="Close menu"
          className="mobile-menu-close fixed right-[20px] top-[20px] flex h-11 min-w-11 items-center justify-end text-xs uppercase tracking-widest text-foreground"
        >
          Close
        </button>
        <nav aria-label="Mobile" className="flex flex-col gap-2 text-sm uppercase tracking-widest">
          {[...PRIMARY, ...SECONDARY].map((link) => {
            const current = currentSection(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                aria-current={current}
                data-active={Boolean(current)}
                className="nav-link flex min-h-11 w-fit items-center"
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <SocialLinks className="corner-surface -ml-3 w-fit" onNavigate={closeMenu} />
      </dialog>
    </>
  );
}
