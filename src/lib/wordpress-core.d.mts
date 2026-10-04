import type {
  WordPressArtist, WordPressContent, WordPressAppearance, WordPressConfig,
  WordPressFetchOptions, WordPressParseOptions, ReleaseOverride, Release,
} from "./wordpress-types";

export const MAX_CMS_BYTES: number;
export function plainWordPressText(value: unknown, field?: string, limit?: number, required?: boolean): string;
export function validWordPressSlug(value: unknown): boolean;
export function isPublicAddress(address: string): boolean;
export function publicHttpsUrl(value: unknown): URL;
export function localDemoContentUrl(value: unknown): URL;
export function parseReleaseOverrides(input: unknown): ReleaseOverride[];
export function parseAppearance(input: unknown, options?: WordPressParseOptions): WordPressAppearance;
export function applyReleaseOverrides(catalog: Release[], overrides?: ReleaseOverride[]): Release[];
export function appearanceCssVariables(appearance?: WordPressAppearance): Record<string, string>;
export function parsePluginContent(input: unknown, options?: WordPressParseOptions): WordPressContent;
export function parseWordPressConfig(environment?: Record<string, string | undefined>): WordPressConfig;
export function parseNativeArtists(input: unknown, managedSlugs: string[]): WordPressArtist[];
export function overlayManagedArtists(seed: WordPressArtist[], imported: WordPressArtist[], managedSlugs: string[]): WordPressArtist[];
export function selectArtistReleases(artist: WordPressArtist, releases: Release[]): Release[];
export function fetchWordPressJson(source: string, options?: WordPressFetchOptions): Promise<{ data: unknown; totalPages: string | null }>;
export function loadWordPressData(config: WordPressConfig, options?: WordPressFetchOptions): Promise<WordPressContent | { artists: WordPressArtist[] } | undefined>;
