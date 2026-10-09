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
  /** Local image path or verified public artist-profile image URL. */
  photo?: string;
  /** Short bio shown on the member's page */
  bio?: string;
  socials?: SocialLink[];
};

export const members: Member[] = [
  // Public artist profiles checked October 9, 2026 at the owner's request.
  // Biography/image provenance and identity matches: docs/remediation/artist-sources.md.
  {
    slug: "amal",
    name: "AMAL",
    role: "DJ / Producer",
    photo: "https://f4.bcbits.com/img/0047546930_10.jpg",
    bio: "AMAL is a Washington, D.C. producer and DJ, founder of Hochi Runs and a member of Black Rave Culture. His releases span techno, house and club music.",
    socials: [
      { platform: "Bandcamp", url: "https://amaldc.bandcamp.com/" },
      { platform: "Resident Advisor", url: "https://ra.co/dj/amal" },
      { platform: "Instagram", url: "https://www.instagram.com/_amaldc/" },
      { platform: "SoundCloud", url: "https://soundcloud.com/ama_l" },
    ],
  },
  {
    slug: "dj-swisha",
    name: "DJ Swisha",
    role: "DJ / Producer",
    photo: "https://f4.bcbits.com/img/0047391981_10.jpg",
    bio: "DJ Swisha is a New York-based DJ and producer, born in Philadelphia and raised in Los Angeles. A member of Juke Bounce Werk, his work moves across footwork, juke and club music.",
    socials: [
      { platform: "Bandcamp", url: "https://djswisha.bandcamp.com/" },
      { platform: "Resident Advisor", url: "https://ra.co/dj/djswisha" },
      { platform: "Instagram", url: "https://www.instagram.com/djswisha/" },
      { platform: "SoundCloud", url: "https://soundcloud.com/dj-swisha" },
    ],
  },
  {
    slug: "tromac",
    name: "Tromac",
    role: "DJ / Producer",
    photo: "https://f4.bcbits.com/img/0045851500_10.jpg",
    bio: "Originally from Prince George's County, Maryland, Tromac is a Baltimore-based DJ, producer and event curator. Tromac's work draws on Go-Go and Baltimore club, with collaborations including Movement and Her Majesty with Hunch.",
    socials: [
      { platform: "Bandcamp", url: "https://tromac.bandcamp.com/" },
      { platform: "Resident Advisor", url: "https://ra.co/dj/tromac" },
      { platform: "Instagram", url: "https://www.instagram.com/tromac/" },
      { platform: "SoundCloud", url: "https://soundcloud.com/tromac" },
      { platform: "Website", url: "https://www.tromac.net/" },
    ],
  },
  {
    slug: "taylor-spencer",
    name: "Taylor Spenxer",
    role: "DJ / Producer",
    photo: "https://i1.sndcdn.com/avatars-nviQiQfVFK6eP3DW-73z8Hw-t500x500.jpg",
    bio: "Taylor Spenxer is an Atlanta-born DJ and producer based in Washington, D.C., also known as TAYBAND$$$$. Taylor's music connects Atlanta influences with club sounds, including the debut EP TAYBAND$$$$.",
    socials: [
      { platform: "Instagram", url: "https://www.instagram.com/taylorspenxer/" },
      { platform: "SoundCloud", url: "https://soundcloud.com/user-2866603" },
    ],
  },
  {
    slug: "hunch",
    name: "Hunch",
    role: "DJ / Producer",
    photo: "https://f4.bcbits.com/img/0024860313_10.jpg",
    bio: "Hunch is a Maryland-based producer, DJ and multi-genre artist. Hunch's catalog includes the Second Nature EP and ongoing r/USB series, alongside collaborations with Tromac including Movement and Her Majesty.",
    socials: [
      { platform: "Bandcamp", url: "https://hunchhunch.bandcamp.com/" },
      { platform: "Instagram", url: "https://www.instagram.com/hunch.pn/" },
      { platform: "SoundCloud", url: "https://soundcloud.com/0989" },
    ],
  },
  {
    slug: "geno",
    name: "Geno",
    role: "DJ / Producer",
    photo: "https://f4.bcbits.com/img/0045359123_10.jpg",
    bio: "Geno, who releases as whoisgeno, is a producer and DJ from New Orleans, now based in Baton Rouge. A member of the Frequency collective, his club productions include LOSING SLEEP on Hochi Runs.",
    socials: [
      { platform: "Bandcamp", url: "https://whoisgeno.bandcamp.com/" },
      { platform: "Instagram", url: "https://www.instagram.com/whoisgeno/" },
      { platform: "SoundCloud", url: "https://soundcloud.com/user-763065491" },
    ],
  },
  {
    slug: "nedaj",
    name: "Nedaj",
    role: "Artist / Producer",
    photo: "https://f4.bcbits.com/img/0034594399_10.jpg",
    bio: "Nedaj is a Maryland-based artist working in jungle and drum & bass. His releases include VAGUE with Amal, and contributions to Hochi Runs' Side Orders v1 compilation.",
    socials: [
      { platform: "Bandcamp", url: "https://notnedaj.bandcamp.com/" },
      { platform: "Resident Advisor", url: "https://ra.co/dj/nedaj" },
      { platform: "Instagram", url: "https://www.instagram.com/notnedaj/" },
      { platform: "SoundCloud", url: "https://soundcloud.com/notnedaj/" },
      { platform: "Website", url: "https://www.nedaj.us/" },
    ],
  },
];

/** Look up a single member by slug. */
export function getMember(slug: string): Member | undefined {
  return members.find((m) => m.slug === slug);
}
