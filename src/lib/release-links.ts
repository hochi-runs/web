import type { Release, StreamingLink } from "@/data/releases";

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
