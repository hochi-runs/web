import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  LABEL_URL, fetchHtml, normalizeBandcampUrl, parseCatalogItems,
  parseCatalogListing, parseReleaseMetadata, syncCatalog,
} from "./sync-bandcamp.mjs";

const ALBUM_URL = "https://hochiruns.bandcamp.com/album/example";
const TRACK_URL = "https://amaldc.bandcamp.com/track/new-single";

function listing(overflow = []) {
  const encoded = JSON.stringify(overflow).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  return `<ol id="music-grid" data-client-items="${encoded}">
    <li class="music-grid-item" data-item-id="album-123"><a href="/album/example?label=42&amp;tab=music">Example</a></li>
  </ol>`;
}

function releaseHtml(url = ALBUM_URL, overrides = {}) {
  const single = url.includes("/track/");
  return `<script type="application/ld+json">${JSON.stringify({
    "@type": single ? "MusicRecording" : "MusicAlbum",
    mainEntityOfPage: url,
    name: "Sound &amp; Rhythm",
    byArtist: { name: "Artist &amp; Friends" },
    datePublished: "01 May 2026 00:00:00 GMT",
    image: "https://f4.bcbits.com/img/a123456_10.jpg",
    description: "<b>Release description</b><br>Second line",
    creditText: "Produced by Artist",
    keywords: ["electronic", "electronic", "house"],
    track: { itemListElement: [{ position: 1, item: {
      name: "First track", duration: "P00H03M02S",
      audio: { contentUrl: "https://audio.example/paid-master.wav" },
    } }] },
    duration: "PT4M42S",
    ...overrides,
  }).replaceAll("<", "\\u003c")}</script>`;
}

function response(body, init = {}) {
  return new Response(body, { headers: { "content-type": "text/html" }, ...init });
}

test("catalog discovery combines rendered and overflow items in curated order, decoding entities and deduplicating canonical links", () => {
  const html = listing([
    { id: 123, type: "album", page_url: `${ALBUM_URL}?label=42&tab=music` },
    { id: 456, type: "track", page_url: `${TRACK_URL}?label=42&tab=music` },
    { type: "merch", page_url: "https://shop.example/item" },
  ]);
  assert.deepEqual(parseCatalogItems(html), [
    { buyUrl: ALBUM_URL, bandcampType: "album", bandcampId: 123 },
    { buyUrl: TRACK_URL, bandcampType: "track", bandcampId: 456 },
  ]);
  assert.deepEqual(parseCatalogListing(html), [ALBUM_URL, TRACK_URL]);
});

test("catalog rejects challenge, empty, corrupt JSON, and contradictory release types", () => {
  assert.throws(() => parseCatalogListing("<html><h1>Please verify you are human</h1></html>"), /missing/);
  assert.throws(() => parseCatalogListing('<ol id="music-grid"></ol>'), /empty/);
  assert.throws(() => parseCatalogListing('<ol id="music-grid" data-client-items="broken"></ol>'), /Invalid/);
  assert.throws(() => parseCatalogListing(listing([{ type: "track", page_url: ALBUM_URL }])), /type/);
  assert.throws(() => parseCatalogListing(listing([{ type: "track", page_url: TRACK_URL }])), /ID/);
  assert.throws(() => parseCatalogListing(listing([{ id: 123, type: "album", page_url: "https://hochiruns.bandcamp.com/album/conflicting" }])), /conflicting/);
  assert.throws(() => parseCatalogListing(listing([{ id: 456, type: "album", page_url: ALBUM_URL }])), /conflicting/);
});

test("release URL allowlist permits curated artist stores and refuses unrelated origins, credentials, unsafe paths, and HTTP", () => {
  assert.equal(normalizeBandcampUrl("https://autolola333.bandcamp.com/album/sleep/?label=1#x"), "https://autolola333.bandcamp.com/album/sleep");
  for (const url of [
    "http://hochiruns.bandcamp.com/album/example",
    "https://hochiruns.bandcamp.com.evil.test/album/example",
    "https://evil.test/album/example",
    "https://deep.artist.bandcamp.com/album/example",
    "https://bandcamp.com/album/example",
    "https://user:password@hochiruns.bandcamp.com/album/example",
    "https://hochiruns.bandcamp.com:8443/album/example",
    "https://hochiruns.bandcamp.com/api/catalog",
    "https://hochiruns.bandcamp.com/album/%2e%2e/private",
    "https://hochiruns.bandcamp.com/track/audio.mp3",
  ]) assert.throws(() => normalizeBandcampUrl(url));
});

