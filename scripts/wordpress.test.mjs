import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchWordPressJson, isPublicAddress, loadWordPressData, overlayManagedArtists,
  parseNativeArtists, parsePluginContent, parseWordPressConfig, publicHttpsUrl,
  selectArtistReleases,
  applyReleaseOverrides, parseAppearance, parseReleaseOverrides, appearanceCssVariables,
} from '../src/lib/wordpress-core.mjs';

const pluginUrl = 'https://cms.hochiruns.com/wp-json/hochi/v1/content';
const nativeUrl = 'https://public-api.wordpress.com/wp/v2/sites/hochirunstransfer.wordpress.com/posts';
const publicDns = async () => [{ address: '8.8.8.8' }, { address: '2606:4700::1111' }];
const artist = { slug: 'amal', name: 'AMAL', role: 'Artist', bio: 'Approved biography' };
const content = (artists = [artist]) => ({ version: 1, artists, products: [], shows: [], pages: {} });
const post = (slug = 'amal', status = 'publish', overrides = {}) => ({
  slug, status, title: { rendered: 'AMAL &amp; Friends' },
  excerpt: { rendered: '<p>Producer</p>' }, content: { rendered: '<p>Approved <b>biography</b></p>', protected: false },
  _embedded: { 'wp:featuredmedia': [{ source_url: 'https://hochirunstransfer.wordpress.com/wp-content/uploads/photo.jpg' }] },
  ...overrides,
});
const jsonResponse = (data, init = {}) => new Response(JSON.stringify(data), {
  headers: { 'content-type': 'application/json' }, ...init,
});

test('unconfigured CMS uses local mode and active modes cannot be combined', () => {
  assert.deepEqual(parseWordPressConfig({}), { mode: 'local' });
  assert.deepEqual(parseWordPressConfig({ WORDPRESS_CONTENT_URL: pluginUrl }), { mode: 'plugin', url: pluginUrl });
  assert.throws(() => parseWordPressConfig({ WORDPRESS_CONTENT_URL: pluginUrl, WORDPRESS_ARTISTS_URL: nativeUrl }), /only one/);
});

test('native config scopes the published view to managed slugs and embedded artwork', () => {
  const config = parseWordPressConfig({ WORDPRESS_ARTISTS_URL: nativeUrl, WORDPRESS_MANAGED_ARTIST_SLUGS: 'amal, new-artist' });
  const url = new URL(config.url);
  assert.deepEqual(config.managedSlugs, ['amal', 'new-artist']);
  assert.equal(url.searchParams.get('status'), 'publish');
  assert.equal(url.searchParams.get('slug'), 'amal,new-artist');
  assert.equal(url.searchParams.get('_embed'), 'wp:featuredmedia');
  for (const query of ['status=draft', 'context=edit', 'token=secret', 'slug=unrelated']) {
    assert.throws(() => parseWordPressConfig({ WORDPRESS_ARTISTS_URL: nativeUrl + '?' + query, WORDPRESS_MANAGED_ARTIST_SLUGS: 'amal' }));
  }
  for (const managed of ['', 'amal,amal', 'amal,../secret']) {
    assert.throws(() => parseWordPressConfig({ WORDPRESS_ARTISTS_URL: nativeUrl, WORDPRESS_MANAGED_ARTIST_SLUGS: managed }));
  }
});

test('configuration rejects unsafe origins, credentials, non-API URLs and plugin queries', () => {
  for (const url of [
    'http://cms.hochiruns.com/wp-json/hochi/v1/content',
    'https://localhost/wp-json/hochi/v1/content',
    'https://cms.internal/wp-json/hochi/v1/content',
    'https://127.0.0.1/wp-json/hochi/v1/content',
    'https://2130706433/wp-json/hochi/v1/content',
    'https://[::1]/wp-json/hochi/v1/content',
    'https://user:password@cms.hochiruns.com/wp-json/hochi/v1/content',
    pluginUrl + '?token=secret', pluginUrl + '#fragment',
    'https://cms.hochiruns.com/wp-json/wp/v2/posts',
  ]) assert.throws(() => parseWordPressConfig({ WORDPRESS_CONTENT_URL: url }));
  assert.throws(() => parseWordPressConfig({ WORDPRESS_ARTISTS_URL: 'https://public-api.wordpress.com/sites/example/posts', WORDPRESS_MANAGED_ARTIST_SLUGS: 'amal' }));
});

