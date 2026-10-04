/** @typedef {import('../data/releases').Release} Release */
/** @typedef {Omit<Release, 'slug' | 'code'> & Required<Pick<Release, 'buyUrl' | 'bandcampId' | 'bandcampType'>>} BandcampRelease */

/**
 * Bandcamp supplies display metadata. Local records retain the label's
 * catalog numbers, URLs, and editorial choices across upstream edits.
 * Only the fields below are allowed into the website's data bundle.
 * @param {Release[]} archive
 * @param {{version: number, releases: BandcampRelease[]}} snapshot
 * @returns {Release[]}
 */
export function mergeBandcampCatalog(archive, snapshot) {
  if (snapshot.version !== 1 || !Array.isArray(snapshot.releases)) {
    throw new Error('Unsupported Bandcamp catalog snapshot');
  }

  const byUrl = new Map(archive.map((release) => [release.buyUrl, release]));
  const byId = new Map(
    archive
      .filter((release) => release.bandcampId && release.bandcampType)
      .map((release) => [`${release.bandcampType}:${release.bandcampId}`, release]),
  );
  const matched = new Set();
  const usedSlugs = new Set(archive.map((release) => release.slug));
  const seen = new Set();
  const catalog = snapshot.releases.map((live) => {
    const url = new URL(live.buyUrl ?? '');
    if (
      url.protocol !== 'https:' ||
      url.username || url.password || url.port ||
      !/^[a-z0-9-]+\.bandcamp\.com$/.test(url.hostname) ||
      !/^\/(album|track)\/[a-z0-9-]+$/.test(url.pathname) ||
      url.search || url.hash ||
      !live.title || !live.artist ||
      !Number.isInteger(live.year) ||
      !Number.isSafeInteger(live.bandcampId) ||
      (live.bandcampId ?? 0) <= 0 ||
      !['album', 'track'].includes(live.bandcampType ?? '')
    ) {
      throw new Error('Invalid Bandcamp release metadata');
    }

    const id = `${live.bandcampType}:${live.bandcampId}`;
    if (seen.has(id)) throw new Error('Duplicate Bandcamp release');
    seen.add(id);

    const local = byId.get(id) ?? byUrl.get(live.buyUrl);
    if (local) matched.add(local.slug);
    let slug = local?.slug ?? `bandcamp-${live.bandcampType}-${live.bandcampId}`;
    if (!local && usedSlugs.has(slug)) {
      slug = `${slug}-release`;
    }
    if (!local && usedSlugs.has(slug)) {
      throw new Error('Duplicate release slug');
    }
    usedSlugs.add(slug);

    // Explicit projection prevents upstream player/audio fields from entering
    // the client bundle even if a future importer accidentally adds them.
    return {
      slug,
      code: local?.code ?? `BC-${live.bandcampType === 'album' ? 'A' : 'T'}${live.bandcampId}`,
      bandcampId: live.bandcampId,
      bandcampType: live.bandcampType,
      title: live.title,
      artist: live.artist,
      year: live.year,
      date: live.date,
      format: local?.format ?? live.format,
      cover: live.cover ?? local?.cover,
      buyUrl: live.buyUrl,
      description: local?.description ?? live.description,
      tracklist: (live.tracklist ?? local?.tracklist)?.map((track) => ({
        title: track.title, duration: track.duration, feat: track.feat,
      })),
      credits: (local?.credits ?? live.credits)?.map((credit) => ({
        role: credit.role, name: credit.name,
      })),
      tags: local?.tags ?? live.tags,
      memberSlugs: local?.memberSlugs,
      links: [
        { platform: 'Bandcamp', url: live.buyUrl },
        ...(local?.links ?? []).filter((link) => link.platform !== 'Bandcamp'),
      ],
    };
  });

  // Retain the manually curated archive if a release leaves the public grid.
  // New, uncurated records follow the current successful snapshot instead.
  return [...catalog, ...archive.filter((release) => !matched.has(release.slug))];
}
