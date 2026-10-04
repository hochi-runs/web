import type { ReleaseFormat, StreamingLink, Credit, Release } from "@/data/releases";
import type { Member } from "@/data/roster";
import type { Product } from "@/data/merch";
import type { Show } from "@/data/content";

export type WordPressArtist = Member & { releaseSlugs?: string[] };
export type WordPressPageKey = "about" | "legal";
export type ReleaseOverride = {
  slug: string;
  description?: string;
  format?: ReleaseFormat;
  tags?: string[];
  credits?: Credit[];
  links?: StreamingLink[];
  memberSlugs?: string[];
  hidden?: boolean;
};
export type WordPressAppearance = {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  mutedColor?: string;
  borderColor?: string;
  logoUrl?: string;
  backgroundLogoUrl?: string;
  backgroundImageUrl?: string;
  backgroundLogoOpacity?: number;
};
export type WordPressContent = {
  version?: 1;
  artists: WordPressArtist[];
  products: Product[];
  shows: Show[];
  pages: Partial<Record<WordPressPageKey, { paragraphs: string[] }>>;
  releaseOverrides?: ReleaseOverride[];
  appearance?: WordPressAppearance;
};
export type WordPressConfig =
  | { mode: "local" }
  | { mode: "plugin"; url: string; localDemo?: boolean }
  | { mode: "native"; url: string; managedSlugs: string[] };
export type WordPressFetchOptions = {
  fetchImpl?: (url: string, init: RequestInit) => Promise<Response>;
  resolveHost?: (host: string) => Promise<{ address: string }[]>;
  maxBytes?: number;
  timeoutMs?: number;
  localDemo?: boolean;
};
export type WordPressParseOptions = { localDemo?: boolean; imageOrigin?: string };
export type { Release };
