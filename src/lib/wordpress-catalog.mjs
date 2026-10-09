/**
 * Public metadata for the WordPress release picker. Read the underlying
 * Bandcamp catalog, including releases an owner has hidden on the website.
 * Never export player data, audio URLs, credentials, or editorial overrides.
 * @param {import('../data/releases').Release[]} releases
 * @param {string} origin
 */
export function createWordPressCatalog(releases, origin) {
  const base = new URL(origin);
  if (base.protocol !== 'https:' || base.username || base.password) {
    throw new Error('The public catalog needs an HTTPS website origin');
  }
  return {
    version: 1,
    releases: releases.map((release) => ({
      slug: release.slug,
      title: release.title,
      artist: release.artist,
      code: release.code,
      ...(release.cover ? { cover: new URL(release.cover, base.origin).href } : {}),
      ...(release.date ? { date: release.date } : {}),
      ...(release.buyUrl ? { buyUrl: release.buyUrl } : {}),
      ...(release.memberSlugs ? { memberSlugs: [...release.memberSlugs] } : {}),
    })),
  };
}

/**
 * Seed the editor from explicit roster identities. Imported display credits
 * are evidence for review, never permission to assign a roster relationship.
 * @param {import('../data/roster').Member[]} artists
 * @param {import('../data/releases').Release[]} releases
 */
export function createWordPressArtists(artists, releases) {
  const knownArtists = new Set();
  for (const artist of artists) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artist.slug) || knownArtists.has(artist.slug)) {
      throw new Error('Invalid or duplicate roster identity');
    }
    knownArtists.add(artist.slug);
  }
  for (const release of releases) {
    if (release.memberSlugs?.some((slug) => !knownArtists.has(slug))) {
      throw new Error('Unknown explicit roster identity');
    }
  }
  return artists.map((artist) => ({
    ...artist,
    releaseSlugs: [...new Set(releases
      .filter((release) => release.memberSlugs?.includes(artist.slug))
      .map((release) => release.slug))],
  }));
}
