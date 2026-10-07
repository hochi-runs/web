import { load } from "cheerio";

const MAX_EMBED_BYTES = 1024 * 1024;
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};

/** Development previews remain available only on the local browser origin. */
export function isLocalBandcampPreviewRequest(request, environment = process.env.NODE_ENV) {
  if (environment !== "development") return false;
  try {
    const url = new URL(request.url);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return false;
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return false;
    const origin = request.headers.get("origin");
    if (origin !== null && origin !== url.origin) return false;
    const site = request.headers.get("sec-fetch-site");
    return site === null || site === "same-origin" || site === "none";
  } catch {
    return false;
  }
}

/** Configured hosted previews require an exact public HTTPS origin, never a URL path. */
export function isBandcampPreviewOrigin(value) {
  if (typeof value !== "string" || value.length > 261) return false;
  try {
    const url = new URL(value);
    return value === url.origin && url.protocol === "https:"
      && !url.username && !url.password && !url.port
      && url.hostname.length <= 253
      && /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(url.hostname)
      && !/\.(?:localhost|local|localdomain|internal|home|lan|test|invalid|example|arpa|onion)$/.test(url.hostname);
  } catch {
    return false;
  }
}

/** Hosted previews are opt-in and restricted to server-configured same-origin requests. */
export function isBandcampPreviewRequest(request, environment = process.env.NODE_ENV, allowedOrigins = []) {
  if (isLocalBandcampPreviewRequest(request, environment)) return true;
  if (environment !== "production" || !Array.isArray(allowedOrigins)) return false;
  try {
    const url = new URL(request.url);
    if (url.protocol !== "https:" || url.username || url.password || url.port
      || !allowedOrigins.some((origin) => origin === url.origin && isBandcampPreviewOrigin(origin))) return false;
    const origin = request.headers.get("origin");
    if (origin !== null && origin !== url.origin) return false;
    const site = request.headers.get("sec-fetch-site");
    return site === null || site === "same-origin" || site === "none";
  } catch {
    return false;
  }
}

/** A preview URL is accepted only from the fixed public embed, never from a request. */
export function isBandcampPreviewUrl(value) {
  if (typeof value !== "string" || value.length > 8192
    || !/^https:\/\/t\d+\.bcbits\.com\/stream\/[^\s]+$/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /^t\d+\.bcbits\.com$/.test(url.hostname)
      && !url.username && !url.password && !url.port && !url.hash
      && url.pathname.startsWith("/stream/") && url.pathname.length > "/stream/".length;
  } catch {
    return false;
  }
}

function isOff(value) {
  return value === null || value === false || value === 0;
}

function isPublicRelease(metadata) {
  if (metadata.track_private !== undefined && !isOff(metadata.track_private)) return false;
  // Standalone tracks use track_private; only album embeds have album_private.
  // Require the track's explicit public flag rather than treating absence as public.
  return isOff(metadata.album_private)
    || (metadata.album_private === undefined && metadata.album_id === null && isOff(metadata.track_private));
}

/** Parse only explicitly public, streaming MP3 previews from the embed metadata. */
export function parseBandcampPreview(html) {
  const $ = load(html);
  const scripts = $("script[data-player-data]");
  if (scripts.length !== 1) throw new Error("Preview unavailable");
  const metadata = JSON.parse(scripts.attr("data-player-data") ?? "");
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)
    || ![1, true].includes(metadata.band_enabled)
    || !isOff(metadata.killed) || !isPublicRelease(metadata)
    || !isOff(metadata.subscriber_only) || !isOff(metadata.exclusive_show_anywhere)
    || ![1, true].includes(metadata.no_exclusive_data)
    || !Array.isArray(metadata.exclusive_permitted_domains) || metadata.exclusive_permitted_domains.length
    || !Array.isArray(metadata.tracks) || metadata.tracks.length > 1000) {
    throw new Error("Preview unavailable");
  }
  const candidates = metadata.tracks.filter((track) => track && typeof track === "object"
    && [true, 1].includes(track.track_streaming)
    && isBandcampPreviewUrl(track.file?.["mp3-128"]));
  const selected = candidates.find((track) => track.id === metadata.featured_track_id) ?? candidates[0];
  if (!selected) throw new Error("Preview unavailable");
  return selected.file["mp3-128"];
}

