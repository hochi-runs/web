import { socials } from "@/data/site";

/**
 * Sparse footer echoing the original site: tagline, social links, copyright.
 */
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-yellow/10">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="uppercase tracking-widest text-yellow">
          Label · Collective · Agency
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {socials.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto max-w-5xl px-5 pb-10 text-xs text-muted">
        hochiruns.com ©© {new Date().getFullYear()} — all rights reserved
      </div>
    </footer>
  );
}
