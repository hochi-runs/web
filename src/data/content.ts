/**
 * Editorial content for the videos and shows pages.
 * Video selections and verified Hochi Runs event archive.
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
  /** Optional public event flyer image. */
  image?: string;
};

export const shows: Show[] = [
  {
    date: "Sep 4, 2026",
    venue: "HOCHI HOUR · Bossa Nova Civic Club",
    city: "New York City",
    ticketUrl: "https://ra.co/events/2525516",
    image: "/shows/ra-2525516.png",
  },
  {
    date: "May 22, 2026 · 11 PM–3 AM EDT",
    venue: "Hochi Runs Label Takeover · Songbyrd Music House",
    city: "Washington DC",
    ticketUrl: "https://www.instagram.com/p/DW9LfoMjUbR/",
    image: "/shows/hochi-runs-label-takeover-2026.jpg",
  },
  {
    date: "May 16, 2026",
    venue: "Amal (all night) · Shanklin Hall DC",
    city: "Washington DC",
    ticketUrl: "https://ra.co/events/2443350",
    image: "/shows/ra-2443350.png",
  },
  {
    date: "Nov 15, 2025",
    venue: "Groove Haul X hochi runs: SHIESTY · City State Brewery",
    city: "Washington DC",
    ticketUrl: "https://ra.co/events/2286094",
    image: "/shows/ra-2286094.png",
  },
  {
    date: "Oct 11, 2025",
    venue: "DJ Slugo / Nanoos / shekdash presented By hochi runs x Members Only · TRANSMISSION DC",
    city: "Washington DC",
    ticketUrl: "https://ra.co/events/2264258",
    image: "/shows/ra-2264258.png",
  },
  {
    date: "Aug 9, 2025",
    venue: "9th Street Social Club presents: Hochi Runs x NO BIAS · TBA - 9TH STREET SOCIAL CLUB",
    city: "San Francisco/Oakland",
    ticketUrl: "https://ra.co/events/2211253",
    image: "/shows/ra-2211253.png",
  },
  {
    date: "Apr 19, 2025",
    venue: "hochi runs & Astroturf presents 'Field Trip' · 618 DC",
    city: "Washington DC",
    ticketUrl: "https://ra.co/events/2136084",
    image: "/shows/ra-2136084.png",
  },
  {
    date: "Apr 18, 2025",
    venue: "'Pre-Trip' hochi runs + Astroturf Official Pre Party · Vagabond",
    city: "Washington DC",
    ticketUrl: "https://ra.co/events/2145066",
    image: "/shows/ra-2145066.png",
  },
  {
    date: "Jan 18, 2025",
    venue: "Hochi presents Amal's Birthday · 618 DC",
    city: "Washington DC",
    ticketUrl: "https://ra.co/events/2083513",
    image: "/shows/ra-2083513.png",
  },
  {
    date: "Dec 28, 2024",
    venue: "Stop Requested · 618 Cocktail and Whiskey Lounge",
    city: "Washington DC",
    ticketUrl: "https://ra.co/events/2066593",
    image: "/shows/ra-2066593.png",
  },
];
