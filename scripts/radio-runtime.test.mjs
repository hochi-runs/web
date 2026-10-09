import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Browser resource/state regressions using explicit simulated browser APIs.
// These tests do not establish real-device playback or current Bandcamp availability.
async function loadTypescript(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
const { RadioBetaStreamAudio } = await loadTypescript("../src/lib/radio-beta-stream-audio.ts");
const { createRadioVisualizer } = await loadTypescript("../src/lib/radio-beta-visualizer.ts");
const { RadioBetaTabAudio } = await loadTypescript("../src/lib/radio-beta-tab-audio.ts");

class AudioFixture extends EventTarget {
  paused = true;
  ended = false;
  duration = 120;
  currentTime = 0;
  src = "";
  defer = false;
  playCalls = 0;
  loadCalls = 0;
  listeners = new Set();
  addEventListener(type, handler) { super.addEventListener(type, handler); this.listeners.add(type); }
  removeEventListener(type, handler) { super.removeEventListener(type, handler); this.listeners.delete(type); }
  getAttribute(name) { return name === "src" ? this.src : null; }
  removeAttribute(name) { if (name === "src") this.src = ""; }
  load() { this.loadCalls += 1; this.currentTime = 0; }
  pause() { this.paused = true; this.dispatchEvent(new Event("pause")); }
  start() { this.paused = false; this.ended = false; this.dispatchEvent(new Event("playing")); }
  play() {
    this.playCalls += 1;
    if (this.defer) return new Promise((resolve) => { this.finishPlay = () => { this.start(); resolve(); }; });
    this.start();
    return Promise.resolve();
  }
}
class ContextFixture extends EventTarget {
  static all = [];
  state = "suspended";
  sampleRate = 48000;
  currentTime = 0;
  destination = {};
  nodes = [];
  resumeCalls = 0;
  constructor() { super(); ContextFixture.all.push(this); }
  node() {
    const node = { context: this, connections: [], disconnects: 0,
      connect(target) { this.connections.push(target); }, disconnect() { this.disconnects += 1; },
      gain: { value: 0, cancelAndHoldAtTime() {}, linearRampToValueAtTime() {} } };
    this.nodes.push(node);
    return node;
  }
  createMediaElementSource() { return this.node(); }
  createMediaStreamSource() { return this.node(); }
  createAnalyser() { return this.node(); }
  createGain() { return this.node(); }
  resume() { this.resumeCalls += 1; this.state = "running"; this.dispatchEvent(new Event("statechange")); return Promise.resolve(); }
  close() { this.state = "closed"; this.dispatchEvent(new Event("statechange")); return Promise.resolve(); }
}
function audioEnvironment() {
  globalThis.Audio = AudioFixture;
  globalThis.AudioContext = ContextFixture;
  globalThis.window = { AudioContext: ContextFixture, isSecureContext: true,
    location: { origin: "http://127.0.0.1:3000", href: "http://127.0.0.1:3000/beta/radio" } };
}

test("native simulated play/pause/resume/seek/end stops at end and releases all owned resources", async () => {
  audioEnvironment();
  const states = [];
  const progress = [];
  const player = new RadioBetaStreamAudio(undefined, undefined, (state) => states.push(state), (...values) => progress.push(values));
  player.setSource("/beta/radio/stream/demo?selection=" + "a".repeat(64));
  await player.play();
  assert.equal(player.playing, true);
  player.seek(999);
  assert.equal(player.position, 120);
  player.seek(-1);
  assert.equal(player.position, 0);
  player.element.dispatchEvent(new Event("timeupdate"));
  assert.deepEqual(progress.at(-1), [0, 120]);
  player.pause();
  assert.equal(player.active, false);
  await player.play();
  player.element.ended = true;
  player.element.dispatchEvent(new Event("ended"));
  assert.equal(player.playing, false);
  assert.equal(player.active, false);
  assert.equal(states.at(-1), "Ended");
  await player.dispose();
  assert.equal(player.element.src, "");
  assert.equal(player.element.listeners.size, 0);
  const context = ContextFixture.all.at(-1);
  assert.equal(context.state, "closed");
  assert.ok(context.nodes.every((node) => node.disconnects === 1));
});

test("native simulated rapid switching and disposal suppress late playback", async () => {
  audioEnvironment();
  const player = new RadioBetaStreamAudio();
  player.setSource("/beta/radio/stream/first");
  player.element.defer = true;
  const pending = player.play();
  player.setSource("/beta/radio/stream/second");
  player.element.finishPlay();
  await pending;
  assert.equal(player.playing, false);
  assert.equal(player.element.paused, true);
  player.element.defer = false;
  await player.play();
  player.element.dispatchEvent(new Event("waiting"));
  assert.equal(player.playing, false);
  assert.equal(player.active, true, "buffering can still be deliberately paused");
  player.pause();
  assert.equal(player.active, false);
  player.element.defer = true;
  const leaving = player.play();
  await player.dispose();
  player.element.finishPlay();
  await leaving;
  assert.equal(player.playing, false);
  for (const url of ["https://evil.example/a.mp3", "/other/demo", "/beta/radio/stream/../secret"]) {
    const other = new RadioBetaStreamAudio();
    assert.throws(() => other.setSource(url));
    await other.dispose();
  }
});

test("native unlock resumes Web Audio synchronously without selecting or playing audio", async () => {
  audioEnvironment();
  const player = new RadioBetaStreamAudio();
  const context = ContextFixture.all.at(-1);
  const activation = player.unlock();
  assert.equal(context.resumeCalls, 1, "activation begins in the gesture's synchronous stack");
  assert.equal(context.state, "running");
  assert.equal(player.element.src, "");
  assert.equal(player.element.playCalls, 0);
  assert.equal(player.element.loadCalls, 0);
  assert.equal(player.element.paused, true);
  assert.equal(player.active, false);
  assert.equal(player.playing, false);
  assert.equal(context.nodes.at(-1).gain.value, 0);
  await activation;
  await player.dispose();
  await assert.rejects(player.unlock(), /closed/);
  assert.equal(context.resumeCalls, 1);
});

test("native clear cancels deferred playback and reuses the graph for a new selection", async () => {
  audioEnvironment();
  const states = [];
  const progress = [];
  const beforeContexts = ContextFixture.all.length;
  const player = new RadioBetaStreamAudio((state) => states.push(state), undefined, undefined,
    (...values) => progress.push(values));
  const context = ContextFixture.all.at(-1);
  player.setSource("/beta/radio/stream/first");
  player.element.defer = true;
  const pending = player.play();
  player.seek(35);
  const listeners = [...player.element.listeners].sort();
  const loads = player.element.loadCalls;
  player.clearSource();
  assert.equal(player.element.src, "");
  assert.equal(player.element.loadCalls, loads + 1);
  assert.equal(player.position, 0);
  assert.equal(player.duration, 0, "old media metadata cannot leak into the cleared selection");
  assert.deepEqual(progress.at(-1), [0, 0]);
  assert.equal(player.active, false);
  assert.equal(player.element.paused, true);
  assert.deepEqual([...player.element.listeners].sort(), listeners);
  assert.equal(context.state, "running", "release changes retain the activated context");
  assert.ok(context.nodes.every((node) => node.disconnects === 0));
  player.element.finishPlay();
  await pending;
  assert.equal(player.playing, false);
  assert.equal(player.element.paused, true, "late playing events cannot restart the cleared source");
  assert.equal(states.at(-1), false);
  player.element.defer = false;
  player.setSource("/beta/radio/stream/second");
  await player.play();
  assert.equal(player.playing, true);
  assert.equal(ContextFixture.all.length, beforeContexts + 1);
  player.seek(20);
  player.element.dispatchEvent(new Event("timeupdate"));
  assert.deepEqual(progress.at(-1), [20, 120], "retained listeners report the new selection");
  await player.dispose();
  assert.equal(player.element.listeners.size, 0);
  assert.equal(context.state, "closed");
  assert.ok(context.nodes.every((node) => node.disconnects === 1));
});

function visualEnvironment(reduced = true) {
  const frames = new Map();
  let next = 0;
  let draws = 0;
  const uniforms = new Map();
  const media = Object.assign(new EventTarget(), { matches: reduced });
  const document = Object.assign(new EventTarget(), { hidden: false });
  const gl = new Proxy({}, { get(_target, key) {
    if (key === "isContextLost") return () => false;
    if (key === "getShaderParameter" || key === "getProgramParameter") return () => true;
    if (key === "getUniformLocation") return (_program, name) => name;
    if (key === "getAttribLocation") return () => 0;
    if (key === "drawArrays") return () => { draws += 1; };
    if (key === "uniform1f" || key === "uniform3fv") return (name, value) => uniforms.set(name, value);
    if (String(key).startsWith("create")) return () => ({});
    return /^[A-Z_]+$/.test(String(key)) ? 1 : () => {};
  } });
  const canvas = Object.assign(new EventTarget(), { dataset: {}, width: 0, height: 0,
    getContext: () => gl, getBoundingClientRect: () => ({ width: 600, height: 500, left: 0, bottom: 500 }) });
  globalThis.window = { matchMedia: () => media };
  globalThis.document = document;
  globalThis.ResizeObserver = class { observe() {} disconnect() { this.disconnected = true; } };
  globalThis.requestAnimationFrame = (callback) => { frames.set(++next, callback); return next; };
  globalThis.cancelAnimationFrame = (id) => frames.delete(id);
  return { canvas, media, frames, uniforms, get draws() { return draws; },
    tick() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback(performance.now())); } };
}

