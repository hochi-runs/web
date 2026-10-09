import type { Release } from '../data/releases';
import type { Member } from '../data/roster';

export function createWordPressCatalog(releases: Release[], origin: string): {
  version: number;
  releases: Array<Pick<Release, 'slug' | 'title' | 'artist' | 'code' | 'cover' | 'date' | 'buyUrl' | 'memberSlugs'>>;
};

export function createWordPressArtists(artists: Member[], releases: Release[]): Array<Member & { releaseSlugs: string[] }>;