test("album JSON-LD maps metadata, UTC date, artwork, credits, tags, and track durations without copying media URL objects", () => {
  const release = parseReleaseMetadata(releaseHtml(), ALBUM_URL);
  assert.deepEqual(release, {
    buyUrl: ALBUM_URL, title: "Sound & Rhythm", artist: "Artist & Friends", format: "Album",
    year: 2026, date: "01 May 2026", releasedAt: "2026-05-01T00:00:00.000Z",
    cover: "https://f4.bcbits.com/img/a123456_10.jpg",
    description: "Release description\nSecond line", credits: [{ role: "Credits", name: "Produced by Artist" }],
    tags: ["electronic", "house"], tracklist: [{ title: "First track", duration: "3:02" }],
  });
  assert.doesNotMatch(JSON.stringify(release), /audio|contentUrl|paid-master|\.wav/);
});

test("single metadata and JSON-LD graphs map without importing audio, scripts, or text URLs", () => {
  const html = releaseHtml(TRACK_URL, {
    description: '<script>danger()</script>Listen https://audio.example/secret.mp3',
    audio: { contentUrl: "https://audio.example/secret.mp3" },
  });
  const json = JSON.parse(html.replace('<script type="application/ld+json">', "").replace("</script>", ""));
  const graphHtml = `<script type="application/ld+json">${JSON.stringify({ "@graph": [json] }).replaceAll("<", "\\u003c")}</script>`;
  const release = parseReleaseMetadata(graphHtml, TRACK_URL);
  assert.equal(release.format, "Single");
  assert.equal(release.description, "Listen");
  assert.deepEqual(release.tracklist, [{ title: "Sound & Rhythm", duration: "4:42" }]);
  assert.doesNotMatch(JSON.stringify(release), /secret|danger|\.mp3|contentUrl/);
});

test("album paths respect Bandcamp's SingleRelease, EPRelease, and CompilationAlbum display formats", () => {
  assert.equal(parseReleaseMetadata(releaseHtml(ALBUM_URL, { albumReleaseType: "SingleRelease" }), ALBUM_URL).format, "Single");
  assert.equal(parseReleaseMetadata(releaseHtml(ALBUM_URL, { albumReleaseType: "EPRelease" }), ALBUM_URL).format, "EP");
  assert.equal(parseReleaseMetadata(releaseHtml(ALBUM_URL, { albumReleaseType: "CompilationAlbum" }), ALBUM_URL).format, "Compilation");
});

test("metadata refuses challenge pages, missing fields, unrelated releases, corrupt JSON, and non-artwork URLs", () => {
  assert.throws(() => parseReleaseMetadata("<h1>Challenge</h1>", ALBUM_URL), /missing/);
  assert.throws(() => parseReleaseMetadata(releaseHtml(ALBUM_URL, { datePublished: "invalid" }), ALBUM_URL), /date/);
  assert.throws(() => parseReleaseMetadata(releaseHtml(ALBUM_URL, { byArtist: null }), ALBUM_URL), /artist/);
  assert.throws(() => parseReleaseMetadata(releaseHtml(TRACK_URL), ALBUM_URL), /missing/);
  assert.throws(() => parseReleaseMetadata(releaseHtml(ALBUM_URL, { mainEntityOfPage: "https://hochiruns.bandcamp.com/album/other" }), ALBUM_URL), /different/);
  assert.throws(() => parseReleaseMetadata('<script type="application/ld+json">{broken}</script>', ALBUM_URL), /Invalid/);
  for (const image of ["https://audio.example/file.mp3", "https://f4.bcbits.com/stream/secret", "http://f4.bcbits.com/img/a123_10.jpg"]) {
    assert.throws(() => parseReleaseMetadata(releaseHtml(ALBUM_URL, { image }), ALBUM_URL), /artwork/);
  }
});

test("fetch follows safe release redirects manually and returns the canonical final page URL", async () => {
  const calls = [];
  const page = await fetchHtml(ALBUM_URL, { fetchImpl: async (url, options) => {
    calls.push(url);
    assert.equal(options.redirect, "manual");
    return calls.length === 1 ? response(null, { status: 302, headers: { location: TRACK_URL } }) : response("<html>safe</html>");
  } });
  assert.deepEqual(calls, [ALBUM_URL, TRACK_URL]);
  assert.deepEqual(page, { html: "<html>safe</html>", url: TRACK_URL });
});

