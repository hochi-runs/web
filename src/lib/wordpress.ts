import "server-only";
import { cache } from "react";
import { members as localArtists } from "@/data/roster";
import { products as localProducts, type Product } from "@/data/merch";
import { shows as localShows, type Show } from "@/data/content";
import { releases as bandcampReleases, type Release } from "@/data/releases";
import {
  loadWordPressData,
  overlayManagedArtists,
  parseWordPressConfig,
  selectArtistReleases,
  applyReleaseOverrides,
} from "./wordpress-core.mjs";
import type {
  WordPressArtist, WordPressContent, WordPressAppearance, WordPressPageKey,
} from "./wordpress-types";

export type { WordPressArtist, WordPressAppearance } from "./wordpress-types";

/** Published content only. Errors propagate so failed ISR keeps its good page. */
const getContent = cache(async (): Promise<WordPressContent> => {
  const config = parseWordPressConfig(process.env);
  const local = { artists: localArtists, products: localProducts, shows: localShows, pages: {} };
  if (config.mode === "local") return local;
  const imported = await loadWordPressData(config, {
    fetchImpl: (url: string, init: RequestInit) => fetch(url, {
      ...init,
      next: { revalidate: 60, tags: ["wordpress-content"] },
    }),
  });
  if (config.mode === "native") {
    return {
      ...local,
      artists: overlayManagedArtists(localArtists, imported!.artists, config.managedSlugs!),
    };
  }
  return imported as WordPressContent;
});

export async function getArtists(): Promise<WordPressArtist[]> {
  return (await getContent()).artists;
}

export async function getArtist(slug: string): Promise<WordPressArtist | undefined> {
  return (await getArtists()).find((artist) => artist.slug === slug);
}

export async function getProducts(): Promise<Product[]> {
  return (await getContent()).products;
}

export async function getShows(): Promise<Show[]> {
  return (await getContent()).shows;
}

export async function getPageParagraphs(key: WordPressPageKey): Promise<string[] | undefined> {
  return (await getContent()).pages[key]?.paragraphs;
}

export const getReleases = cache(async (): Promise<Release[]> => {
  const content = await getContent();
  return content.releaseOverrides?.length ? applyReleaseOverrides(bandcampReleases, content.releaseOverrides) : bandcampReleases;
});

export async function getRelease(slug: string): Promise<Release | undefined> {
  return (await getReleases()).find((release) => release.slug === slug);
}

export async function getArtistReleases(artist: WordPressArtist): Promise<Release[]> {
  return selectArtistReleases(artist, await getReleases());
}

export async function getAppearance(): Promise<WordPressAppearance> {
  return (await getContent()).appearance ?? {};
}
