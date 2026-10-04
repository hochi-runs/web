#!/usr/bin/env node
/**
 * Import public catalog metadata only. Run outside Vercel (for example in
 * GitHub Actions). No audio, checkout data, or raw page HTML is persisted.
 */
import { load } from "cheerio";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const LABEL_URL = "https://hochiruns.bandcamp.com/music";
export const MAX_PAGE_BYTES = 4 * 1024 * 1024;
const TIMEOUT_MS = 20_000;
const MAX_RELEASES = 500;
const STOREFRONT_HOST = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.bandcamp\.com$/;
const COVER_HOST = /^f[0-9]+\.bcbits\.com$/;

export function normalizeBandcampUrl(value, base = LABEL_URL, allowListing = false) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Missing Bandcamp URL");
  }
  const url = new URL(value, base);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !STOREFRONT_HOST.test(url.hostname)
  ) {
    throw new Error("Only HTTPS Bandcamp storefront URLs are allowed");
  }
  const pathname = url.pathname.replace(/\/$/, "");
  const isRelease = /^\/(album|track)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname);
  const isListing = allowListing && url.hostname === "hochiruns.bandcamp.com" && pathname === "/music";
  if (!isRelease && !isListing) {
    throw new Error("Only Bandcamp release pages and the label music listing are allowed");
  }
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url.href;
}

function catalogItem(buyUrl, id, type) {
  const bandcampType = new URL(buyUrl).pathname.startsWith("/track/") ? "track" : "album";
  if (type && type !== bandcampType) throw new Error("Bandcamp listing type does not match its release URL");
  const bandcampId = Number(id);
  if (!Number.isSafeInteger(bandcampId) || bandcampId <= 0) throw new Error("Bandcamp listing is missing a valid release ID");
  return {
    buyUrl,
    bandcampType,
    bandcampId,
  };
}

export function parseCatalogItems(html) {
  const $ = load(html);
  const grid = $("#music-grid");
  if (grid.length !== 1) throw new Error("Bandcamp music grid is missing; refusing to replace the catalog");
  const items = [];
  grid.find("li.music-grid-item").each((_, item) => {
    const href = $(item).find("a[href]").first().attr("href");
    const identity = /^(album|track)-(\d+)$/.exec($(item).attr("data-item-id") ?? "");
    items.push(catalogItem(normalizeBandcampUrl(href), identity?.[2], identity?.[1]));
  });

  // Bandcamp renders an initial set of cards and stores the remaining cards
  // in data-client-items. Both are needed; neither alone is the full catalog.
  const overflow = grid.attr("data-client-items") ?? grid.attr("data-items");
  if (overflow !== undefined) {
    let remaining;
    try { remaining = JSON.parse(overflow); } catch { throw new Error("Invalid Bandcamp catalog JSON"); }
    if (!Array.isArray(remaining)) throw new Error("Bandcamp catalog JSON must be an array");
    for (const item of remaining) {
      if (item?.type !== "album" && item?.type !== "track") continue;
      items.push(catalogItem(normalizeBandcampUrl(item.page_url ?? item.item_url), item.id, item.type));
    }
  }
  const byUrl = new Map();
  const byIdentity = new Map();
  for (const item of items) {
    const identity = `${item.bandcampType}:${item.bandcampId}`;
    const previous = byUrl.get(item.buyUrl);
    if (previous && `${previous.bandcampType}:${previous.bandcampId}` !== identity) {
      throw new Error("Duplicate Bandcamp URL has conflicting release IDs");
    }
    if (byIdentity.has(identity) && byIdentity.get(identity) !== item.buyUrl) {
      throw new Error("Duplicate Bandcamp release ID has conflicting URLs");
    }
    byUrl.set(item.buyUrl, item);
    byIdentity.set(identity, item.buyUrl);
  }
  const unique = [...byUrl.values()];
  if (unique.length === 0 || unique.length > MAX_RELEASES) {
    throw new Error("Bandcamp catalog is empty or unexpectedly large; refusing to replace the catalog");
  }
  return unique;
}

export function parseCatalogListing(html) {
  return parseCatalogItems(html).map((item) => item.buyUrl);
}

