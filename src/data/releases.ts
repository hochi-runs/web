/**
 * Hochi Runs release catalog.
 *
 * Imported from hochiruns.bandcamp.com (covers in /public/covers). Catalog
 * codes run HR020 (newest) → HR001 (oldest). To add a release, append an
 * object below — the index, feed, and per-release pages generate from this.
 *
 * Ordering: newest first (rendered in array order).
 */

export type StreamingLink = {
  /** e.g. "Spotify", "Bandcamp", "SoundCloud", "Apple Music", "YouTube" */
  platform: string;
  url: string;
};

export type Track = {
  title: string;
  feat?: string;
  duration?: string;
};

export type Credit = {
  role: string;
  name: string;
};

export type ReleaseFormat = "Album" | "Single" | "EP" | "Compilation";

export type Release = {
  code: string;
  slug: string;
  artist: string;
  title: string;
  year: number;
  format: ReleaseFormat;
  date?: string;
  cover?: string;
  description?: string;
  tracklist?: Track[];
  credits?: Credit[];
  links?: StreamingLink[];
  buyUrl?: string;
  tags?: string[];
  memberSlugs?: string[];
};

export const releases: Release[] = [
  {
    code: "HR020",
    slug: "like-dat-riddim",
    artist: "Amal",
    title: "like dat riddim",
    year: 2026,
    format: "Single",
    date: "01 May 2026",
    cover: "/covers/like-dat-riddim.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/track/like-dat-riddim" }],
    buyUrl: "https://amaldc.bandcamp.com/track/like-dat-riddim",
  },
  {
    code: "HR019",
    slug: "sirene-fdp-2",
    artist: "Rxfx, NOTRN",
    title: "SIRENE FDP 2",
    year: 2026,
    format: "Single",
    date: "24 Apr 2026",
    cover: "/covers/sirene-fdp-2.jpg",
    links: [{ platform: "Bandcamp", url: "https://hochiruns.bandcamp.com/track/sirene-fdp-2" }],
    buyUrl: "https://hochiruns.bandcamp.com/track/sirene-fdp-2",
  },
  {
    code: "HR018",
    slug: "losing-sleep",
    artist: "whoisgeno",
    title: "LOSING SLEEP",
    year: 2026,
    format: "Album",
    date: "03 Apr 2026",
    cover: "/covers/losing-sleep.jpg",
    links: [{ platform: "Bandcamp", url: "https://hochiruns.bandcamp.com/album/losing-sleep" }],
    buyUrl: "https://hochiruns.bandcamp.com/album/losing-sleep",
  },
  {
    code: "HR017",
    slug: "sneaky-link",
    artist: "Amal",
    title: "sneaky link",
    year: 2026,
    format: "Single",
    date: "25 Feb 2026",
    cover: "/covers/sneaky-link.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/track/sneaky-link" }],
    buyUrl: "https://amaldc.bandcamp.com/track/sneaky-link",
  },
  {
    code: "HR016",
    slug: "side-orders-v1",
    artist: "Hochi Runs",
    title: "Side Orders v1",
    year: 2025,
    format: "Album",
    date: "05 Dec 2025",
    cover: "/covers/side-orders-v1.jpg",
    links: [{ platform: "Bandcamp", url: "https://hochiruns.bandcamp.com/album/side-orders-v1-2" }],
    buyUrl: "https://hochiruns.bandcamp.com/album/side-orders-v1-2",
  },
  {
    code: "HR015",
    slug: "stuck-in-sp",
    artist: "Amal",
    title: "Stuck in SP",
    year: 2025,
    format: "Single",
    date: "01 Aug 2025",
    cover: "/covers/stuck-in-sp.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/track/stuck-in-sp" }],
    buyUrl: "https://amaldc.bandcamp.com/track/stuck-in-sp",
  },
  {
    code: "HR014",
    slug: "wip",
    artist: "Amal , Stonie Blue , Sochildish",
    title: "WIP",
    year: 2025,
    format: "Single",
    date: "25 Apr 2025",
    cover: "/covers/wip.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/track/wip" }],
    buyUrl: "https://amaldc.bandcamp.com/track/wip",
  },
  {
    code: "HR013",
    slug: "stadium",
    artist: "Amal, Dj Nativesun",
    title: "Stadium",
    year: 2025,
    format: "Single",
    date: "17 Feb 2025",
    cover: "/covers/stadium.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/track/stadium" }],
    buyUrl: "https://amaldc.bandcamp.com/track/stadium",
  },
  {
    code: "HR012",
    slug: "vague-amal-nedaj",
    artist: "Amal, Nedaj",
    title: "VAGUE (Amal + Nedaj)",
    year: 2024,
    format: "Single",
    date: "12 Jul 2024",
    cover: "/covers/vague-amal-nedaj.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/track/vague-amal-nedaj" }],
    buyUrl: "https://amaldc.bandcamp.com/track/vague-amal-nedaj",
  },
  {
    code: "HR011",
    slug: "movement",
    artist: "Hunch, Tromac",
    title: "MOVEMENT",
    year: 2024,
    format: "Album",
    date: "31 May 2024",
    cover: "/covers/movement.jpg",
    links: [{ platform: "Bandcamp", url: "https://hunchhunch.bandcamp.com/album/movement" }],
    buyUrl: "https://hunchhunch.bandcamp.com/album/movement",
  },
  {
    code: "HR010",
    slug: "dance-concept-2",
    artist: "Amal",
    title: "DANCE CONCEPT 2",
    year: 2024,
    format: "Album",
    date: "02 May 2024",
    cover: "/covers/dance-concept-2.jpg",
    links: [{ platform: "Bandcamp", url: "https://hochiruns.bandcamp.com/album/dance-concept-2" }],
    buyUrl: "https://hochiruns.bandcamp.com/album/dance-concept-2",
  },
  {
    code: "HR009",
    slug: "her-majesty",
    artist: "Hunch, Tromac",
    title: "Her Majesty",
    year: 2024,
    format: "Single",
    date: "12 Apr 2024",
    cover: "/covers/her-majesty.jpg",
    links: [{ platform: "Bandcamp", url: "https://hochiruns.bandcamp.com/track/her-majesty" }],
    buyUrl: "https://hochiruns.bandcamp.com/track/her-majesty",
  },
  {
    code: "HR008",
    slug: "hit-dat",
    artist: "Amal, DJ SWISHA",
    title: "Hit Dat",
    year: 2024,
    format: "Single",
    date: "16 Feb 2024",
    cover: "/covers/hit-dat.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/track/hit-dat" }],
    buyUrl: "https://amaldc.bandcamp.com/track/hit-dat",
  },
  {
    code: "HR007",
    slug: "sleep",
    artist: "Auto Lola (🩸📱🧎🏾‍♂️)",
    title: "SLEEP",
    year: 2023,
    format: "Album",
    date: "20 Nov 2023",
    cover: "/covers/sleep.jpg",
    links: [{ platform: "Bandcamp", url: "https://autolola333.bandcamp.com/album/sleep" }],
    buyUrl: "https://autolola333.bandcamp.com/album/sleep",
  },
  {
    code: "HR006",
    slug: "remix-pack-vol-1",
    artist: "Amal",
    title: "REMIX PACK VOL 1",
    year: 2023,
    format: "Album",
    date: "07 Oct 2023",
    cover: "/covers/remix-pack-vol-1.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/album/remix-pack-vol-1" }],
    buyUrl: "https://amaldc.bandcamp.com/album/remix-pack-vol-1",
  },
  {
    code: "HR005",
    slug: "pressure",
    artist: "Amal",
    title: "PRESSURE",
    year: 2023,
    format: "Album",
    date: "02 Mar 2023",
    cover: "/covers/pressure.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/album/pressure" }],
    buyUrl: "https://amaldc.bandcamp.com/album/pressure",
  },
  {
    code: "HR004",
    slug: "black-kray-bow-bow-amal-mix",
    artist: "Amal , Black Kray",
    title: "BLACK KRAY - BOW BOW (AMAL MIX)",
    year: 2023,
    format: "Single",
    date: "09 Feb 2023",
    cover: "/covers/black-kray-bow-bow-amal-mix.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/track/black-kray-bow-bow-amal-mix" }],
    buyUrl: "https://amaldc.bandcamp.com/track/black-kray-bow-bow-amal-mix",
  },
  {
    code: "HR003",
    slug: "pink-pantheress-passion-amal-mix",
    artist: "Amal, pink pantheress",
    title: "PINK PANTHERESS - PASSION (AMAL MIX)",
    year: 2022,
    format: "Single",
    date: "16 Aug 2022",
    cover: "/covers/pink-pantheress-passion-amal-mix.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/track/pink-pantheress-passion-amal-mix" }],
    buyUrl: "https://amaldc.bandcamp.com/track/pink-pantheress-passion-amal-mix",
  },
  {
    code: "HR002",
    slug: "the-villain",
    artist: "Amal",
    title: "THE VILLAIN",
    year: 2022,
    format: "Single",
    date: "01 Apr 2022",
    cover: "/covers/the-villain.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/track/the-villain" }],
    buyUrl: "https://amaldc.bandcamp.com/track/the-villain",
  },
  {
    code: "HR001",
    slug: "gleam",
    artist: "Amal",
    title: "GLEAM",
    year: 2021,
    format: "Album",
    date: "09 Mar 2021",
    cover: "/covers/gleam.jpg",
    links: [{ platform: "Bandcamp", url: "https://amaldc.bandcamp.com/album/gleam" }],
    buyUrl: "https://amaldc.bandcamp.com/album/gleam",
  },
];

export function getRelease(slug: string): Release | undefined {
  return releases.find((r) => r.slug === slug);
}

export function getReleasesByMember(memberSlug: string): Release[] {
  return releases.filter((r) => r.memberSlugs?.includes(memberSlug));
}

export function getYears(): number[] {
  return [...new Set(releases.map((r) => r.year))].sort((a, b) => b - a);
}

export function getReleasesByYear(): { year: number; releases: Release[] }[] {
  return getYears().map((year) => ({
    year,
    releases: releases.filter((r) => r.year === year),
  }));
}
