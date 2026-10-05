import { mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readSiteData } from './read-site-data.mjs';
import { createWordPressCatalog } from '../src/lib/wordpress-catalog.mjs';
import { bundleWordPressImages } from './wordpress-assets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const [catalog, roster, merch, content, pages] = await Promise.all(
  ['releases', 'roster', 'merch', 'content', 'pages'].map(readSiteData),
);
const artists = roster.members.map((artist) => ({
  ...artist,
  releaseSlugs: catalog.releases.filter((release) =>
    release.memberSlugs?.includes(artist.slug) ||
    release.artist.toLowerCase().split(/\s*[,/&]\s*/).includes(artist.name.toLowerCase()),
  ).map((release) => release.slug),
}));
const picker = createWordPressCatalog(catalog.releases, 'https://hochiruns.com');
const releases = picker.releases.map((release, index) => {
  const source = catalog.releases[index];
  return {
    ...release,
    memberSlugs: artists.filter((artist) => artist.releaseSlugs.includes(release.slug)).map((artist) => artist.slug),
    description: source.description ?? '',
    format: source.format,
    tags: source.tags ?? [],
    credits: source.credits ?? [],
    links: (source.links ?? []).filter((link) => link.platform.toLowerCase() !== 'bandcamp'),
  };
});
const pluginDirectory = path.join(root, 'wordpress/hochi-content');
await mkdir(pluginDirectory, { recursive: true });
const bundled = await bundleWordPressImages(
  { products: merch.products, shows: content.shows },
  path.join(root, 'public'), path.join(pluginDirectory, 'assets'),
);
const initial = {
  version: 1, artists, ...bundled.collections,
  pages: pages.getLocalPageParagraphs(), releases,
};
await writeFile(path.join(pluginDirectory, 'initial-content.json'), JSON.stringify(initial, null, 2) + '\n');
console.log(`Prepared existing content: ${artists.length} artists, ${merch.products.length} products, ${content.shows.length} events, ${releases.length} release choices, and About/Legal.`);
if (!process.argv.includes('--prepare')) {
  // Recreate the archive; zip's update mode would retain removed entries.
  const archive = path.join(root, 'wordpress/hochi-runs-content-bridge.zip');
  const temporary = path.join(root, 'wordpress/hochi-runs-content-bridge.' + randomUUID() + '.zip');
  const files = ['hochi-content/hochi-content.php', 'hochi-content/setup.php', 'hochi-content/initial-content.json', 'hochi-content/README.md'];
  files.push(...bundled.files.map((assetPath) => 'hochi-content/assets/' + assetPath));
  try {
    const packaged = spawnSync('zip', ['-q', temporary, ...files], { cwd: path.join(root, 'wordpress'), encoding: 'utf8' });
    if (packaged.status !== 0) throw new Error('Could not package the WordPress plugin');
    await rename(temporary, archive);
  } finally {
    await rm(temporary, { force: true });
  }
  console.log('Plugin ZIP: ' + archive);
}
