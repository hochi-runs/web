"use client";

import { useSitePlayer } from "./site-player";

export function PlayReleaseButton({ slug, artist, title, className = "" }: {
  slug: string; artist: string; title: string; className?: string;
}) {
  const { playRelease } = useSitePlayer();
  return <button type="button" className={className} aria-label={`Play ${artist} — ${title}`}
    aria-controls="site-radio-player" onClick={() => playRelease(slug)}>PLAY PREVIEW ▷</button>;
}
