"use client";

import { useMemo, useSyncExternalStore } from "react";
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
const FILTER_EVENT = "hochi:archive-filter";

function subscribeToFilters(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(FILTER_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(FILTER_EVENT, onChange);
  };
}

function getFilterSnapshot() {
  return window.location.search;
}

function getServerFilterSnapshot() {
  return "";
}

function matchesFormat(release: Release, filter: FormatFilter): boolean {
  if (filter === "All") return true;
  if (filter === "Albums")
    return release.format === "Album" || release.format === "Compilation";
  return release.format === "Single" || release.format === "EP";
}

export function ReleaseFeed({ releases }: { releases: Release[] }) {
  const search = useSyncExternalStore(
    subscribeToFilters,
    getFilterSnapshot,
    getServerFilterSnapshot,
  );
  const params = new URLSearchParams(search);
  const requestedFormat = params.get("format");
  const format: FormatFilter = requestedFormat === "Albums" || requestedFormat === "Singles"
    ? requestedFormat : "All";

  const years = useMemo(
    () => [...new Set(releases.map((r) => r.year))].sort((a, b) => b - a),
    [releases],
  );
  const requestedYear = Number(params.get("year"));
  const year: number | "All" = years.includes(requestedYear) ? requestedYear : "All";
  const filtered = format !== "All" || year !== "All";

  function updateFilters(nextFormat: FormatFilter, nextYear: number | "All") {
    const url = new URL(window.location.href);
    if (nextFormat === "All") url.searchParams.delete("format");
    else url.searchParams.set("format", nextFormat);
    if (nextYear === "All") url.searchParams.delete("year");
    else url.searchParams.set("year", String(nextYear));
    if (url.search !== window.location.search) {
      window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
      window.dispatchEvent(new Event(FILTER_EVENT));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  const visible = useMemo(
    () =>
      releases.filter(
        (r) =>
          matchesFormat(r, format) && (year === "All" || r.year === year),
      ),
    [releases, format, year],
  );

  return (
    <section aria-label="Release archive">
      <h1 className="sr-only">Hochi Runs release archive</h1>
      {/* Left edge: format filters (fixed, desktop only) */}
      <aside aria-label="Release format" className="corner-surface fixed left-[20px] top-1/2 z-40 hidden -translate-y-1/2 lg:block">
        <p className="archive-filter-heading">Format</p>
        <ul className="text-xs uppercase tracking-widest">
          {(["All", "Albums", "Singles"] as const).map((f) => (
            <li key={f}>
              <button
                type="button"
                onClick={() => updateFilters(f, year)}
                aria-pressed={format === f}
                className="archive-filter"
              >
                {f}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right edge: year index (fixed, desktop only) */}
      <aside aria-label="Release year" className="corner-surface fixed right-[20px] top-1/2 z-40 hidden -translate-y-1/2 text-right lg:block">
        <p className="archive-filter-heading">Year</p>
        <ul className="font-mono text-xs">
          <li>
            <button
              type="button"
              onClick={() => updateFilters(format, "All")}
              aria-pressed={year === "All"}
              className="archive-filter"
            >
              All
            </button>
          </li>
          {years.map((y) => (
            <li key={y}>
              <button
                type="button"
                onClick={() => updateFilters(format, y)}
                aria-pressed={year === y}
                className="archive-filter"
              >
                {y}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Mobile filter bar (inline, above feed) */}
      <div className="archive-mobile-filters archive-width lg:hidden">
        <div role="group" aria-label="Release format" className="flex items-center gap-2 text-xs uppercase tracking-widest">
        {(["All", "Albums", "Singles"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => updateFilters(f, year)}
            aria-pressed={format === f}
            className="archive-filter"
          >
            {f}
          </button>
        ))}
        </div>
        <div role="group" aria-label="Release year" className="flex items-center gap-2 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => updateFilters(format, "All")}
          aria-pressed={year === "All"}
          className="archive-filter shrink-0"
        >
          All yrs
        </button>
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => updateFilters(format, y)}
            aria-pressed={year === y}
            className="archive-filter shrink-0"
          >
            {y}
          </button>
        ))}
        </div>
      </div>

      <div className="archive-width archive-summary">
        <span className="uppercase tracking-widest">Catalog</span>
        <div className="flex items-center gap-4">
          {filtered && (
            <button type="button" onClick={() => updateFilters("All", "All")} className="archive-clear">
              Clear filters
            </button>
          )}
          <p role="status" aria-live="polite" aria-atomic="true">
            {visible.length} {visible.length === 1 ? "release" : "releases"}
          </p>
        </div>
      </div>

      {/* Center feed */}
      {visible.length === 0 ? (
        <p className="archive-width archive-empty text-center text-sm text-muted">
          No releases match these filters.
        </p>
      ) : (
        <ul className="archive-width space-y-16 sm:space-y-24">
          {visible.map((release, index) => (
            <li key={release.slug} className="archive-entry">
              <Link href={`/releases/${release.slug}`} aria-label={`${release.artist} — ${release.title}`} className="group block">
                <div className="relative aspect-square w-full overflow-hidden bg-surface">
                  {release.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={release.cover}
                      alt={`${release.artist} — ${release.title}`}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                      className="artwork-image h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-muted">
                      {release.code}
                    </div>
                  )}
                  <span aria-hidden="true" className="artwork-cue">↗</span>
                </div>
                <div className="release-caption flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="archive-title">
                      {release.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {release.artist}
                    </p>
                  </div>
                  <span className="max-w-[38%] shrink-0 break-words text-right text-[10px] tracking-wide text-muted">
                    {release.code}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