function validRange(value) {
  if (value === null) return true;
  if (value.length > 128) return false;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return false;
  const first = match[1] ? Number(match[1]) : undefined;
  const last = match[2] ? Number(match[2]) : undefined;
  if ((first !== undefined && !Number.isSafeInteger(first))
    || (last !== undefined && !Number.isSafeInteger(last))) return false;
  return first === undefined ? last > 0 : last === undefined || first <= last;
}

function unavailable(request, status = 502, extraHeaders = {}) {
  return new Response(request.method === "HEAD" ? null : "Audio preview unavailable.", {
    status,
    headers: { ...RESPONSE_HEADERS, "Content-Type": "text/plain; charset=utf-8", ...extraHeaders },
  });
}

function cancellationScope(request) {
  const controller = new AbortController();
  let timer;
  const abort = () => controller.abort(new Error("Preview interrupted"));
  request.signal.addEventListener("abort", abort, { once: true });
  if (request.signal.aborted) abort();
  return {
    signal: controller.signal,
    abort,
    deadline(milliseconds) {
      clearTimeout(timer);
      timer = setTimeout(abort, milliseconds);
    },
    clearDeadline() { clearTimeout(timer); },
    cleanup() {
      clearTimeout(timer);
      request.signal.removeEventListener("abort", abort);
    },
  };
}

function abortable(promise, signal) {
  if (signal.aborted) return Promise.reject(new Error("Preview interrupted"));
  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error("Preview interrupted"));
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve(promise).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

async function readEmbed(response, scope) {
  if (!response.body) throw new Error("Preview unavailable");
  const declared = response.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_EMBED_BYTES)) {
    await response.body.cancel();
    throw new Error("Preview unavailable");
  }
  const reader = response.body.getReader();
  const parts = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await abortable(reader.read(), scope.signal);
      if (done) return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts));
      size += value.byteLength;
      if (size > MAX_EMBED_BYTES) throw new Error("Preview unavailable");
      parts.push(value);
    }
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

function streamPreview(response, scope, idleTimeoutMs) {
  const reader = response.body.getReader();
  let finished = false;
  let output;
  const cleanup = () => {
    scope.signal.removeEventListener("abort", interrupted);
    scope.cleanup();
  };
  const interrupted = () => {
    if (finished) return;
    finished = true;
    output.error(new Error("Audio preview interrupted."));
    void reader.cancel().catch(() => {});
    cleanup();
  };
  return new ReadableStream({
    start(controller) {
      output = controller;
      scope.signal.addEventListener("abort", interrupted, { once: true });
      if (scope.signal.aborted) interrupted();
    },
    async pull(controller) {
      if (finished) return;
      scope.deadline(idleTimeoutMs);
      try {
        const { value, done } = await abortable(reader.read(), scope.signal);
        scope.clearDeadline();
        if (finished) return;
        if (done) {
          finished = true;
          controller.close();
          reader.releaseLock();
          cleanup();
        } else controller.enqueue(value);
      } catch {
        interrupted();
        scope.abort();
      }
    },
    async cancel() {
      if (finished) return;
      finished = true;
      scope.abort();
      cleanup();
      await reader.cancel().catch(() => {});
    },
  });
}

/**
 * A public Bandcamp preview through a same-origin audio element, local by default
 * and available on hosted origins only when explicitly configured by the server.
 * No cookies, browser-supplied URLs, or stored audio copies.
 * @param {{request: Request, slug: string,
 *   releases: Array<{slug: string, bandcampId?: number, bandcampType?: "album" | "track"}>,
 *   environment?: string, allowedOrigins?: string[], fetchImpl?: typeof fetch,
 *   timeoutMs?: number, idleTimeoutMs?: number}} options
 */