test("simulated reduced motion renders once, locks bands/RGB/time, responds to preference changes and cleans up", () => {
  const env = visualEnvironment();
  const visualizer = createRadioVisualizer(env.canvas, () => ({ bands: [1, 0.8, 0.2], colors: [[1, 1, 1], [0, 0, 0], [1, 0, 0]], purchase: true }));
  env.tick();
  assert.equal(env.draws, 1);
  assert.equal(env.frames.size, 0, "reduced motion must not keep a continuous RAF loop");
  assert.deepEqual(env.uniforms.get("bands"), [0.35, 0.35, 0.35]);
  assert.equal(env.uniforms.get("purchase"), 0);
  assert.equal(env.uniforms.get("time"), 0);
  visualizer.redraw();
  env.tick();
  assert.equal(env.draws, 2, "artwork/layout updates may redraw the static treatment");
  assert.equal(env.frames.size, 0);
  env.media.matches = false;
  env.media.dispatchEvent(new Event("change"));
  env.tick();
  assert.equal(env.frames.size, 1);
  env.media.matches = true;
  env.media.dispatchEvent(new Event("change"));
  env.tick();
  assert.equal(env.frames.size, 0);
  visualizer();
  env.media.dispatchEvent(new Event("change"));
  assert.equal(env.frames.size, 0);
});

