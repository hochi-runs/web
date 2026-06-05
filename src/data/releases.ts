/**
 * Hochi Runs release catalog.
 *
 * This is the single source of truth for the catalog. To add a release,
 * append an object to the `releases` array below — no code changes needed.
 * The catalog page and the per-release pages are generated from this data.
 *
 * Ordering: newest first (the list is rendered in array order).
 */

export type StreamingLink = {
  /** e.g. "Spotify", "Bandcamp", "SoundCloud", "Apple Music", "YouTube" */
  platform: string;
  url: string;
};

export type Track = {
  title: string;
  /** optional features / guests, e.g. "feat. DJ Swisha" */
  feat?: string;
};

export type Release = {
  /** Catalog code, e.g. "HR001". Used as the leading column in the list. */
  code: string;
  /** URL slug, e.g. "amal-hit-dat". Must be unique. */
  slug: string;
  artist: string;
  title: string;
  /** Release year, e.g. 2024 */
  year: number;
  /** Optional cover-art path under /public, e.g. "/covers/hr001.jpg" */
  cover?: string;
  /** Short blurb shown on the detail page */
  description?: string;
  tracklist?: Track[];
  links?: StreamingLink[];
};

export const releases: Release[] = [
  {
    code: "HR003",
    slug: "amal-hit-dat",
    artist: "AMAL",
    title: "Hit Dat",
    year: 2024,
    description:
      "Lead single from AMAL, featuring DJ Swisha. Shot by mr.davinse.",
    tracklist: [{ title: "Hit Dat", feat: "feat. DJ Swisha" }],
    links: [
      { platform: "YouTube", url: "https://www.youtube.com/watch?v=PNw4HJfsvUE" },
      { platform: "Bandcamp", url: "https://hochiruns.bandcamp.com/" },
      { platform: "SoundCloud", url: "https://soundcloud.com/hochiruns" },
    ],
  },
  {
    code: "HR002",
    slug: "hochi-runs-vol-2",
    artist: "Various Artists",
    title: "Hochi Runs, Vol. 2",
    year: 2024,
    description:
      "The second compilation from the collective — a placeholder entry. Replace with real metadata when ready.",
    tracklist: [
      { title: "Intro" },
      { title: "Run It Back" },
      { title: "Late Night" },
    ],
    links: [{ platform: "Bandcamp", url: "https://hochiruns.bandcamp.com/" }],
  },
  {
    code: "HR001",
    slug: "hochi-runs-vol-1",
    artist: "Various Artists",
    title: "Hochi Runs, Vol. 1",
    year: 2023,
    description:
      "The compilation that started the catalog — a placeholder entry. Replace with real metadata when ready.",
    tracklist: [{ title: "Opening" }, { title: "First Run" }],
    links: [
      { platform: "Bandcamp", url: "https://hochiruns.bandcamp.com/" },
      { platform: "SoundCloud", url: "https://soundcloud.com/hochiruns" },
    ],
  },
];

/** Look up a single release by its slug. */
export function getRelease(slug: string): Release | undefined {
  return releases.find((r) => r.slug === slug);
}
