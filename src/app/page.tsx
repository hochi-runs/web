import Link from "next/link";
import { releases } from "@/data/releases";

/**
 * Home = the release catalog. A long, scannable, chronological list in the
 * year0001 spirit: catalog code · artist · title · year, each row a link to
 * the release's own page. Type-driven, minimal, lots of whitespace.
 */
export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="text-yellow text-3xl font-bold tracking-tight sm:text-4xl">
        ⇼ Releases ⇼
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        The Hochi Runs catalog — newest first. Select a release for tracklist
        and streaming links.
      </p>

      <ul className="mt-10 divide-y divide-yellow/10 border-t border-yellow/10">
        {releases.map((release) => (
          <li key={release.slug}>
            <Link
              href={`/releases/${release.slug}`}
              className="group grid grid-cols-[4.5rem_1fr_auto] items-baseline gap-4 py-4 text-yellow! hover:text-yellow!"
            >
              <span className="font-mono text-xs text-muted group-hover:text-red">
                {release.code}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold group-hover:underline">
                  {release.artist}
                </span>
                <span className="block truncate text-sm text-muted">
                  {release.title}
                </span>
              </span>
              <span className="font-mono text-xs text-muted">
                {release.year}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
