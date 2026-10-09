import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import ts from "typescript";

// Render the actual radio component with a fixture routing context. Browser
// effects/audio are not executed; this protects the public native-bar contract.
const require = createRequire(import.meta.url);
const reactUrl = pathToFileURL(require.resolve("react")).href;
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const source = await readFile(new URL("../src/components/radio-beta.tsx", import.meta.url), "utf8");
let { outputText } = ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, jsx: ts.JsxEmit.ReactJSX,
} });
const dependencies = {
  "react": reactUrl,
  "react/jsx-runtime": pathToFileURL(require.resolve("react/jsx-runtime")).href,
  "next/link": moduleUrl(`import React from ${JSON.stringify(reactUrl)}; export default function Link({children,...props}) { return React.createElement('a', props, children); }`),
  "next/navigation": moduleUrl("export function useSearchParams() { return new URLSearchParams(globalThis.__radioInterfaceQuery ?? ''); } export function usePathname() {return globalThis.__radioInterfacePath ?? '/beta/radio';}"),
  "@/lib/radio-beta-audio": moduleUrl("export class RadioBetaAudio {}"),
  "@/lib/radio-beta-tab-audio": moduleUrl("export class RadioBetaTabAudio {}"),
  "@/lib/radio-beta-stream-audio": moduleUrl("export class RadioBetaStreamAudio {}"),
  "@/lib/radio-beta-visualizer": moduleUrl("export function createRadioVisualizer() {}"),
  "@/components/site-chrome": moduleUrl("export function SiteChrome() { return null; } export function RadioSiteInfo() { return null; }"),
  "./radio-beta.module.css": moduleUrl("export default new Proxy({}, {get: (_, key) => String(key)});"),
};
for (const [name, url] of Object.entries(dependencies)) outputText = outputText.replaceAll(`from "${name}"`, `from "${url}"`);
const { RadioBeta } = await import(moduleUrl(outputText));
const release = { slug: "demo", id: 123, type: "album", title: "Demo release", artist: "Fixture artist", buyUrl: "https://example.bandcamp.com/album/demo" };

test("ordinary site entry keeps the persistent player dormant until the listener activates it", () => {
  globalThis.__radioInterfacePath = "/roster";
  globalThis.__radioInterfaceQuery = "release=demo";
  try {
    const markup = renderToStaticMarkup(createElement(RadioBeta, { releases: [release], customBandcampPreview: true }));
    assert.equal(markup, "");
  } finally { delete globalThis.__radioInterfacePath; }
});

test("production native-disabled selection preserves custom transport and never auto-mounts official iframe", () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  globalThis.__radioInterfaceQuery = "release=demo";
  try {
    const markup = renderToStaticMarkup(createElement(RadioBeta, { releases: [release], customBandcampPreview: false }));
    assert.match(markup, /aria-label="Release preview controls"/);
    assert.match(markup, /aria-label="Play radio"/);
    assert.match(markup, /aria-label="Playback position"/);
    assert.match(markup, /aria-label="Radio volume"/);
    assert.match(markup, /0:00 \/ 0:00/);
    assert.match(markup, /BUY ↗/);
    assert.match(markup, /Playback is unavailable here/);
    assert.match(markup, /Use official Bandcamp player/);
    assert.doesNotMatch(markup, /<iframe/);
    assert.doesNotMatch(markup, /Run RGB visual test/);
    assert.match(markup, /class="transport" disabled=""/);
  } finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
});

test("native-enabled loading keeps custom bar and an invalid selection cannot silently open another release", () => {
  globalThis.__radioInterfaceQuery = "release=demo";
  const loading = renderToStaticMarkup(createElement(RadioBeta, { releases: [release], customBandcampPreview: true }));
  assert.match(loading, /Loading preview/);
  assert.match(loading, /aria-label="Release preview controls"/);
  assert.doesNotMatch(loading, /<iframe/);
  globalThis.__radioInterfaceQuery = "release=unavailable";
  const invalid = renderToStaticMarkup(createElement(RadioBeta, { releases: [release], customBandcampPreview: false }));
  assert.match(invalid, /Requested release is unavailable/);
  assert.doesNotMatch(invalid, /<iframe/);
  assert.doesNotMatch(invalid, /href="https:\/\/example.bandcamp.com/);
});

test("credits links to the selected release page without opening a second credits interface", () => {
  globalThis.__radioInterfaceQuery = "release=demo";
  const markup = renderToStaticMarkup(createElement(RadioBeta, { releases: [release], customBandcampPreview: true }));
  assert.match(markup, /<a class="creditsTrigger" href="\/releases\/demo" aria-label="View credits for Demo release">CREDITS<\/a>/);
  assert.doesNotMatch(markup, /radio-release-credits|aria-label="Open release credits"/);

  globalThis.__radioInterfaceQuery = "release=unavailable";
  const invalid = renderToStaticMarkup(createElement(RadioBeta, { releases: [release], customBandcampPreview: true }));
  assert.doesNotMatch(invalid, /class="creditsTrigger"/);
});
