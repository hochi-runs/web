import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readSiteData } from './read-site-data.mjs';
import { applyReleaseOverrides, selectArtistReleases } from '../src/lib/wordpress-core.mjs';

test('the bundled WordPress seed publishes only explicit catalog associations', async () => {
  const { releases } = await readSiteData('releases');
  const { members } = await readSiteData('roster');
  const seed = JSON.parse(await readFile(new URL('../wordpress/hochi-content/initial-content.json', import.meta.url), 'utf8'));
  for (const member of members) {
    assert.deepEqual(
      seed.artists.find((artist) => artist.slug === member.slug).releaseSlugs,
      releases.filter((release) => release.memberSlugs?.includes(member.slug)).map((release) => release.slug),
      `Only editorially explicit releases belong to ${member.slug}`,
    );
  }
  for (const release of releases) {
    assert.deepEqual(seed.releases.find((item) => item.slug === release.slug).memberSlugs, release.memberSlugs ?? []);
  }
});

test('confirmed profile selections survive editorial overrides and remain explicit for every collaborator', async () => {
  const { releases } = await readSiteData('releases');
  const { members } = await readSiteData('roster');
  const original = releases.find((release) => release.slug === 'vague-amal-nedaj');
  const effective = applyReleaseOverrides(releases, [
    { slug: original.slug, description: 'Fixture editorial update' },
  ]);
  for (const slug of original.memberSlugs) {
    const selection = selectArtistReleases(members.find((member) => member.slug === slug), effective);
    assert.equal(selection.filter((release) => release.slug === original.slug).length, 1);
  }
  const updated = effective.find((release) => release.slug === original.slug);
  assert.deepEqual(updated.memberSlugs, original.memberSlugs);
  assert.equal(updated.code, original.code);
  assert.equal(updated.buyUrl, original.buyUrl);
  const cleared = applyReleaseOverrides(releases, [{ slug: original.slug, memberSlugs: [] }]);
  assert.equal(selectArtistReleases({ slug: 'amal' }, cleared).some((release) => release.slug === original.slug), false);
  // A profile's explicitly saved selection remains authoritative over inverse
  // associations; an editor can intentionally remove all selections.
  assert.deepEqual(selectArtistReleases({ slug: 'amal', releaseSlugs: [] }, effective), []);
  const approvedFixture = applyReleaseOverrides(releases, [{ slug: 'hit-dat', memberSlugs: ['amal', 'dj-swisha'] }]);
  for (const slug of ['amal', 'dj-swisha']) {
    assert.equal(selectArtistReleases({ slug }, approvedFixture).filter((release) => release.slug === 'hit-dat').length, 1);
  }
  assert.equal(releases.find((release) => release.slug === 'hit-dat').memberSlugs, undefined);
});
