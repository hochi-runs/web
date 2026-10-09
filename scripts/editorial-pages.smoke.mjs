import assert from 'node:assert/strict';
import { load } from 'cheerio';

// Run against a production build explicitly configured for local content.
// This checks served integration behavior, not artist approval or media playback.
const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const expectations = [
  ['/roster/amal', ['Washington, D.C.', 'Black Rave Culture', 'Resident Advisor', 'Side Orders v1', 'VAGUE (Amal + Nedaj)']],
  ['/roster/dj-swisha', ['New York-based', 'Juke Bounce Werk', 'Resident Advisor', 'No releases are currently listed for this artist.']],
  ['/about', ['About information is not yet published.']],
  ['/legal', ['Legal information is not yet published.']],
  ['/merch', ['Merch showcase', 'Purchase link unavailable']],
  ['/videos', ['Watch on YouTube ↗', 'AMAL — Hit Dat']],
];
for (const [route, expected] of expectations) {
  const response = await fetch(new URL(route, base), { signal: AbortSignal.timeout(10_000) });
  assert.equal(response.status, 200, route);
  const $ = load(await response.text());
  const main = $('main').text();
  for (const value of expected) assert.ok(main.includes(value), `${route}: ${value}`);
  assert.ok(!main.toLowerCase().includes('placeholder'), `${route}: no placeholder instruction`);
  if (route === '/roster/amal') {
    const links = $('main a[href^="/releases/"]').map((_, element) => $(element).attr('href')).get();
    assert.deepEqual(links, ['/releases/side-orders-v1', '/releases/vague-amal-nedaj']);
  }
  if (route === '/merch') assert.equal(main.split('Purchase link unavailable').length - 1, 4);
  if (route === '/videos') assert.equal($('main a[href="https://www.youtube.com/watch?v=PNw4HJfsvUE"]').length, 1);
  if (route.startsWith('/roster/')) {
    assert.equal($('main img').length, 1, `${route}: sourced profile image`);
    assert.match($('main img').attr('src'), /^https:\/\/f4\.bcbits\.com\/img\/\d+_10\.jpg$/);
    assert.ok(!main.includes('Biography not yet published.') && !main.includes('Portrait not published'));
  }
  console.log(`${route}: HTTP 200, expected copy/links present`);
}
const response = await fetch(new URL('/api/wordpress/catalog', base), { signal: AbortSignal.timeout(10_000) });
assert.equal(response.status, 200);
const picker = await response.json();
assert.equal(picker.releases.length, 23);
assert.deepEqual(picker.releases.find((release) => release.slug === 'vague-amal-nedaj').memberSlugs, ['amal', 'nedaj']);
assert.equal(picker.releases.find((release) => release.slug === 'hit-dat').memberSlugs, undefined);
console.log('/api/wordpress/catalog: 23 picker records; confirmed associations retained; Hit Dat remains unconfirmed');