test("redirects cannot escape the allowlist or request media/API paths", async () => {
  for (const target of ["https://evil.test/album/example", "http://hochiruns.bandcamp.com/album/example", "https://hochiruns.bandcamp.com/api/data", "https://f4.bcbits.com/stream/audio.mp3"]) {
    let calls = 0;
    await assert.rejects(fetchHtml(ALBUM_URL, { fetchImpl: async () => {
      calls++;
      return response(null, { status: 302, headers: { location: target } });
    } }));
    assert.equal(calls, 1);
  }
  await assert.rejects(fetchHtml(ALBUM_URL, { fetchImpl: async () => response(null, { status: 302, headers: { location: ALBUM_URL } }) }), /limit/);
});

test("fetch refuses HTTP errors, non-HTML content, and both declared and streamed oversized pages", async () => {
  await assert.rejects(fetchHtml(ALBUM_URL, { fetchImpl: async () => response("missing", { status: 404 }) }), /HTTP 404/);
  await assert.rejects(fetchHtml(ALBUM_URL, { fetchImpl: async () => response("audio", { headers: { "content-type": "audio/mpeg" } }) }), /HTML/);
  await assert.rejects(fetchHtml(ALBUM_URL, { maxBytes: 3, fetchImpl: async () => response("safe", { headers: { "content-type": "text/html", "content-length": "4" } }) }), /size/);
  await assert.rejects(fetchHtml(ALBUM_URL, { maxBytes: 3, fetchImpl: async () => response("safe") }), /size/);
});

test("fetch aborts a stalled request on its bounded timeout", async () => {
  await assert.rejects(fetchHtml(ALBUM_URL, { timeoutMs: 5, fetchImpl: async (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
  }) }), /aborted/);
});

test("sync atomically stores sanitized records, bounds concurrency, preserves curated order, and is stable on a repeat", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hochi-catalog-test-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const outputPath = path.join(directory, "catalog.json");
  let active = 0;
  let peak = 0;
  const request = async (url) => {
    if (url === LABEL_URL) return listing([{ id: 456, type: "track", page_url: TRACK_URL }]);
    peak = Math.max(peak, ++active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    return releaseHtml(url);
  };
  const result = await syncCatalog({ outputPath, request, concurrency: 1, log() {} });
  assert.equal(peak, 1);
  assert.equal(result.changed, true);
  assert.equal(result.count, 2);
  const stored = JSON.parse(await readFile(outputPath, "utf8"));
  assert.equal(stored.version, 1);
  assert.deepEqual(stored.releases.map(({ buyUrl, bandcampId, bandcampType }) => ({ buyUrl, bandcampId, bandcampType })), [
    { buyUrl: ALBUM_URL, bandcampId: 123, bandcampType: "album" },
    { buyUrl: TRACK_URL, bandcampId: 456, bandcampType: "track" },
  ]);
  assert.deepEqual(await readdir(directory), ["catalog.json"]);
  assert.equal((await syncCatalog({ outputPath, request, log() {} })).changed, false);
});

test("an invalid or unavailable listing/release never replaces the previous complete snapshot", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hochi-catalog-test-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const outputPath = path.join(directory, "catalog.json");
  const previous = '{"version":1,"releases":[{"title":"Last good snapshot"}]}\n';
  await writeFile(outputPath, previous);
  const sources = [
    async () => "<h1>Security challenge</h1>",
    async (url) => url === LABEL_URL ? listing([{ id: 456, type: "track", page_url: TRACK_URL }]) : url === ALBUM_URL ? releaseHtml() : "<h1>Deleted release</h1>",
    async (url) => { if (url === LABEL_URL) return listing(); throw new Error("HTTP 429"); },
  ];
  for (const request of sources) {
    await assert.rejects(syncCatalog({ outputPath, request, log() {} }));
    assert.equal(await readFile(outputPath, "utf8"), previous);
    assert.deepEqual(await readdir(directory), ["catalog.json"]);
  }
});

test("check mode validates and compares without writing", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hochi-catalog-test-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const outputPath = path.join(directory, "catalog.json");
  await writeFile(outputPath, "old snapshot");
  const result = await syncCatalog({ outputPath, check: true, request: async (url) => url === LABEL_URL ? listing() : releaseHtml(url), log() {} });
  assert.equal(result.changed, true);
  assert.equal(await readFile(outputPath, "utf8"), "old snapshot");
});

test("sync rejects a redirect that changes the immutable listing type", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hochi-catalog-test-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const outputPath = path.join(directory, "catalog.json");
  await assert.rejects(syncCatalog({ outputPath, request: async (url) => url === LABEL_URL ? listing() : { html: releaseHtml(TRACK_URL), url: TRACK_URL }, log() {} }), /type/);
  assert.deepEqual(await readdir(directory), []);
});
