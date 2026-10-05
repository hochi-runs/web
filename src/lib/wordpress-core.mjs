import { load } from 'cheerio';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export const MAX_CMS_BYTES = 2 * 1024 * 1024;
const MAX_ITEMS = 1000;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function object(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid WordPress ' + field);
  return value;
}

function array(value, field, limit = MAX_ITEMS) {
  if (!Array.isArray(value) || value.length > limit) throw new Error('Invalid WordPress ' + field);
  return value;
}

export function plainWordPressText(value, field = 'text', limit = 12000, required = false) {
  if (typeof value !== 'string' || value.length > limit * 4) throw new Error('Invalid WordPress ' + field);
  const $ = load(value, null, false);
  $('script, style, iframe, object, noscript').remove();
  $('br').replaceWith('\n');
  $('p, div, li, h1, h2, h3, h4, h5, h6').append('\n');
  const text = $.root().text().replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length > limit || (required && !text)) throw new Error('Invalid WordPress ' + field);
  return text;
}

function optionalText(value, field, limit = 12000) {
  return value == null ? undefined : plainWordPressText(value, field, limit) || undefined;
}

export function validWordPressSlug(value) {
  return typeof value === 'string' && value.length <= 120 && SLUG.test(value);
}

function slug(value) {
  if (!validWordPressSlug(value)) throw new Error('Invalid WordPress website slug');
  return value;
}

export function isPublicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 192 && b === 0 && (c === 0 || c === 2)) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) === 6) {
    // Only global unicast; exclude documentation and transition ranges.
    return /^[23]/i.test(address) && !/^2001:(?:db8|0|10):/i.test(address) && !/^2002:/i.test(address);
  }
  return false;
}

export function publicHttpsUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('Invalid WordPress URL');
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash ||
    isIP(host.replace(/^\[|\]$/g, '')) || !host.includes('.') || host.endsWith('.') ||
    /(?:^|\.)(?:localhost|local|internal|test|invalid|example|home|lan)$/.test(host)) {
    throw new Error('WordPress requires a public HTTPS hostname');
  }
  return url;
}

function optionalUrl(value) {
  return value == null || value === '' ? undefined : publicHttpsUrl(value).href;
}

function optionalImageUrl(value, { localDemo = false, imageOrigin } = {}) {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string' || /[\x00-\x20\x7f]/.test(value)) throw new Error('Invalid WordPress image URL');
  const url = new URL(value);
  if (localDemo && url.protocol === 'http:') {
    if (process.env.NODE_ENV === 'production') throw new Error('Local WordPress demo is forbidden in production');
    const source = localDemoContentUrl(`${imageOrigin}/wp-json/hochi/v1/content`);
    if (url.origin !== source.origin || url.username || url.password || url.hash || !url.pathname.startsWith('/wp-content/uploads/')) throw new Error('Local WordPress image must come from its uploads directory');
  } else {
    publicHttpsUrl(value);
  }
  if (!/\.(?:jpe?g|png|gif|webp|avif)$/i.test(url.pathname)) throw new Error('Invalid WordPress image type');
  return url.href;
}

function unique(values, field, key) {
  const seen = new Set();
  for (const value of values) {
    const identity = key(value);
    if (seen.has(identity)) throw new Error('Duplicate WordPress ' + field);
    seen.add(identity);
  }
  return values;
}

export function parseReleaseOverrides(input) {
  return unique(array(input, 'release overrides').map((value) => {
    const entry = object(value, 'release override');
    const result = { slug: slug(entry.slug) };
    if (entry.description != null) result.description = plainWordPressText(entry.description, 'release description');
    if (entry.format != null && entry.format !== '') {
      if (!['Album', 'Single', 'EP', 'Compilation'].includes(entry.format)) throw new Error('Invalid WordPress release format');
      result.format = entry.format;
    }
    if (entry.tags != null) result.tags = [...new Set(array(entry.tags, 'release tags', 30).map((tag) => plainWordPressText(tag, 'release tag', 100, true)))];
    if (entry.credits != null) result.credits = array(entry.credits, 'release credits', 100).map((value) => {
      const credit = object(value, 'release credit');
      return { role: plainWordPressText(credit.role, 'credit role', 100, true), name: plainWordPressText(credit.name, 'credit name', 500, true) };
    });
    if (entry.links != null) result.links = array(entry.links, 'release links', 30).map((value) => {
      const link = object(value, 'release link');
      return { platform: plainWordPressText(link.platform, 'link platform', 100, true), url: publicHttpsUrl(link.url).href };
    });
    if (entry.memberSlugs != null) result.memberSlugs = [...new Set(array(entry.memberSlugs, 'release artists', 100).map(slug))];
    if (entry.hidden != null) {
      if (typeof entry.hidden !== 'boolean') throw new Error('Invalid WordPress release visibility');
      result.hidden = entry.hidden;
    }
    return result;
  }), 'release override slug', (entry) => entry.slug);
}

