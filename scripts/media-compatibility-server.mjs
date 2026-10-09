/** Non-production, loopback-only synthetic-media proof. No Bandcamp media or ingestion. */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const port = Number(process.env.MEDIA_POC_PORT || 3002);
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error('Choose an unprivileged test port.');
const root = new URL('../', import.meta.url);
const modules = new Map();
for (const [url, path] of [
  ['/player.mjs', 'src/lib/radio-beta-stream-audio.ts'],
  ['/visualizer.mjs', 'src/lib/radio-beta-visualizer.ts'],
]) {
  const source = await readFile(new URL(path, root), 'utf8');
  modules.set(url, ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
}
const html = await readFile(new URL('docs/remediation/media-compatibility.html', root), 'utf8');
// A locally generated 6-second PCM WAV, alternating low/mid/high test tones.
const sampleRate = 44100;
const sampleCount = sampleRate * 6;
const wav = Buffer.alloc(44 + sampleCount * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36);
wav.writeUInt32LE(sampleCount * 2, 40);
for (let i = 0; i < sampleCount; i++) {
  const second = i / sampleRate;
  const hz = [180, 900, 5000][Math.floor(second / 2)];
  const envelope = Math.min(1, (second % 2) * 20, (2 - second % 2) * 20);
  wav.writeInt16LE(Math.round(Math.sin(2 * Math.PI * hz * second) * 3000 * envelope), 44 + i * 2);
}
const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
  let path;
  try { path = new URL(request.url, `http://127.0.0.1:${port}`).pathname; }
  catch { response.writeHead(400).end(); return; }
  const finish = (body, headers) => {
    response.writeHead(200, { 'Cache-Control': 'no-store', ...headers });
    response.end(request.method === 'HEAD' ? undefined : body);
  };
  if (path === '/') { finish(html, { 'Content-Type': 'text/html; charset=utf-8' }); return; }
  if (modules.has(path)) { finish(modules.get(path), { 'Content-Type': 'text/javascript; charset=utf-8' }); return; }
  if (path !== '/beta/radio/stream/poc-tone') { response.writeHead(404).end(); return; }
  let start = 0; let end = wav.length - 1;
  if (request.headers.range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range);
    if (!match) { response.writeHead(416, { 'Content-Range': `bytes */${wav.length}` }).end(); return; }
    start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= wav.length) {
      response.writeHead(416, { 'Content-Range': `bytes */${wav.length}` }).end(); return;
    }
  }
  response.writeHead(request.headers.range ? 206 : 200, {
    'Content-Type': 'audio/wav', 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store',
    ...(request.headers.range ? { 'Content-Range': `bytes ${start}-${end}/${wav.length}` } : {}),
  });
  response.end(request.method === 'HEAD' ? undefined : wav.subarray(start, end + 1));
});
server.listen(port, '127.0.0.1', () => console.log(`Synthetic-media proof: http://127.0.0.1:${port} (local test only)`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
