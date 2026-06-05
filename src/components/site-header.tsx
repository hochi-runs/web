import Link from "next/link";
import { navLinks } from "@/data/site";

/**
 * Minimal, year0001-style sticky header: wordmark on the left, plain text
 * nav on the right. Brand colours come from the global theme (red links,
 * yellow hover) so it stays consistent with the rest of the site.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-yellow/10 bg-black/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-5 py-4">
        <Link
          href="/"
          className="text-yellow! font-bold tracking-tight hover:text-red!"
          aria-label="Hochi Runs home"
        >
          HOCHI RUNS
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
