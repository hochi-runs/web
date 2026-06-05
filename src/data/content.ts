/**
 * Editorial content for the secondary pages (talent, videos, shows).
 * Placeholder data — replace with the real roster, videos, and dates.
 */

export type TalentMember = {
  name: string;
  /** role / discipline, e.g. "Artist", "Producer", "DJ" */
  role: string;
  /** optional link, e.g. an Instagram profile */
  url?: string;
};

export const talent: TalentMember[] = [
  { name: "AMAL", role: "Artist", url: "https://www.instagram.com/hochiruns/" },
  { name: "DJ Swisha", role: "DJ / Producer" },
  { name: "mr.davinse", role: "Director" },
];

export type Video = {
  title: string;
  /** YouTube video ID, e.g. "PNw4HJfsvUE" */
  youtubeId: string;
  credit?: string;
};

export const videos: Video[] = [
  {
    title: "AMAL — Hit Dat",
    youtubeId: "PNw4HJfsvUE",
    credit: "feat. DJ Swisha · shot by mr.davinse",
  },
];

export type Show = {
  date: string; // human-readable, e.g. "Aug 14, 2025"
  venue: string;
  city: string;
  /** optional ticket link */
  ticketUrl?: string;
};

export const shows: Show[] = [
  // No upcoming shows yet — add entries here as they're booked.
];
