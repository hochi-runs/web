import test from "node:test";
import assert from "node:assert/strict";
import { createBandcampPreviewResponse, isBandcampPreviewUrl, parseBandcampPreview } from "../src/lib/bandcamp-preview-core.mjs";

const releases = [{ slug: "demo", bandcampId: 123, bandcampType: "album" }];
const preview = "https://t1.bcbits.com/stream/example/mp3-128?token=synthetic-fixture";
const second = "https://t2.bcbits.com/stream/second/mp3-128?token=synthetic-fixture";
const track = (id = 1, url = preview, streaming = true) => ({ id, track_streaming: streaming, file: { "mp3-128": url } });
const metadata = (overrides = {}) => ({
  band_enabled: 1, killed: null, album_private: null, subscriber_only: false,
  no_exclusive_data: 1, exclusive_show_anywhere: null, exclusive_permitted_domains: [],
  featured_track_id: 1, tracks: [track()], ...overrides,
});
const html = (data = metadata()) => `<script data-player-data="${JSON.stringify(data).replaceAll("&", "&amp;").replaceAll('"', "&quot;")}"></script>`;
const request = (options = {}) => new Request(options.url ?? "http://127.0.0.1:3001/beta/radio/stream/demo", {
  method: options.method ?? "GET", headers: options.headers, signal: options.signal,
});
const run = (req, overrides = {}) => createBandcampPreviewResponse({
  request: req, slug: "demo", releases, environment: "development", ...overrides,
});
const forbiddenFetch = () => { throw new Error("Upstream fetch is forbidden in this case"); };
const audio = (body = "fixture bytes", options = {}) => new Response(body, {
  headers: { "content-type": "audio/mpeg", "accept-ranges": "bytes", ...options.headers }, status: options.status ?? 200,
});

test("production, non-loopback, and cross-origin requests cannot reach any upstream", async () => {
  for (const environment of ["production", "test", ""]) {
    assert.equal((await run(request(), { environment, fetchImpl: forbiddenFetch })).status, 404);
  }
  for (const url of ["https://hochiruns.com/beta/radio/stream/demo", "http://localhost.evil.example/beta/radio/stream/demo", "http://192.168.1.2/beta/radio/stream/demo"]) {
    assert.equal((await run(request({ url }), { fetchImpl: forbiddenFetch })).status, 404);
  }
  for (const headers of [{ origin: "https://evil.example" }, { origin: "null" }, { "sec-fetch-site": "cross-site" }]) {
    assert.equal((await run(request({ headers }), { fetchImpl: forbiddenFetch })).status, 404);
  }
});

test("unknown slugs, invalid catalog identifiers, and malformed byte ranges never fetch", async () => {
  assert.equal((await run(request(), { slug: "not-in-catalog", fetchImpl: forbiddenFetch })).status, 404);
  for (const entry of [{ ...releases[0], bandcampId: -1 }, { ...releases[0], bandcampId: "123" }, { ...releases[0], bandcampType: "url" }]) {
    assert.equal((await run(request(), { releases: [entry], fetchImpl: forbiddenFetch })).status, 404);
  }
  for (const range of ["bytes=", "bytes=0-1,3-4", "bytes=9-2", "bytes=-0", "bytes=-", "bytes=9007199254740992-", "items=0-2"]) {
    assert.equal((await run(request({ headers: { range } }), { fetchImpl: forbiddenFetch })).status, 416);
  }
});

test("only strict Bandcamp HTTPS preview hosts and stream paths are allowed", () => {
  assert.equal(isBandcampPreviewUrl(preview), true);
  for (const url of [
    "http://t1.bcbits.com/stream/a", "https://t1.bcbits.com:443/stream/a", "https://user@t1.bcbits.com/stream/a",
    "https://t1.bcbits.com.evil.example/stream/a", "https://bcbits.com/stream/a", "https://t1.bcbits.com/download/a",
    "https://t1.bcbits.com/stream/a#fragment", "https://127.0.0.1/stream/a", "https://t1.bcbits.com/stream/",
    " https://t1.bcbits.com/stream/a", "https://t1.bcbits.com/stream/../download/a",
  ]) assert.equal(isBandcampPreviewUrl(url), false);
});

test("featured public streaming track is selected, with first eligible fallback", () => {
  assert.equal(parseBandcampPreview(html(metadata({ tracks: [track(2, second), track(1)] }))), preview);
  assert.equal(parseBandcampPreview(html(metadata({ featured_track_id: 9, tracks: [track(2, second), track(1)] }))), second);
  assert.equal(parseBandcampPreview(html(metadata({ tracks: [track(1, preview, false), track(2, second)] }))), second);
});

