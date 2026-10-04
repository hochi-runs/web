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