function cleanText(value, limit = 12_000) {
  if (typeof value !== "string") return "";
  const $ = load(value, null, false);
  $("script, style").remove();
  $("br").replaceWith("\n");
  return $.root().text()
    .replace(/https?:\/\/[^\s<>]+/gi, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim().slice(0, limit);
}

function objectsInJsonLd(value) {
  if (Array.isArray(value)) return value.flatMap(objectsInJsonLd);
  if (!value || typeof value !== "object") return [];
  return [value, ...objectsInJsonLd(value["@graph"])];
}

function hasType(value, type) {
  const types = value?.["@type"];
  return Array.isArray(types) ? types.includes(type) : types === type;
}

function durationLabel(value) {
  if (typeof value !== "string") return undefined;
  const match = /^P(?:T)?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(value);
  if (!match || !match.slice(1).some(Boolean)) return undefined;
  const seconds = Math.floor(Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function coverUrl(value) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const source = typeof candidate === "object" && candidate ? candidate.url : candidate;
  if (typeof source !== "string") return undefined;
  const url = new URL(source);
  if (
    url.protocol !== "https:" || url.username || url.password || url.port ||
    !COVER_HOST.test(url.hostname) || !/^\/img\/a[0-9]+_[0-9]+\.(jpg|png|webp)$/.test(url.pathname)
  ) throw new Error("Bandcamp cover must be a public artwork image");
  url.search = "";
  url.hash = "";
  return url.href;
}

export function parseReleaseMetadata(html, sourceUrl) {
  const buyUrl = normalizeBandcampUrl(sourceUrl);
  const $ = load(html);
  const objects = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    try { objects.push(...objectsInJsonLd(JSON.parse($(element).text()))); }
    catch { throw new Error("Invalid Bandcamp release JSON-LD"); }
  });
  const isTrack = new URL(buyUrl).pathname.startsWith("/track/");
  const expectedType = isTrack ? "MusicRecording" : "MusicAlbum";
  const metadata = objects.find((object) => hasType(object, expectedType));
  if (!metadata) throw new Error(`Bandcamp ${expectedType} metadata is missing`);
  if (normalizeBandcampUrl(metadata.mainEntityOfPage ?? metadata["@id"] ?? buyUrl) !== buyUrl) {
    throw new Error("Bandcamp metadata describes a different release");
  }
  const title = cleanText(metadata.name, 500);
  const artists = Array.isArray(metadata.byArtist) ? metadata.byArtist : [metadata.byArtist];
  const artist = artists.map((entry) => cleanText(typeof entry === "string" ? entry : entry?.name, 500)).filter(Boolean).join(", ");
  const releasedAt = new Date(metadata.datePublished);
  if (!title || !artist || Number.isNaN(releasedAt.getTime()) || !metadata.datePublished) {
    throw new Error("Bandcamp release is missing its title, artist, or release date");
  }
  const formatType = String(metadata.albumReleaseType ?? "");
  const format = isTrack || /SingleRelease/.test(formatType) ? "Single" : /EPRelease/.test(formatType) ? "EP" : /Compilation/.test(formatType) ? "Compilation" : "Album";
  const release = {
    buyUrl,
    title,
    artist,
    format,
    year: releasedAt.getUTCFullYear(),
    date: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(releasedAt),
    releasedAt: releasedAt.toISOString(),
  };
  const cover = coverUrl(metadata.image);
  if (cover) release.cover = cover;
  const description = cleanText(metadata.description);
  if (description) release.description = description;
  const credits = cleanText(metadata.creditText);
  if (credits) release.credits = [{ role: "Credits", name: credits }];
  if (Array.isArray(metadata.keywords)) {
    const tags = [...new Set(metadata.keywords.map((tag) => cleanText(tag, 200)).filter(Boolean))];
    if (tags.length) release.tags = tags.slice(0, 50);
  }
  const tracks = isTrack ? [metadata] : metadata.track?.itemListElement;
  if (Array.isArray(tracks)) {
    const tracklist = tracks.map((entry) => {
      const track = entry.item ?? entry;
      const trackTitle = cleanText(track.name, 500);
      if (!trackTitle) throw new Error("Bandcamp track metadata is missing a title");
      const duration = durationLabel(track.duration);
      return duration ? { title: trackTitle, duration } : { title: trackTitle };
    });
    if (tracklist.length) release.tracklist = tracklist;
  }
  return release;
}