test("simulated graphics allocation/context loss supplies fallback and cancels rendering", () => {
  const env = visualEnvironment(false);
  assert.throws(() => createRadioVisualizer({ ...env.canvas, getContext: () => null }, () => ({})), /WebGL/);
  let failures = 0;
  const visualizer = createRadioVisualizer(env.canvas, () => ({ bands: [0, 0, 0], colors: [[0, 0, 0], [0, 0, 0], [0, 0, 0]], purchase: false }), () => failures++);
  env.tick();
  assert.equal(env.frames.size, 1);
  env.canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  assert.equal(failures, 1);
  assert.equal(env.frames.size, 0);
  visualizer();
});

test("simulated capture denial preserves ordinary playback and late capture grants release tracks", async () => {
  audioEnvironment();
  globalThis.navigator = { mediaDevices: { getDisplayMedia: async () => { throw Object.assign(new Error("denied"), { name: "NotAllowedError" }); } } };
  const denied = new RadioBetaTabAudio();
  await assert.rejects(denied.connect(), /cancelled or denied/);
  assert.equal(denied.active, false);
  await denied.dispose();
  let grant;
  navigator.mediaDevices.getDisplayMedia = () => new Promise((resolve) => { grant = resolve; });
  const capture = new RadioBetaTabAudio();
  const pending = capture.connect();
  await capture.dispose();
  let stopped = 0;
  grant({ getTracks: () => [{ stop: () => stopped++ }] });
  await pending;
  assert.equal(stopped, 1);
  assert.equal(capture.active, false);
});

test("simulated granted tab capture analyses locally without a second destination/replay connection", async () => {
  audioEnvironment();
  let stopped = 0;
  const audioTrack = Object.assign(new EventTarget(), { readyState: "live", stop: () => stopped++ });
  const videoTrack = Object.assign(new EventTarget(), { getSettings: () => ({ displaySurface: "browser" }), stop: () => stopped++ });
  globalThis.MediaStream = class { constructor(tracks) { this.tracks = tracks; } };
  globalThis.navigator = { mediaDevices: { getDisplayMedia: async () => ({
    getTracks: () => [audioTrack, videoTrack], getAudioTracks: () => [audioTrack], getVideoTracks: () => [videoTrack],
  }) } };
  const capture = new RadioBetaTabAudio();
  await capture.connect();
  assert.equal(capture.active, true);
  const context = ContextFixture.all.at(-1);
  assert.equal(capture.analyser.connections.length, 0);
  assert.ok(context.nodes.every((node) => !node.connections.includes(context.destination)), "capture has no audible output");
  capture.stop();
  assert.equal(stopped, 2);
  assert.equal(capture.active, false);
  await capture.dispose();
});