export function parseAppearance(input, options = {}) {
  const data = object(input, 'appearance');
  const result = {};
  for (const key of ['backgroundColor', 'textColor', 'accentColor', 'mutedColor', 'borderColor']) {
    if (data[key] == null || data[key] === '') continue;
    if (typeof data[key] !== 'string' || !/^#[a-f0-9]{6}$/i.test(data[key])) throw new Error('Invalid WordPress appearance color');
    result[key] = data[key].toLowerCase();
  }
  for (const key of ['logoUrl', 'backgroundLogoUrl', 'backgroundImageUrl']) {
    if (data[key] == null || data[key] === '') continue;
    result[key] = optionalImageUrl(data[key], options);
  }
  if (data.backgroundLogoOpacity != null && data.backgroundLogoOpacity !== '') {
    const opacity = data.backgroundLogoOpacity;
    if (typeof opacity !== 'number' || !Number.isFinite(opacity) || opacity < 0 || opacity > 0.3) throw new Error('Invalid WordPress background opacity');
    result.backgroundLogoOpacity = opacity;
  }
  return result;
}

/** Editorial fields only: never replace Bandcamp's source metadata or routes. */
export function applyReleaseOverrides(catalog, overrides = []) {
  const bySlug = new Map(overrides.map((entry) => [entry.slug, entry]));
  return catalog.flatMap((release) => {
    const override = bySlug.get(release.slug);
    if (!override) return [release];
    if (override.hidden) return [];
    const result = { ...release };
    for (const key of ['description', 'format', 'tags', 'credits', 'memberSlugs']) {
      if (Object.hasOwn(override, key)) result[key] = override[key];
    }
    if (Object.hasOwn(override, 'links')) {
      const canonical = release.buyUrl ? [{ platform: 'Bandcamp', url: release.buyUrl }] :
        (release.links ?? []).filter((link) => link.platform.toLowerCase() === 'bandcamp');
      const used = new Set(canonical.map((link) => link.url));
      result.links = [...canonical, ...override.links.filter((link) => {
        if (link.platform.toLowerCase() === 'bandcamp' || used.has(link.url)) return false;
        used.add(link.url);
        return true;
      })];
    }
    return [result];
  });
}

export function appearanceCssVariables(appearance = {}) {
  const names = { backgroundColor: '--background', textColor: '--foreground', accentColor: '--accent', mutedColor: '--muted', borderColor: '--hairline' };
  return Object.fromEntries(Object.entries(names).flatMap(([field, property]) => appearance[field] ? [[property, appearance[field]]] : []));
}

export function parsePluginContent(input, options = {}) {
  if (options.localDemo && process.env.NODE_ENV === 'production') throw new Error('Local WordPress demo is forbidden in production');
  const data = object(input, 'content');
  if (data.version !== 1) throw new Error('Unsupported WordPress content version');
  const artists = unique(array(data.artists, 'artists').map((entry) => {
    const artist = object(entry, 'artist');
    const socials = artist.socials == null ? undefined : array(artist.socials, 'socials', 30).map((value) => {
      const link = object(value, 'social link');
      return { platform: plainWordPressText(link.platform, 'social platform', 100, true), url: publicHttpsUrl(link.url).href };
    });
    const releaseSlugs = artist.releaseSlugs == null ? undefined : [...new Set(array(artist.releaseSlugs, 'release links', MAX_ITEMS).map(slug))];
    return {
      slug: slug(artist.slug), name: plainWordPressText(artist.name, 'artist name', 500, true),
      role: plainWordPressText(artist.role, 'artist role', 200, true),
      bio: optionalText(artist.bio, 'artist bio'), photo: optionalImageUrl(artist.photo, options), socials, releaseSlugs,
    };
  }), 'artist slug', (artist) => artist.slug);
  const products = array(data.products, 'products').map((entry) => {
    const product = object(entry, 'product');
    return {
      name: plainWordPressText(product.name, 'product name', 500, true),
      price: plainWordPressText(product.price, 'product price', 200, true),
      image: optionalImageUrl(product.image, options), buyUrl: optionalUrl(product.buyUrl),
    };
  });
  const shows = array(data.shows, 'shows').map((entry) => {
    const show = object(entry, 'show');
    return {
      date: plainWordPressText(show.date, 'show date', 200, true),
      venue: plainWordPressText(show.venue, 'show venue', 500, true),
      city: plainWordPressText(show.city, 'show city', 500, true), ticketUrl: optionalUrl(show.ticketUrl),
      image: optionalImageUrl(show.image, options),
    };
  });
  const pageInput = object(data.pages, 'pages');
  const pages = {};
  for (const key of ['about', 'legal']) {
    if (pageInput[key] == null) continue;
    const page = object(pageInput[key], 'page');
    pages[key] = { paragraphs: array(page.paragraphs, 'paragraphs', 100).map((value) => plainWordPressText(value, 'paragraph', 12000, true)) };
  }
  const result = { version: 1, artists, products, shows, pages };
  if (data.releaseOverrides != null) result.releaseOverrides = parseReleaseOverrides(data.releaseOverrides);
  if (data.appearance != null) result.appearance = parseAppearance(data.appearance, options);
  return result;
}

/** Explicit local prototype transport; never enabled on a production server. */
export function localDemoContentUrl(value) {
  if (typeof value !== 'string' || !/^http:\/\/(?:localhost|127\.0\.0\.1):[1-9][0-9]{0,4}(?:\/|\?|$)/.test(value)) throw new Error('Local WordPress demo requires literal loopback HTTP and an explicit port');
  const url = new URL(value);
  if (!url.port || Number(url.port) > 65535 || url.username || url.password || url.hash || !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Invalid local WordPress demo URL');
  const pretty = /^\/wp-json\/hochi\/v1\/content\/?$/.test(url.pathname) && !url.search;
  const restQuery = url.pathname === '/' && [...url.searchParams].length === 1 && url.searchParams.get('rest_route') === '/hochi/v1/content';
  if (!pretty && !restQuery) throw new Error('Local WordPress demo requires the Hochi content endpoint');
  return url;
}

export function parseWordPressConfig(environment = {}) {
  const content = environment.WORDPRESS_CONTENT_URL?.trim();
  const native = environment.WORDPRESS_ARTISTS_URL?.trim();
  const localDemo = environment.WORDPRESS_LOCAL_DEMO === '1';
  if (localDemo && environment.NODE_ENV === 'production') throw new Error('Local WordPress demo is forbidden in production');
  if (content && native) throw new Error('Configure only one WordPress content mode');
  if (localDemo) {
    if (!content || native) throw new Error('Local WordPress demo requires only WORDPRESS_CONTENT_URL');
    return { mode: 'plugin', url: localDemoContentUrl(content).href, localDemo: true };
  }
  if (content) {
    const url = publicHttpsUrl(content);
    if (!/\/wp-json\/hochi\/v1\/content\/?$/.test(url.pathname) || url.search) throw new Error('WORDPRESS_CONTENT_URL must be the Hochi content endpoint');
    return { mode: 'plugin', url: url.href };
  }
  if (!native) return { mode: 'local' };
  const url = publicHttpsUrl(native);
  if (!(/\/wp-json\/wp\/v2\/posts\/?$/.test(url.pathname) ||
    (url.hostname === 'public-api.wordpress.com' && /^\/wp\/v2\/sites\/[^/]+\/posts\/?$/.test(url.pathname)))) {
    throw new Error('WORDPRESS_ARTISTS_URL must be a native WordPress v2 posts collection');
  }
  const allowed = new Set(['status', 'context', 'slug', '_embed', 'per_page', 'page']);
  for (const key of url.searchParams.keys()) if (!allowed.has(key)) throw new Error('Unexpected WordPress artists query parameter');
  if ((url.searchParams.has('status') && url.searchParams.get('status') !== 'publish') ||
    (url.searchParams.has('context') && url.searchParams.get('context') !== 'view')) throw new Error('Only published WordPress artists are permitted');
  const managedSlugs = (environment.WORDPRESS_MANAGED_ARTIST_SLUGS ?? '').split(',').map((value) => value.trim()).filter(Boolean).map(slug);
  if (!managedSlugs.length || managedSlugs.length > 100 || new Set(managedSlugs).size !== managedSlugs.length) throw new Error('Set distinct WORDPRESS_MANAGED_ARTIST_SLUGS');
  if (url.searchParams.has('slug')) {
    const supplied = url.searchParams.get('slug').split(',').sort();
    if (JSON.stringify(supplied) !== JSON.stringify([...managedSlugs].sort())) throw new Error('WordPress artists query must match the managed slugs');
  }
  url.searchParams.set('status', 'publish');
  url.searchParams.set('context', 'view');
  url.searchParams.set('slug', managedSlugs.join(','));
  url.searchParams.set('_embed', 'wp:featuredmedia');
  url.searchParams.set('per_page', '100');
  url.searchParams.set('page', '1');
  return { mode: 'native', url: url.href, managedSlugs };
}

export function parseNativeArtists(input, managedSlugs) {
  const managed = new Set(managedSlugs);
  const artists = [];
  for (const entry of array(input, 'native posts')) {
    const post = object(entry, 'native post');
    if (post.status !== 'publish' || !managed.has(post.slug)) continue;
    if (post.content?.protected || post.password) continue;
    const media = post._embedded?.['wp:featuredmedia']?.[0];
    // Native WordPress auto-generates an excerpt from a biography when the
    // editor leaves it blank. Only a short explicit-looking value is a role.
    const excerpt = plainWordPressText(post.excerpt?.rendered ?? '', 'artist excerpt');
    artists.push({
      slug: slug(post.slug), name: plainWordPressText(post.title?.rendered, 'artist name', 500, true),
      role: excerpt && excerpt.length <= 200 ? excerpt : 'Artist',
      bio: optionalText(post.content?.rendered ?? '', 'artist bio'),
      photo: optionalUrl(media?.source_url),
    });
  }
  return unique(artists, 'artist slug', (artist) => artist.slug);
}

export function overlayManagedArtists(seed, imported, managedSlugs) {
  const managed = new Set(managedSlugs);
  const bySlug = new Map(imported.map((artist) => [artist.slug, artist]));
  const existing = new Set(seed.map((artist) => artist.slug));
  return [
    ...seed.flatMap((artist) => managed.has(artist.slug) ? bySlug.has(artist.slug) ? [{ ...artist, ...bySlug.get(artist.slug) }] : [] : [artist]),
    ...imported.filter((artist) => managed.has(artist.slug) && !existing.has(artist.slug)),
  ];
}

export function selectArtistReleases(artist, releases) {
  if (artist.releaseSlugs != null) {
    const selected = new Set(artist.releaseSlugs);
    return releases.filter((release) => selected.has(release.slug));
  }
  return releases.filter((release) => release.memberSlugs?.includes(artist.slug));
}

export async function fetchWordPressJson(source, { fetchImpl = fetch, resolveHost = (host) => lookup(host, { all: true }), maxBytes = MAX_CMS_BYTES, timeoutMs = 10000, localDemo = false } = {}) {
  if (localDemo && process.env.NODE_ENV === 'production') throw new Error('Local WordPress demo is forbidden in production');
  const url = localDemo ? localDemoContentUrl(source) : publicHttpsUrl(source);
  const controller = new AbortController();
  let rejectTimeout;
  const timedOut = new Promise((_, reject) => { rejectTimeout = reject; });
  const timer = setTimeout(() => { controller.abort(); rejectTimeout(new Error('WordPress request timed out')); }, timeoutMs);
  try {
    const operation = (async () => {
      if (!localDemo) {
        const addresses = await resolveHost(url.hostname);
        if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new Error('WordPress hostname does not resolve to public addresses');
      }
      const response = await fetchImpl(url.href, {
        redirect: 'error', signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': 'HochiRunsContent/1.0' },
      });
      if (!response.ok) { await response.body?.cancel(); throw new Error('WordPress request failed with HTTP ' + response.status); }
      if (!/^application\/(?:[a-z0-9.+-]+\+)?json\b/i.test(response.headers.get('content-type') ?? '')) {
        await response.body?.cancel(); throw new Error('WordPress response is not JSON');
      }
      if (Number(response.headers.get('content-length')) > maxBytes) { await response.body?.cancel(); throw new Error('WordPress response is too large'); }
      if (!response.body) throw new Error('WordPress response is empty');
      const chunks = [];
      let size = 0;
      for await (const chunk of response.body) {
        size += chunk.byteLength;
        if (size > maxBytes) { controller.abort(); throw new Error('WordPress response is too large'); }
        chunks.push(chunk);
      }
      let data;
      try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Error('Invalid WordPress JSON'); }
      return { data, totalPages: response.headers.get('x-wp-totalpages') };
    })();
    return await Promise.race([operation, timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

export async function loadWordPressData(config, options = {}) {
  if (config.mode === 'local') return undefined;
  const first = await fetchWordPressJson(config.url, { ...options, localDemo: config.localDemo === true });
  if (config.mode === 'plugin') return parsePluginContent(first.data, { localDemo: config.localDemo === true, imageOrigin: new URL(config.url).origin });
  const totalPages = first.totalPages == null ? 1 : Number(first.totalPages);
  const initialPosts = array(first.data, 'native posts');
  if (totalPages === 0 && initialPosts.length === 0) return { artists: [] };
  if (!Number.isInteger(totalPages) || totalPages < 1 || totalPages > 10) throw new Error('Invalid WordPress pagination');
  const posts = [...initialPosts];
  for (let page = 2; page <= totalPages; page++) {
    const url = new URL(config.url);
    url.searchParams.set('page', String(page));
    const result = await fetchWordPressJson(url.href, options);
    if (Number(result.totalPages) !== totalPages) throw new Error('WordPress collection changed during pagination');
    posts.push(...array(result.data, 'native posts'));
  }
  return { artists: parseNativeArtists(posts, config.managedSlugs) };
}
