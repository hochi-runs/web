/**
 * Editorial content for the videos and shows pages.
 * Placeholder data — replace with the real videos and dates.
 * (Roster members now live in roster.ts.)
 */

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
