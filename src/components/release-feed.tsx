"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Release } from "@/data/releases";
import { getReleaseListenUrl } from "@/lib/release-links";
import { useSitePlayer } from "./site-player";
import { SiteContextLinks } from "./site-chrome";
import chromeStyles from "./site-chrome.module.css";
import styles from "./release-feed.module.css";

/**
 * The release archive view: a centered scrolling feed of album art with
 * titles revealed over the covers on hover/focus, plus two fixed edge rails:
 *   left edge  → format filters, About and Radio in one container
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
  const { playRelease } = useSitePlayer();
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
      {/* One fixed desktop rail owns the filters and site links together. */}
      <aside className={chromeStyles.archiveRail} aria-label="Release filters and site links">
        <nav aria-label="Release format">
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
                {f.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
        </nav>
        <SiteContextLinks />
      </aside>

      {/* Right edge: year index (fixed, desktop only) */}
      <aside className="corner-surface fixed right-[20px] top-1/2 z-40 hidden -translate-y-1/2 text-right lg:block">
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
              ALL
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
      <div className="reading-surface mx-auto mb-10 flex max-w-md flex-wrap items-center gap-x-4 gap-y-2 text-xs uppercase tracking-widest lg:hidden">
        {(["All", "Albums", "Singles"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFormat(f)}
            aria-pressed={format === f}
            className={format === f ? "text-accent" : "text-muted"}
          >
            {f.toUpperCase()}
          </button>
        ))}
        <span className="text-hairline">·</span>
        <button
          type="button"
          onClick={() => setYear("All")}
          aria-pressed={year === "All"}
          className={year === "All" ? "text-accent" : "text-muted"}
        >
          ALL YEARS
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
        <ul className={styles.feed}>
          {visible.map((release) => {
            const listenUrl = getReleaseListenUrl(release);
            return <li key={release.slug} className={styles.release}>
              <Link href={listenUrl ?? `/releases/${release.slug}`} className={styles.artworkLink}
                // onNavigate runs within the activation gesture, while leaving
                // modified/new-tab clicks free to follow the link normally.
                onNavigate={listenUrl ? () => playRelease(release.slug) : undefined}
                aria-label={listenUrl
                  ? `Play ${release.artist} — ${release.title} in the visualizer`
                  : `View release details and credits for ${release.artist} — ${release.title}`}>
                {release.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={release.cover} alt="" className={styles.image} />
                ) : (
                  <span className={styles.empty}>{release.code}</span>
                )}
              </Link>
              <div className={styles.details}>
                {/* The artwork link supplies the accessible name. Text clicks
                    pass through this transparent overlay to that same link. */}
                <span className={styles.metadata} aria-hidden="true">
                  <span className={styles.title}>{release.title}</span>
                  <span className={styles.artist}>{release.artist}</span>
                </span>
              </div>
            </li>;
          })}
        </ul>
      )}
    </>
  );
}
