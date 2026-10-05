import { lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const bundledImagePath = /^\/(shows|merch)\/[A-Za-z0-9][A-Za-z0-9_-]*\.(?:png|jpe?g|webp|gif|avif)$/i;

/** Bundle only explicitly referenced, regular public event/merch image files. */
export async function bundleWordPressImages(collections, publicDirectory, assetsDirectory) {
  const publicRoot = await realpath(publicDirectory);
  const images = new Map();
  const prepared = {};
  for (const [key, records] of Object.entries(collections)) {
    prepared[key] = await Promise.all(records.map(async (record) => {
      if (typeof record.image !== 'string' || !record.image.startsWith('/')) return { ...record };
      if (record.image.length > 160 || !bundledImagePath.test(record.image)) {
        throw new Error(`Unsupported bundled image path: ${record.image}`);
      }
      const assetPath = record.image.slice(1);
      const source = path.join(publicDirectory, assetPath);
      const stat = await lstat(source);
      const resolved = await realpath(source);
      if (!stat.isFile() || stat.isSymbolicLink() || !resolved.startsWith(publicRoot + path.sep)) {
        throw new Error(`Bundled image must be a regular public file: ${record.image}`);
      }
      images.set(assetPath, await readFile(source));
      const fields = { ...record };
      delete fields.image;
      return { ...fields, bundledImage: assetPath };
    }));
  }
  // Validate and read every source before replacing the previous packaged assets.
  await rm(assetsDirectory, { recursive: true, force: true });
  for (const [assetPath, bytes] of images) {
    const target = path.join(assetsDirectory, assetPath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
  return { collections: prepared, files: [...images.keys()].sort() };
}
