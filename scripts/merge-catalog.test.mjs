import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeBandcampCatalog } from '../src/lib/merge-catalog.mjs';

const existing = {
  slug: 'existing-release', code: 'HR020', title: 'Old title', artist: 'Artist',
  year: 2025, format: 'EP', buyUrl: 'https://example.bandcamp.com/album/existing-release',
  description: 'Label editorial copy', memberSlugs: ['artist'],
  links: [{ platform: 'Spotify', url: 'https://open.spotify.com/album/example' }],
  bandcampId: 123, bandcampType: 'album',
};
const remote = {
  title: 'New title', artist: 'Updated artist', year: 2026, date: '01 Oct 2026',
  format: 'Album', buyUrl: 'https://example.bandcamp.com/album/renamed-release',
  cover: 'https://f4.bcbits.com/img/a123_10.jpg',
  description: 'Upstream description', bandcampId: 123, bandcampType: 'album',
};
const snapshot = (releases) => ({ version: 1, releases });

test('metadata changes keep the existing slug, catalog code, and editorial fields by ID', () => {
  const [result] = mergeBandcampCatalog([existing], snapshot([remote]));
  assert.equal(result.title, 'New title');
  assert.equal(result.buyUrl, remote.buyUrl);
  assert.equal(result.slug, existing.slug);
  assert.equal(result.code, existing.code);
  assert.equal(result.description, existing.description);
  assert.equal(result.format, 'EP');
  assert.deepEqual(result.memberSlugs, ['artist']);
  assert.deepEqual(result.links, [{ platform: 'Bandcamp', url: remote.buyUrl }, ...existing.links]);
});

test('first sync matches existing releases by their purchase URL', () => {
  const [result] = mergeBandcampCatalog(
    [{ ...existing, bandcampId: undefined, bandcampType: undefined }],
    snapshot([{ ...remote, buyUrl: existing.buyUrl }]),
  );
  assert.equal(result.slug, existing.slug);
  assert.equal(result.code, existing.code);
});

test('new releases get stable IDs and distinct slugs across storefronts', () => {
  const live = [
    { ...remote, bandcampId: 100 },
    { ...remote, bandcampId: 200, buyUrl: 'https://another.bandcamp.com/album/renamed-release' },
  ];
  const result = mergeBandcampCatalog([], snapshot(live));
  assert.deepEqual(result.map((release) => release.code), ['BC-A100', 'BC-A200']);
  assert.deepEqual(result.map((release) => release.slug), ['bandcamp-album-100', 'bandcamp-album-200']);
  assert.deepEqual(mergeBandcampCatalog([], snapshot(live)), result);
});

test('new records cannot take a curated archive URL', () => {
  const [result] = mergeBandcampCatalog(
    [{ ...existing, slug: 'bandcamp-album-200' }],
    snapshot([{ ...remote, bandcampId: 200 }]),
  );
  assert.equal(result.slug, 'bandcamp-album-200-release');
});

test('manual archive entries survive removal from the public listing', () => {
  assert.deepEqual(mergeBandcampCatalog([existing], snapshot([])), [existing]);
});

test('a new release keeps its site URL when Bandcamp renames its path', () => {
  const [before] = mergeBandcampCatalog([], snapshot([remote]));
  const [after] = mergeBandcampCatalog([], snapshot([{
    ...remote, buyUrl: 'https://example.bandcamp.com/album/another-new-title',
  }]));
  assert.equal(after.slug, before.slug);
  assert.equal(after.code, before.code);
});

test('upstream raw player fields do not enter the rendered catalog', () => {
  const [result] = mergeBandcampCatalog([], snapshot([{
    ...remote, audio: 'https://example/audio.mp3', file: { 'mp3-128': 'https://example/stream' },
    tracklist: [{ title: 'Track', audio: 'https://example/audio.mp3' }],
  }]));
  assert.equal('audio' in result, false);
  assert.equal('file' in result, false);
  assert.equal('audio' in result.tracklist[0], false);
});

test('invalid or duplicate metadata fails instead of producing broken routes', () => {
  for (const buyUrl of [
    'https://example.bandcamp.com.evil.test/album/release',
    'https://example.bandcamp.com/stream/release',
    'https://secret@example.bandcamp.com/album/release',
    'https://example.bandcamp.com/album/release?secret=1',
    'http://example.bandcamp.com/album/release',
  ]) {
    assert.throws(() => mergeBandcampCatalog([], snapshot([{ ...remote, buyUrl }])));
  }
  assert.throws(() => mergeBandcampCatalog([], { version: 2, releases: [] }));
  assert.throws(() => mergeBandcampCatalog([], snapshot([remote, remote])));
});

test('ambiguous curated identities fail rather than silently assigning an established URL', () => {
  assert.throws(() => mergeBandcampCatalog([
    existing, { ...existing, slug: 'another-release', code: 'HR021' },
  ], snapshot([remote])), /Duplicate curated/);
  assert.throws(() => mergeBandcampCatalog([
    existing, { ...existing, slug: existing.slug, bandcampId: 456, buyUrl: 'https://example.bandcamp.com/album/other' },
  ], snapshot([])), /Duplicate curated/);
  assert.throws(() => mergeBandcampCatalog([existing], snapshot([
    { ...remote, bandcampId: 456, buyUrl: existing.buyUrl },
  ])), /Conflicting Bandcamp identity/);
  assert.throws(() => mergeBandcampCatalog([
    existing, { ...existing, slug: 'another-release', bandcampId: 456, buyUrl: remote.buyUrl },
  ], snapshot([remote])), /Conflicting Bandcamp identity/);
});

test('duplicate upstream purchase paths and mismatched release types cannot duplicate profile routes', () => {
  assert.throws(() => mergeBandcampCatalog([], snapshot([
    remote, { ...remote, bandcampId: 456 },
  ])), /Duplicate Bandcamp/);
  assert.throws(() => mergeBandcampCatalog([], snapshot([
    { ...remote, bandcampType: 'track' },
  ])), /Invalid Bandcamp/);
});

test('explicit multi-artist relationships survive refresh and curated removal without inferred credits', () => {
  const curated = { ...existing, memberSlugs: ['artist', 'collaborator', 'artist'] };
  assert.deepEqual(mergeBandcampCatalog([curated], snapshot([]))[0].memberSlugs, ['artist', 'collaborator']);
  const [refreshed] = mergeBandcampCatalog([curated], snapshot([
    { ...remote, artist: 'Someone Else', memberSlugs: ['upstream-name'], releaseSlugs: ['inferred'] },
  ]));
  assert.deepEqual(refreshed.memberSlugs, ['artist', 'collaborator']);
  assert.deepEqual(curated.memberSlugs, ['artist', 'collaborator', 'artist']);
  const retained = mergeBandcampCatalog([refreshed], snapshot([]));
  assert.deepEqual(retained[0].memberSlugs, ['artist', 'collaborator']);
  assert.equal(retained[0].slug, existing.slug);
  assert.equal(retained[0].code, existing.code);
  const [unassociated] = mergeBandcampCatalog([], snapshot([
    { ...remote, artist: 'artist, collaborator', memberSlugs: ['artist', 'collaborator'] },
  ]));
  assert.equal(unassociated.memberSlugs, undefined);
});
