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

  const byUrl = new Map();
  const byId = new Map();
  const archiveSlugs = new Set();
  for (const release of archive) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(release.slug ?? '')) {
      throw new Error('Invalid curated release slug');
    }
    if (archiveSlugs.has(release.slug) || (release.buyUrl && byUrl.has(release.buyUrl))) {
      throw new Error('Duplicate curated release identity');
    }
    archiveSlugs.add(release.slug);
    if (release.buyUrl) byUrl.set(release.buyUrl, release);
    if (release.bandcampId != null || release.bandcampType != null) {
      if (!Number.isSafeInteger(release.bandcampId) || release.bandcampId <= 0 ||
        !['album', 'track'].includes(release.bandcampType)) {
        throw new Error('Invalid curated Bandcamp identity');
      }
      const id = `${release.bandcampType}:${release.bandcampId}`;
      if (byId.has(id)) throw new Error('Duplicate curated release identity');
      byId.set(id, release);
    }
    if (release.memberSlugs != null && (!Array.isArray(release.memberSlugs) ||
      release.memberSlugs.some((slug) => typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)))) {
      throw new Error('Invalid curated artist relationship');
    }
  }
  const matched = new Set();
  const usedSlugs = new Set(archive.map((release) => release.slug));
  const seen = new Set();
  const seenUrls = new Set();
  const catalog = snapshot.releases.map((live) => {
    const url = new URL(live.buyUrl ?? '');
    if (
      url.protocol !== 'https:' ||
      url.username || url.password || url.port ||
      !/^[a-z0-9-]+\.bandcamp\.com$/.test(url.hostname) ||
      !/^\/(album|track)\/[a-z0-9-]+$/.test(url.pathname) ||
      url.pathname.split('/')[1] !== live.bandcampType ||
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
    if (seen.has(id) || seenUrls.has(live.buyUrl)) throw new Error('Duplicate Bandcamp release');
    seen.add(id);
    seenUrls.add(live.buyUrl);

    const idMatch = byId.get(id);
    const urlMatch = byUrl.get(live.buyUrl);
    // A purchase path can be reused or renamed. Once an immutable ID exists,
    // contradictory evidence needs review instead of taking another URL.
    if ((idMatch && urlMatch && idMatch !== urlMatch) ||
      (urlMatch?.bandcampId && `${urlMatch.bandcampType}:${urlMatch.bandcampId}` !== id)) {
      throw new Error('Conflicting Bandcamp identity; review the curated release');
    }
    const local = idMatch ?? urlMatch;
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
      memberSlugs: local?.memberSlugs ? [...new Set(local.memberSlugs)] : undefined,
      links: [
        { platform: 'Bandcamp', url: live.buyUrl },
        ...(local?.links ?? []).filter((link) => link.platform !== 'Bandcamp'),
      ],
    };
  });

  // Retain the manually curated archive if a release leaves the public grid.
  // New, uncurated records follow the current successful snapshot instead.
  return [...catalog, ...archive
    .filter((release) => !matched.has(release.slug))
    .map((release) => release.memberSlugs
      ? { ...release, memberSlugs: [...new Set(release.memberSlugs)] }
      : release)];
}
