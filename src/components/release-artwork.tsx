"use client";

import { useSitePlayer } from "./site-player";
import styles from "./release-artwork.module.css";

type ReleaseArtworkProps = {
  src?: string;
  title: string;
  code: string;
  id?: number;
  type?: "album" | "track";
};

/** Artwork selects a release; Bandcamp keeps its own playback control. */
export function ReleaseArtwork({ src, title, code, id, type }: ReleaseArtworkProps) {
  const { loadRelease } = useSitePlayer();
  const canLoad = id !== undefined && Number.isSafeInteger(id) && id > 0 && type !== undefined;
  const artwork = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={title} className={styles.image} />
  ) : (
    <span className={styles.empty}>{code}</span>
  );

  if (!canLoad) return <div className={styles.frame}>{artwork}</div>;

  return (
    <button
      type="button"
      className={`${styles.frame} ${styles.control}`}
      aria-label={`Load ${title} in the music player`}
      title={`Load ${title} in the music player`}
      aria-controls="site-music-player"
      onClick={() => loadRelease(id, type)}
    >
      {artwork}
      <span className={styles.play} aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 1 10 6 2 11Z" />
        </svg>
      </span>
    </button>
  );
}