test('plugin content projects supported fields, renders text safely and allows authoritative empty collections', () => {
  const parsed = parsePluginContent({
    ...content([{ ...artist, name: 'AMAL &amp; Friends', bio: '<script>secret()</script><p>First <b>line</b></p><p>Second line</p>',
      releaseSlugs: ['like-dat-riddim', 'like-dat-riddim'], socials: [{ platform: 'Instagram', url: 'https://www.instagram.com/hochiruns/' }],
      rawHtml: '<script>bad()</script>', audio: 'https://example.com/song.mp3' }]),
    products: [{ name: 'T-shirt', price: '$20', image: 'https://cms.hochiruns.com/shirt.jpg', buyUrl: 'https://hochiruns.bandcamp.com/merch/shirt' }],
    shows: [{ date: '12 Oct 2026', venue: 'Club', city: 'DC', ticketUrl: 'https://tickets.example.com/event' }],
    pages: { about: { paragraphs: ['<p>Our history</p>'] } },
  });
  assert.equal(parsed.artists[0].name, 'AMAL & Friends');
  assert.equal(parsed.artists[0].bio, 'First line\nSecond line');
  assert.deepEqual(parsed.artists[0].releaseSlugs, ['like-dat-riddim']);
  assert.doesNotMatch(JSON.stringify(parsed), /<script>|secret\(|rawHtml|song\.mp3/);
  assert.deepEqual(parsed.pages.about.paragraphs, ['Our history']);
  assert.deepEqual(parsePluginContent(content([])), { version: 1, artists: [], products: [], shows: [], pages: {} });
  assert.deepEqual(parsePluginContent({ ...content([]), pages: { legal: { paragraphs: [] } } }).pages.legal.paragraphs, []);
});

test('invalid schema, duplicate website slugs and unsafe links fail the whole content response', () => {
  for (const input of [
    { ...content(), version: 2 }, { ...content(), products: null }, { ...content(), pages: [] },
    content([artist, artist]), content([{ ...artist, name: '' }]), content([{ ...artist, slug: '../amal' }]),
    content([{ ...artist, photo: 'data:image/svg+xml,bad' }]),
    content([{ ...artist, socials: [{ platform: 'Bad', url: 'javascript:alert(1)' }] }]),
    { ...content(), products: [{ name: 'Test', price: '$20', buyUrl: 'http://shop.example.com/' }] },
    content([{ ...artist, bio: 'x'.repeat(12001) }]),
  ]) assert.throws(() => parsePluginContent(input));
});

test('native posts import managed published text and image only; drafts, protected and unrelated posts stay excluded', () => {
  const artists = parseNativeArtists([
    post(), post('dj-swisha', 'draft'), post('blog-news'),
    post('protected', 'publish', { content: { rendered: 'secret', protected: true } }),
  ], ['amal', 'dj-swisha', 'protected']);
  assert.deepEqual(artists, [{ slug: 'amal', name: 'AMAL & Friends', role: 'Producer', bio: 'Approved biography', photo: 'https://hochirunstransfer.wordpress.com/wp-content/uploads/photo.jpg' }]);
  assert.throws(() => parseNativeArtists([post(), post()], ['amal']), /Duplicate/);
  assert.equal(parseNativeArtists([post('amal', 'publish', { excerpt: { rendered: 'A long automatically generated biography '.repeat(20) } })], ['amal'])[0].role, 'Artist');
});

test('native overlay preserves unmigrated artists, never resurrects unpublished managed seeds and supports new slugs', () => {
  const seed = [artist, { slug: 'dj-swisha', name: 'DJ Swisha', role: 'DJ' }];
  assert.deepEqual(overlayManagedArtists(seed, [], ['amal']), [seed[1]]);
  const imported = [{ ...artist, bio: 'Published update' }, { slug: 'new-artist', name: 'New', role: 'Artist' }];
  assert.deepEqual(overlayManagedArtists(seed, imported, ['amal', 'new-artist']), [imported[0], seed[1], imported[1]]);
  assert.equal(overlayManagedArtists(seed, [{ ...artist, bio: undefined }], ['amal'])[0].bio, undefined);
});

test('saved artist release selection is authoritative; omitted selection uses effective release associations', () => {
  const releases = [
    { slug: 'like-dat-riddim', code: 'HR020', memberSlugs: ['amal'] },
    { slug: 'bandcamp-album-123', code: 'BC-A123' }, { slug: 'other', code: 'HR019' },
  ];
  assert.deepEqual(selectArtistReleases({ ...artist, releaseSlugs: ['like-dat-riddim', 'bandcamp-album-123', 'not-yet-imported'] }, releases), releases.slice(0, 2));
  assert.deepEqual(selectArtistReleases({ ...artist, releaseSlugs: ['bandcamp-album-123'] }, releases), [releases[1]]);
  assert.deepEqual(selectArtistReleases({ ...artist, releaseSlugs: [] }, releases), []);
  assert.deepEqual(selectArtistReleases(artist, releases), [releases[0]]);
});

test('release overrides edit only editorial fields, keep Bandcamp metadata and links, and ignore orphan records', () => {
  const catalog = [{ slug: 'like-dat-riddim', code: 'HR020', bandcampId: 123, bandcampType: 'track',
    title: 'Bandcamp title', artist: 'AMAL', year: 2026, date: '2026-10-03', cover: 'https://f4.bcbits.com/img/a123_10.jpg',
    tracklist: [{ title: 'Bandcamp track' }], buyUrl: 'https://amaldc.bandcamp.com/track/like-dat-riddim',
    format: 'Single', description: 'Original', tags: ['Original'], memberSlugs: ['amal'],
    links: [{ platform: 'Bandcamp', url: 'https://amaldc.bandcamp.com/track/like-dat-riddim' }, { platform: 'Old', url: 'https://old.example.com/' }] }];
  const overrides = parseReleaseOverrides([{ slug: catalog[0].slug, description: '<b>Edited</b>', format: 'EP', tags: [], credits: [], memberSlugs: [],
    links: [{ platform: 'Bandcamp', url: 'https://other.bandcamp.com/album/other' }, { platform: 'Spotify', url: 'https://open.spotify.com/album/123' }],
    title: 'Not allowed', artist: 'Not allowed', buyUrl: 'https://wrong.example.com/', audio: 'https://audio.example.com/master.mp3',
  }, { slug: 'orphan-release', description: 'Cannot create music' }]);
  const merged = applyReleaseOverrides(catalog, overrides);
  assert.equal(merged.length, 1);
  for (const field of ['slug', 'code', 'bandcampId', 'bandcampType', 'title', 'artist', 'year', 'date', 'cover', 'tracklist', 'buyUrl']) assert.deepEqual(merged[0][field], catalog[0][field]);
  assert.equal(merged[0].description, 'Edited');
  assert.equal(merged[0].format, 'EP');
  assert.deepEqual(merged[0].tags, []);
  assert.deepEqual(merged[0].memberSlugs, []);
  assert.deepEqual(merged[0].links, [{ platform: 'Bandcamp', url: catalog[0].buyUrl }, { platform: 'Spotify', url: 'https://open.spotify.com/album/123' }]);
  assert.equal(catalog[0].description, 'Original');
  assert.doesNotMatch(JSON.stringify(overrides), /Not allowed|wrong\.example|master\.mp3/);
});

test('hidden releases disappear from effective feed, profile associations and lookup; empty override list retains catalog', () => {
  const catalog = [{ slug: 'visible', memberSlugs: ['amal'], description: 'Keep' }, { slug: 'hidden', memberSlugs: ['amal'] }];
  const merged = applyReleaseOverrides(catalog, parseReleaseOverrides([{ slug: 'hidden', hidden: true }, { slug: 'visible', description: '' }]));
  assert.deepEqual(merged.map(({ slug }) => slug), ['visible']);
  assert.equal(merged.find(({ slug }) => slug === 'hidden'), undefined);
  assert.deepEqual(selectArtistReleases({ ...artist, releaseSlugs: ['visible', 'hidden'] }, merged), merged);
  assert.equal(merged[0].description, '');
  assert.deepEqual(applyReleaseOverrides(catalog, []), catalog);
  assert.deepEqual(applyReleaseOverrides(catalog, parseReleaseOverrides([{ slug: 'hidden', hidden: false, format: '' }])), catalog);
});

test('invalid release editorial schema fails instead of changing protected data', () => {
  for (const input of [[{ slug: 'valid', hidden: 'false' }], [{ slug: 'valid', format: 'Video' }], [{ slug: 'valid', links: [{ platform: 'Bad', url: 'javascript:alert(1)' }] }],
    [{ slug: 'valid', memberSlugs: ['../artist'] }], [{ slug: 'valid', tags: [''] }], [{ slug: 'valid' }, { slug: 'valid' }]]) {
    assert.throws(() => parseReleaseOverrides(input));
  }
});

test('appearance allows bounded plain settings and rejects CSS, URL, image and opacity injection', () => {
  const appearance = parseAppearance({ backgroundColor: '#FDFDFD', textColor: '#1a1a1a', accentColor: '#123456',
    logoUrl: 'https://cms.hochiruns.com/logo.png', backgroundLogoUrl: '', backgroundImageUrl: 'https://cms.hochiruns.com/background.jpg', backgroundLogoOpacity: 0,
    css: 'body {display:none}', html: '<script>bad()</script>' });
  assert.equal(appearance.backgroundColor, '#fdfdfd');
  assert.equal(appearance.backgroundLogoOpacity, 0);
  assert.equal(appearance.backgroundLogoUrl, undefined);
  assert.deepEqual(appearanceCssVariables(appearance), { '--background': '#fdfdfd', '--foreground': '#1a1a1a', '--accent': '#123456' });
  assert.deepEqual(parseAppearance({}), {});
  assert.deepEqual(appearanceCssVariables(), {});
  for (const value of ['red', '#fff', '#ffffff;display:none', 'var(--bad)', 'url(https://bad.example.com/)']) assert.throws(() => parseAppearance({ textColor: value }));
  for (const value of ['javascript:alert(1)', 'data:image/svg+xml,bad', 'http://cms.hochiruns.com/logo.png', 'https://cms.hochiruns.com/master.mp3', 'https://cms.hochiruns.com/image.svg']) assert.throws(() => parseAppearance({ logoUrl: value }));
  for (const value of [-0.01, 0.31, NaN, Infinity, '0.1']) assert.throws(() => parseAppearance({ backgroundLogoOpacity: value }));
  assert.deepEqual(parsePluginContent(content([])), { version: 1, artists: [], products: [], shows: [], pages: {} });
  const extended = parsePluginContent({ ...content([]), releaseOverrides: [], appearance: {} });
  assert.deepEqual(extended.releaseOverrides, []);
  assert.deepEqual(extended.appearance, {});
});

test('explicit local WordPress prototype accepts only loopback plugin endpoints outside production', async () => {
  for (const url of ['http://127.0.0.1:9401/wp-json/hochi/v1/content', 'http://localhost:9401/?rest_route=/hochi/v1/content']) {
    const config = parseWordPressConfig({ WORDPRESS_CONTENT_URL: url, WORDPRESS_LOCAL_DEMO: '1', NODE_ENV: 'development' });
    assert.equal(config.localDemo, true);
    const loaded = await loadWordPressData(config, { resolveHost: async () => { throw new Error('Local demo must not use public DNS'); }, fetchImpl: async (source, init) => {
      assert.equal(source, config.url);
      assert.equal(init.redirect, 'error');
      return jsonResponse(content([]));
    } });
    assert.deepEqual(loaded.artists, []);
    assert.throws(() => parseWordPressConfig({ WORDPRESS_CONTENT_URL: url, WORDPRESS_LOCAL_DEMO: '1', NODE_ENV: 'production' }), /production/);
    assert.throws(() => parseWordPressConfig({ WORDPRESS_CONTENT_URL: url }), /HTTPS/);
  }
  for (const url of ['http://192.168.1.1:9401/wp-json/hochi/v1/content', 'http://2130706433:9401/wp-json/hochi/v1/content', 'http://localhost/wp-json/hochi/v1/content',
    'http://localhost:9401/?rest_route=/wp/v2/users', 'http://localhost:9401/?rest_route=/hochi/v1/content&secret=x', 'http://localhost:9401/wp-json/hochi/v1/content?secret=x',
    'https://cms.hochiruns.com/wp-json/hochi/v1/content']) assert.throws(() => parseWordPressConfig({ WORDPRESS_CONTENT_URL: url, WORDPRESS_LOCAL_DEMO: '1', NODE_ENV: 'development' }));
});

test('local demo images must match the exact WordPress uploads origin; purchase and social links remain HTTPS', () => {
  const options = { localDemo: true, imageOrigin: 'http://127.0.0.1:9401' };
  const image = 'http://127.0.0.1:9401/wp-content/uploads/2026/10/photo.png';
  const parsed = parsePluginContent({ ...content([{ ...artist, photo: image }]), products: [{ name: 'Shirt', price: '$20', image }], appearance: { logoUrl: image } }, options);
  assert.equal(parsed.artists[0].photo, image);
  assert.equal(parsed.products[0].image, image);
  assert.equal(parsed.appearance.logoUrl, image);
  for (const value of [image.replace('9401', '9402'), image.replace('127.0.0.1', 'localhost'), image.replace('/wp-content/uploads/', '/private/'), image.replace('.png', '.mp3'),
    'http://user:pass@127.0.0.1:9401/wp-content/uploads/photo.png']) assert.throws(() => parsePluginContent(content([{ ...artist, photo: value }]), options));
  assert.throws(() => parsePluginContent(content([{ ...artist, photo: image }])));
  assert.throws(() => parsePluginContent(content([{ ...artist, socials: [{ platform: 'Instagram', url: image }] }]), options));
  assert.throws(() => parsePluginContent({ ...content([]), products: [{ name: 'Shirt', price: '$20', buyUrl: image }] }, options));
  const previous = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    assert.throws(() => parsePluginContent(content([{ ...artist, photo: image }]), options), /production/);
  } finally {
    if (previous == null) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous;
  }
});

