/**
 * Hochi Runs roster / directory.
 *
 * The single source of truth for members. Each member has a unique `slug`
 * used for their detail page (/roster/<slug>) and to link them to releases
 * (see `memberSlugs` on each release in releases.ts).
 *
 * To add a member: append an object below. To link them to a release, add
 * their slug to that release's `memberSlugs` array.
 */

export type SocialLink = {
  /** e.g. "Instagram", "Spotify", "SoundCloud" */
  platform: string;
  url: string;
};

export type Member = {
  /** Unique URL slug, e.g. "amal". */
  slug: string;
  name: string;
  /** role / discipline, e.g. "Artist", "Producer", "DJ", "Director" */
  role: string;
  /** Optional photo under /public, e.g. "/roster/amal.jpg" */
  photo?: string;
  /** Short bio shown on the member's page */
  bio?: string;
  socials?: SocialLink[];
};

export const members: Member[] = [
  {
    slug: "amal",
    name: "AMAL",
    role: "Artist",
    bio: "Artist on Hochi Runs. Placeholder bio — replace with the real one.",
    socials: [
      { platform: "Instagram", url: "https://www.instagram.com/_amaldc/" },
    ],
  },
  {
    slug: "dj-swisha",
    name: "DJ Swisha",
    role: "DJ / Producer",
    bio: "DJ and producer. Placeholder bio — replace with the real one.",
  },
  {
    slug: "tromac",
    name: "Tromac",
    role: "Artist",
  },
  {
    slug: "taylor-spencer",
    name: "Taylor Spencer",
    role: "Artist",
    socials: [
      { platform: "Instagram", url: "https://www.instagram.com/taylorspenxer/" },
    ],
  },
  {
    slug: "hunch",
    name: "Hunch",
    role: "Artist",
    socials: [
      { platform: "Instagram", url: "https://www.instagram.com/hunch.pn/" },
    ],
  },
  {
    slug: "geno",
    name: "Geno",
    role: "Artist",
  },
  {
    slug: "nedaj",
    name: "Nedaj",
    role: "Artist",
  },
];

/** Look up a single member by slug. */
export function getMember(slug: string): Member | undefined {
  return members.find((m) => m.slug === slug);
}