test("standalone public track metadata uses track_private instead of album_private", async () => {
  const standalone = metadata({ album_id: null, album_private: undefined, track_private: null });
  assert.equal(parseBandcampPreview(html(standalone)), preview);
  let calls = 0;
  const response = await run(request(), {
    releases: [{ ...releases[0], bandcampType: "track" }],
    fetchImpl: async () => ++calls === 1 ? new Response(html(standalone)) : audio(),
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "fixture bytes");
  for (const overrides of [
    { track_private: true }, { track_private: undefined }, { album_id: undefined },
    { album_private: true },
  ]) assert.throws(() => parseBandcampPreview(html({ ...standalone, ...overrides })));
  assert.throws(() => parseBandcampPreview(html(metadata({ track_private: true }))));
});

test("private, subscriber, exclusive, disabled and non-streaming metadata fails closed", () => {
  for (const overrides of [
    { album_private: true }, { killed: 1 }, { band_enabled: 0 }, { subscriber_only: true },
    { no_exclusive_data: 0 }, { exclusive_show_anywhere: true }, { exclusive_permitted_domains: ["example.com"] },
    { tracks: [track(1, preview, false)] }, { tracks: [{ id: 1, file: { "mp3-128": preview } }] },
    { tracks: [track(1, "https://evil.example/stream/a")] }, { tracks: [{ id: 1, track_streaming: true }] },
  ]) assert.throws(() => parseBandcampPreview(html(metadata(overrides))));
  for (const bad of ["<p>No data</p>", '<script data-player-data="{broken"></script>', html(null), html([]), html(metadata({ tracks: {} })), `${html()}${html()}`]) {
    assert.throws(() => parseBandcampPreview(bad));
  }
});

test("single byte range and HEAD are forwarded, while cookies and other upstream headers are excluded", async () => {
  for (const method of ["GET", "HEAD"]) {
    const calls = [];
    const response = await run(request({ method, headers: { range: "bytes=2-4", cookie: "private=do-not-send", origin: "http://127.0.0.1:3001" } }), {
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return calls.length === 1 ? new Response(html()) : audio(method === "HEAD" ? null : "123", {
          status: 206, headers: { "content-length": "3", "content-range": "bytes 2-4/10", "set-cookie": "secret=do-not-return", location: preview, "x-private": "hidden" },
        });
      },
    });
    assert.equal(response.status, 206);
    assert.equal(calls[0].url, "https://bandcamp.com/EmbeddedPlayer/album=123/size=small/bgcol=ffffff/linkcol=333333/artwork=none/transparent=true/");
    assert.equal(calls[1].url, preview);
    assert.equal(calls[1].init.method, method);
    assert.equal(calls[1].init.headers.Range, "bytes=2-4");
    for (const call of calls) {
      assert.equal(call.init.credentials, "omit");
      assert.equal(call.init.redirect, "error");
      assert.equal(call.init.cache, "no-store");
      assert.equal(call.init.headers.Cookie, undefined);
      assert.equal(call.init.headers.cookie, undefined);
    }
    assert.equal(response.headers.get("content-type"), "audio/mpeg");
    assert.equal(response.headers.get("content-range"), "bytes 2-4/10");
    assert.equal(response.headers.get("content-length"), "3");
    assert.equal(response.headers.get("accept-ranges"), "bytes");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("x-private"), null);
    assert.equal(await response.text(), method === "HEAD" ? "" : "123");
  }
});

test("upstream range rejection is generic and retains only a safe total-length hint", async () => {
  let calls = 0;
  const response = await run(request({ headers: { range: "bytes=99999-" } }), {
    fetchImpl: async () => ++calls === 1 ? new Response(html()) : new Response("private upstream details", { status: 416, headers: { "content-range": "bytes */100" } }),
  });
  assert.equal(response.status, 416);
  assert.equal(response.headers.get("content-range"), "bytes */100");
  assert.equal(await response.text(), "Audio preview unavailable.");
});

test("provider failures, malformed data, and stalled headers return generic errors", async () => {
  const failures = [
    async () => { throw new Error("secret provider URL"); },
    async () => new Response("secret provider details", { status: 302, headers: { location: preview } }),
    async () => new Response("not embed metadata"),
    async () => new Response(html(metadata({ album_private: true }))),
    async () => new Promise(() => {}),
  ];
  for (const fetchImpl of failures) {
    const response = await run(request(), { fetchImpl, timeoutMs: 10 });
    assert.equal(response.status, 502);
    assert.equal(await response.text(), "Audio preview unavailable.");
  }
  for (const upstream of [new Response("secret", { status: 403 }), new Response("secret", { headers: { "content-type": "text/html" } }), audio("secret", { status: 206 })]) {
    let calls = 0;
    const response = await run(request(), { fetchImpl: async () => ++calls === 1 ? new Response(html()) : upstream });
    assert.equal(response.status, 502);
    assert.equal(await response.text(), "Audio preview unavailable.");
  }
});

test("a browser abort during metadata lookup aborts its upstream request", async () => {
  const controller = new AbortController();
  let signal;
  const task = run(request({ signal: controller.signal }), {
    fetchImpl: async (_url, init) => { signal = init.signal; return new Promise(() => {}); },
  });
  controller.abort();
  assert.equal((await task).status, 502);
  assert.equal(signal.aborted, true);
});

test("cancelling or aborting playback closes the upstream body and aborts its fetch", async () => {
  for (const cancelViaRequest of [false, true]) {
    const browser = new AbortController();
    let upstreamSignal;
    let cancelled = false;
    let calls = 0;
    const response = await run(request({ signal: browser.signal }), {
      fetchImpl: async (_url, init) => {
        if (++calls === 1) return new Response(html());
        upstreamSignal = init.signal;
        return audio(new ReadableStream({
          start(controller) { controller.enqueue(new TextEncoder().encode("first chunk")); },
          cancel() { cancelled = true; },
        }));
      },
    });
    const reader = response.body.getReader();
    assert.equal(new TextDecoder().decode((await reader.read()).value), "first chunk");
    if (cancelViaRequest) {
      browser.abort();
      await assert.rejects(reader.read(), /interrupted/);
    } else await reader.cancel();
    assert.equal(upstreamSignal.aborted, true);
    assert.equal(cancelled, true);
  }
});

test("stalled audio reads time out and cancel the upstream without leaking errors", async () => {
  let calls = 0;
  let cancelled = false;
  let signal;
  const response = await run(request(), {
    idleTimeoutMs: 10,
    fetchImpl: async (_url, init) => {
      if (++calls === 1) return new Response(html());
      signal = init.signal;
      return audio(new ReadableStream({ cancel() { cancelled = true; } }));
    },
  });
  await assert.rejects(response.text(), /Audio preview interrupted/);
  assert.equal(signal.aborted, true);
  assert.equal(cancelled, true);
});
