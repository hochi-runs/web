import type { Release } from '../data/releases';

export function createWordPressCatalog(releases: Release[], origin: string): {
  version: number;
  releases: Array<Pick<Release, 'slug' | 'title' | 'artist' | 'code' | 'cover' | 'date' | 'buyUrl' | 'memberSlugs'>>;
};