export async function createBandcampPreviewResponse({
  request, slug, releases, environment = process.env.NODE_ENV, allowedOrigins = [], fetchImpl = fetch,
  timeoutMs = 10_000, idleTimeoutMs = 30_000,
}) {
  if (!isBandcampPreviewRequest(request, environment, allowedOrigins)) return unavailable(request, 404);
  if (!["GET", "HEAD"].includes(request.method)) return unavailable(request, 405, { Allow: "GET, HEAD" });
  const release = releases.find((entry) => entry.slug === slug);
  if (!release || !Number.isSafeInteger(release.bandcampId) || release.bandcampId <= 0
    || !["album", "track"].includes(release.bandcampType)) return unavailable(request, 404);
  const range = request.headers.get("range");
  if (!validRange(range)) return unavailable(request, 416);
  const scope = cancellationScope(request);
  let handedOff = false;
  try {
    scope.deadline(timeoutMs);
    const embedUrl = `https://bandcamp.com/EmbeddedPlayer/${release.bandcampType}=${release.bandcampId}/size=small/bgcol=ffffff/linkcol=333333/artwork=none/transparent=true/`;
    const embed = await abortable(fetchImpl(embedUrl, {
      method: "GET", redirect: "error", credentials: "omit", cache: "no-store",
      headers: { Accept: "text/html" }, signal: scope.signal,
    }), scope.signal);
    if (embed.status !== 200 || embed.redirected) {
      await embed.body?.cancel();
      throw new Error("Preview unavailable");
    }
    const previewUrl = parseBandcampPreview(await readEmbed(embed, scope));
    scope.deadline(timeoutMs);
    const upstream = await abortable(fetchImpl(previewUrl, {
      method: request.method, redirect: "error", credentials: "omit", cache: "no-store",
      headers: { Accept: "audio/mpeg", ...(range ? { Range: range } : {}) }, signal: scope.signal,
    }), scope.signal);
    scope.clearDeadline();
    if (upstream.status === 416) {
      await upstream.body?.cancel();
      const contentRange = upstream.headers.get("content-range");
      return unavailable(request, 416, /^bytes \*\/\d+$/.test(contentRange ?? "") ? { "Content-Range": contentRange } : {});
    }
    if (![200, 206].includes(upstream.status) || upstream.redirected
      || !/^audio\/mpeg(?:\s*;|$)/i.test(upstream.headers.get("content-type") ?? "")) {
      await upstream.body?.cancel();
      throw new Error("Preview unavailable");
    }
    const headers = new Headers({ ...RESPONSE_HEADERS, "Content-Type": "audio/mpeg" });
    const length = upstream.headers.get("content-length");
    if (length !== null && /^\d+$/.test(length)) headers.set("Content-Length", length);
    const contentRange = upstream.headers.get("content-range");
    if (contentRange !== null && /^bytes \d+-\d+\/(?:\d+|\*)$/.test(contentRange)) headers.set("Content-Range", contentRange);
    if (upstream.status === 206 && !headers.has("Content-Range")) {
      await upstream.body?.cancel();
      throw new Error("Preview unavailable");
    }
    const accepts = upstream.headers.get("accept-ranges");
    if (accepts === "bytes" || accepts === "none") headers.set("Accept-Ranges", accepts);
    if (request.method === "HEAD") {
      await upstream.body?.cancel();
      return new Response(null, { status: upstream.status, headers });
    }
    if (!upstream.body) throw new Error("Preview unavailable");
    const body = streamPreview(upstream, scope, idleTimeoutMs);
    handedOff = true;
    return new Response(body, { status: upstream.status, headers });
  } catch {
    scope.abort();
    return unavailable(request);
  } finally {
    if (!handedOff) scope.cleanup();
  }
}
