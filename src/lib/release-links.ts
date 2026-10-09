import type { Release, StreamingLink } from "@/data/releases";

/** Radio has an official embed identity; public native-preview availability is checked later. */
export function getReleaseListenUrl(release: Pick<Release, "slug" | "bandcampId" | "bandcampType">): string | undefined {
  if (!release.bandcampId || !Number.isSafeInteger(release.bandcampId) || release.bandcampId <= 0
    || (release.bandcampType !== "album" && release.bandcampType !== "track")) return;
  return `/beta/radio?release=${encodeURIComponent(release.slug)}`;
}

/** Show each release destination once, including its canonical purchase link. */
export function getReleaseLinks({ buyUrl, links = [] }: Pick<Release, "buyUrl" | "links">): StreamingLink[] {
  const destinations = new Set<string>();
  const allLinks = buyUrl ? [{ platform: "Bandcamp", url: buyUrl }, ...links] : links;

  return allLinks.filter(({ url }) => {
    if (destinations.has(url)) return false;
    destinations.add(url);
    return true;
  });
}
