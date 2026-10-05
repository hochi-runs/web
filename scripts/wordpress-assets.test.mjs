import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { bundleWordPressImages } from './wordpress-assets.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jQ3cAAAAASUVORK5CYII=', 'base64');

async function fixture(run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'hochi-bundled-artwork-'));
  try {
    const publicDirectory = path.join(directory, 'public');
    const assetsDirectory = path.join(directory, 'plugin-assets');
    await mkdir(path.join(publicDirectory, 'shows'), { recursive: true });
    await mkdir(path.join(publicDirectory, 'merch'), { recursive: true });
    await writeFile(path.join(publicDirectory, 'shows', 'flyer.png'), png);
    await writeFile(path.join(publicDirectory, 'merch', 'shirt.png'), png);
    await run({ directory, publicDirectory, assetsDirectory });
  } finally { await rm(directory, { recursive: true, force: true }); }
}

test('packaging copies referenced artwork, emits portable paths, and preserves HTTPS records', async () => {
  await fixture(async ({ publicDirectory, assetsDirectory }) => {
    const input = { shows: [{ venue: 'Event', image: '/shows/flyer.png' }], products: [
      { name: 'Shirt', image: '/merch/shirt.png' }, { name: 'External', image: 'https://cdn.example.com/merch.jpg' },
    ] };
    const result = await bundleWordPressImages(input, publicDirectory, assetsDirectory);
    assert.deepEqual(result.files, ['merch/shirt.png', 'shows/flyer.png']);
    assert.deepEqual(result.collections.shows, [{ venue: 'Event', bundledImage: 'shows/flyer.png' }]);
    assert.deepEqual(result.collections.products[1], input.products[1]);
    assert.equal(input.shows[0].image, '/shows/flyer.png');
    assert.deepEqual(await readFile(path.join(assetsDirectory, 'shows/flyer.png')), png);
    assert.deepEqual(await readFile(path.join(assetsDirectory, 'merch/shirt.png')), png);
  });
});

test('invalid or missing local artwork aborts before deleting the last prepared bundle', async () => {
  await fixture(async ({ publicDirectory, assetsDirectory }) => {
    await mkdir(assetsDirectory);
    const previous = path.join(assetsDirectory, 'previous.png');
    await writeFile(previous, png);
    for (const image of ['/shows/../merch/shirt.png', '/shows/%2e%2e/shirt.png', '//shows/flyer.png', '/private/flyer.png', '/shows/flyer.svg', '/shows/flyer.png?size=large', '/shows/missing.png']) {
      await assert.rejects(bundleWordPressImages({ shows: [{ image }] }, publicDirectory, assetsDirectory));
      assert.deepEqual(await readFile(previous), png);
    }
  });
});

test('packaging refuses image symlinks and removes unreferenced files on a valid rebuild', async () => {
  await fixture(async ({ directory, publicDirectory, assetsDirectory }) => {
    const outside = path.join(directory, 'outside.png');
    await writeFile(outside, png);
    await symlink(outside, path.join(publicDirectory, 'shows', 'linked.png'));
    await assert.rejects(bundleWordPressImages({ shows: [{ image: '/shows/linked.png' }] }, publicDirectory, assetsDirectory), /regular public file/);
    await bundleWordPressImages({ shows: [{ image: '/shows/flyer.png' }] }, publicDirectory, assetsDirectory);
    await bundleWordPressImages({ products: [{ image: '/merch/shirt.png' }] }, publicDirectory, assetsDirectory);
    await assert.rejects(readFile(path.join(assetsDirectory, 'shows/flyer.png')), { code: 'ENOENT' });
    assert.deepEqual(await readFile(path.join(assetsDirectory, 'merch/shirt.png')), png);
  });
});