export async function fetchHtml(sourceUrl, { fetchImpl = fetch, maxBytes = MAX_PAGE_BYTES, timeoutMs = TIMEOUT_MS } = {}) {
  let url = normalizeBandcampUrl(sourceUrl, LABEL_URL, true);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let redirect = 0; redirect <= 4; redirect++) {
      const response = await fetchImpl(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "HochiRunsCatalogSync/1.0 (public metadata only)", Accept: "text/html" },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const target = response.headers.get("location");
        await response.body?.cancel();
        if (!target || redirect === 4) throw new Error("Bandcamp redirect is missing or exceeds the limit");
        url = normalizeBandcampUrl(target, url, sourceUrl === LABEL_URL);
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`Bandcamp request failed with HTTP ${response.status}`);
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!/^text\/html\b/i.test(contentType)) {
        await response.body?.cancel();
        throw new Error("Bandcamp response is not an HTML page");
      }
      if (Number(response.headers.get("content-length")) > maxBytes) {
        await response.body?.cancel();
        throw new Error("Bandcamp response exceeds the page size limit");
      }
      if (!response.body) throw new Error("Bandcamp response body is empty");
      const chunks = [];
      let size = 0;
      for await (const chunk of response.body) {
        size += chunk.byteLength;
        if (size > maxBytes) {
          controller.abort();
          throw new Error("Bandcamp response exceeds the page size limit");
        }
        chunks.push(chunk);
      }
      return { html: Buffer.concat(chunks).toString("utf8"), url };
    }
    throw new Error("Bandcamp redirect limit exceeded");
  } finally {
    clearTimeout(timer);
  }
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const result = new Array(items.length);
  let cursor = 0;
  let failure;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (!failure && cursor < items.length) {
      const index = cursor++;
      try { result[index] = await mapper(items[index]); }
      catch (error) { failure ??= error; }
    }
  });
  await Promise.all(workers);
  if (failure) throw failure;
  return result;
}

export async function syncCatalog({ outputPath, check = false, request = fetchHtml, concurrency = 3, log = console.log } = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 5) throw new Error("Concurrency must be between 1 and 5");
  if (!outputPath) throw new Error("Catalog output path is required");
  const listing = await request(LABEL_URL);
  const items = parseCatalogItems(typeof listing === "string" ? listing : listing.html);
  const releases = await mapWithConcurrency(items, concurrency, async (item) => {
    const page = await request(item.buyUrl);
    const finalUrl = typeof page === "string" ? item.buyUrl : page.url;
    if (new URL(finalUrl).pathname.startsWith("/track/") !== (item.bandcampType === "track")) {
      throw new Error("Bandcamp redirect changed the listing release type");
    }
    const release = parseReleaseMetadata(typeof page === "string" ? page : page.html, finalUrl);
    return { ...release, bandcampId: item.bandcampId, bandcampType: item.bandcampType };
  });
  if (new Set(releases.map((release) => release.buyUrl)).size !== releases.length) {
    throw new Error("Multiple catalog entries resolve to the same release; refusing to replace the catalog");
  }
  const snapshot = { version: 1, releases };
  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  let previous = "";
  try { previous = await readFile(outputPath, "utf8"); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const changed = serialized !== previous;
  if (changed && !check) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    const temporary = `${outputPath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, serialized, { flag: "wx" });
      await rename(temporary, outputPath);
    } finally {
      await rm(temporary, { force: true });
    }
  }
  log(`Validated ${releases.length} Bandcamp releases; snapshot ${changed ? check ? "would change (check only)" : "updated" : "unchanged"}.`);
  return { changed, count: releases.length, snapshot };
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const args = process.argv.slice(2);
  if (args.some((argument) => argument !== "--check")) {
    console.error("Usage: node scripts/sync-bandcamp.mjs [--check]");
    process.exitCode = 1;
  } else {
    const projectPath = path.resolve(path.dirname(scriptPath), "..");
    try {
      const result = await syncCatalog({ outputPath: path.join(projectPath, "src/data/bandcamp-catalog.json"), check: args.includes("--check") });
      if (args.includes("--check") && result.changed) process.exitCode = 1;
    } catch (error) {
      console.error(`Bandcamp sync failed; existing snapshot was preserved: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
