import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordPressCatalog } from '../src/lib/wordpress-catalog.mjs';

test('picker export normalizes archive artwork and strips non-picker fields', () => {
  const source = {
    slug: 'release', title: 'Release', artist: 'AMAL', code: 'HR001',
    cover: '/covers/release.jpg', date: '01 Oct 2026',
    buyUrl: 'https://hochiruns.bandcamp.com/album/release', memberSlugs: ['amal'],
    description: 'Editorial copy', audio: 'private-master.mp3', file: { stream: 'stream.mp3' },
    hidden: true, secret: 'private-setting', tracklist: [{ title: 'Track', audio: 'track.mp3' }],
  };
  assert.deepEqual(createWordPressCatalog([source], 'https://site.vercel.app'), {
    version: 1,
    releases: [{
      slug: 'release', title: 'Release', artist: 'AMAL', code: 'HR001',
      cover: 'https://site.vercel.app/covers/release.jpg', date: '01 Oct 2026',
      buyUrl: source.buyUrl, memberSlugs: ['amal'],
    }],
  });
});

test('picker export retains upstream public artwork and requires an HTTPS origin', () => {
  const source = { slug: 'release', title: 'Release', artist: 'AMAL', code: 'HR001', cover: 'https://f4.bcbits.com/img/a123_10.jpg' };
  assert.equal(createWordPressCatalog([source], 'https://hochiruns.com').releases[0].cover, source.cover);
  assert.throws(() => createWordPressCatalog([source], 'http://hochiruns.com'));
  assert.throws(() => createWordPressCatalog([source], 'https://user:password@hochiruns.com'));
});