test('public address checks reject private, local, documentation, mapped and multicast networks', () => {
  for (const address of ['0.0.0.0', '10.0.0.1', '127.0.0.1', '169.254.169.254', '172.16.0.1', '192.168.0.1', '100.64.0.1', '198.18.0.1', '203.0.113.1', '224.0.0.1', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1', '2001:db8::1']) {
    assert.equal(isPublicAddress(address), false, address);
  }
  for (const address of ['8.8.8.8', '1.1.1.1', '2606:4700::1111']) assert.equal(isPublicAddress(address), true, address);
  assert.equal(publicHttpsUrl('https://public-api.wordpress.com/').hostname, 'public-api.wordpress.com');
});

test('JSON requests validate DNS before fetching, reject redirects, and use no authentication', async () => {
  let calls = 0;
  await assert.rejects(fetchWordPressJson(pluginUrl, { resolveHost: async () => [{ address: '127.0.0.1' }], fetchImpl: async () => { calls++; } }), /public addresses/);
  assert.equal(calls, 0);
  const result = await fetchWordPressJson(pluginUrl, { resolveHost: publicDns, fetchImpl: async (url, init) => {
    assert.equal(url, pluginUrl);
    assert.equal(init.redirect, 'error');
    assert.equal('Authorization' in init.headers, false);
    return jsonResponse(content());
  } });
  assert.equal(result.data.version, 1);
});

test('HTTP, malformed JSON, content-type, size and timeout failures propagate instead of returning seeds', async () => {
  const options = { resolveHost: publicDns };
  await assert.rejects(fetchWordPressJson(pluginUrl, { ...options, fetchImpl: async () => jsonResponse({}, { status: 503 }) }), /HTTP 503/);
  await assert.rejects(fetchWordPressJson(pluginUrl, { ...options, fetchImpl: async () => new Response('broken', { headers: { 'content-type': 'application/json' } }) }), /Invalid WordPress JSON/);
  await assert.rejects(fetchWordPressJson(pluginUrl, { ...options, fetchImpl: async () => new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }) }), /not JSON/);
  await assert.rejects(fetchWordPressJson(pluginUrl, { ...options, maxBytes: 3, fetchImpl: async () => jsonResponse({}, { headers: { 'content-type': 'application/json', 'content-length': '4' } }) }), /too large/);
  await assert.rejects(fetchWordPressJson(pluginUrl, { ...options, maxBytes: 3, fetchImpl: async () => jsonResponse({ data: 'large' }) }), /too large/);
  await assert.rejects(fetchWordPressJson(pluginUrl, { timeoutMs: 5, resolveHost: async () => new Promise(() => {}) }), /timed out/);
  await assert.rejects(loadWordPressData(parseWordPressConfig({ WORDPRESS_CONTENT_URL: pluginUrl }), { ...options, fetchImpl: async () => jsonResponse({ version: 1, artists: 'broken' }) }), /Invalid/);
});

test('native collection pagination is complete and invalid/changing totals fail', async () => {
  const config = parseWordPressConfig({ WORDPRESS_ARTISTS_URL: nativeUrl, WORDPRESS_MANAGED_ARTIST_SLUGS: 'amal,new-artist' });
  const urls = [];
  const loaded = await loadWordPressData(config, { resolveHost: publicDns, fetchImpl: async (url) => {
    urls.push(url);
    const page = new URL(url).searchParams.get('page');
    return jsonResponse([post(page === '1' ? 'amal' : 'new-artist')], { headers: { 'content-type': 'application/json', 'x-wp-totalpages': '2' } });
  } });
  assert.deepEqual(loaded.artists.map(({ slug }) => slug), ['amal', 'new-artist']);
  assert.equal(urls.length, 2);
  assert.deepEqual(await loadWordPressData(config, { resolveHost: publicDns, fetchImpl: async () => jsonResponse([], { headers: { 'content-type': 'application/json', 'x-wp-totalpages': '0' } }) }), { artists: [] });
  await assert.rejects(loadWordPressData(config, { resolveHost: publicDns, fetchImpl: async () => jsonResponse([], { headers: { 'content-type': 'application/json', 'x-wp-totalpages': 'bad' } }) }), /pagination/);
});
