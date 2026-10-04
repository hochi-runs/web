"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Release } from "@/data/releases";

/**
 * The release archive view: a centered scrolling feed of album art with
 * sparse captions, plus two fixed edge rails (year0001 model):
 *   left edge  → format filters (Albums / Singles)
 *   right edge → year index (also filters)
 * Both are pinned with position:fixed and reflect the active filter state.
 * On small screens the rails collapse into an inline filter bar above the feed.
 */
type FormatFilter = "All" | "Albums" | "Singles";

function matchesFormat(release: Release, filter: FormatFilter): boolean {
  if (filter === "All") return true;
  if (filter === "Albums")
    return release.format === "Album" || release.format === "Compilation";
  return release.format === "Single" || release.format === "EP";
}

export function ReleaseFeed({ releases }: { releases: Release[] }) {
  const [format, setFormat] = useState<FormatFilter>("All");
  const [year, setYear] = useState<number | "All">("All");

  const years = useMemo(
    () => [...new Set(releases.map((r) => r.year))].sort((a, b) => b - a),
    [releases],
  );

  const visible = useMemo(
    () =>
      releases.filter(
        (r) =>
          matchesFormat(r, format) && (year === "All" || r.year === year),
      ),
    [releases, format, year],
  );

  return (
    <>
      {/* Left edge: format filters (fixed, desktop only) */}
      <aside className="fixed left-[20px] top-1/2 z-40 hidden -translate-y-1/2 lg:block">
        <ul className="space-y-1.5 text-xs uppercase tracking-widest">
          {(["All", "Albums", "Singles"] as const).map((f) => (
            <li key={f}>
              <button
                type="button"
                onClick={() => setFormat(f)}
                aria-pressed={format === f}
                className={
                  format === f
                    ? "text-accent"
                    : "text-muted transition-colors hover:text-accent"
                }
              >
                {f}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right edge: year index (fixed, desktop only) */}
      <aside className="fixed right-[20px] top-1/2 z-40 hidden -translate-y-1/2 text-right lg:block">
        <ul className="space-y-1.5 font-mono text-xs">
          <li>
            <button
              type="button"
              onClick={() => setYear("All")}
              aria-pressed={year === "All"}
              className={
                year === "All"
                  ? "text-accent"
                  : "text-muted transition-colors hover:text-accent"
              }
            >
              All
            </button>
          </li>
          {years.map((y) => (
            <li key={y}>
              <button
                type="button"
                onClick={() => setYear(y)}
                aria-pressed={year === y}
                className={
                  year === y
                    ? "text-accent"
                    : "text-muted transition-colors hover:text-accent"
                }
              >
                {y}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Mobile filter bar (inline, above feed) */}
      <div className="mx-auto mb-10 flex max-w-md flex-wrap items-center gap-x-4 gap-y-2 text-xs uppercase tracking-widest lg:hidden">
        {(["All", "Albums", "Singles"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFormat(f)}
            aria-pressed={format === f}
            className={format === f ? "text-accent" : "text-muted"}
          >
            {f}
          </button>
        ))}
        <span className="text-hairline">·</span>
        <button
          type="button"
          onClick={() => setYear("All")}
          className={year === "All" ? "text-accent" : "text-muted"}
        >
          All yrs
        </button>
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setYear(y)}
            aria-pressed={year === y}
            className={year === y ? "text-accent" : "text-muted"}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Center feed */}
      {visible.length === 0 ? (
        <p className="text-center text-xs text-muted">
          No releases match these filters.
        </p>
      ) : (
        <ul className="mx-auto max-w-xl space-y-20">
          {visible.map((release) => (
            <li key={release.slug}>
              <Link href={`/releases/${release.slug}`} className="group block">
                <div className="aspect-square w-full overflow-hidden bg-surface">
                  {release.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={release.cover}
                      alt={`${release.artist} — ${release.title}`}
                      className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-muted">
                      {release.code}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-xs group-hover:underline">
                      {release.title}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {release.artist}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {release.code}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
