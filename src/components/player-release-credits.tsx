"use client";

import Link from "next/link";
import { useId, type RefObject } from "react";
import type { Release } from "@/data/releases";
import styles from "./player-release-credits.module.css";

type PlayerReleaseCreditsProps = {
  release?: Release;
  onClose: () => void;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
};

/** Release-level editorial notes; track names do not imply playback or credits. */
export function PlayerReleaseCredits({ release, onClose, closeButtonRef }: PlayerReleaseCreditsProps) {
  const titleId = useId();

  return (
    <section className={styles.panel} role="dialog" aria-modal={false} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId}>Release credits</h2>
        <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close release credits">
          Close ×
        </button>
      </header>

      <div className={styles.body}>
        {release ? (
          <>
            <h3 className={styles.title}>{release.title}</h3>
            <p className={styles.artist}>{release.artist}</p>
            <dl className={styles.details}>
              <div><dt>Catalog</dt><dd>{release.code}</dd></div>
              <div><dt>{release.date ? "Release date" : "Year"}</dt><dd>{release.date || release.year}</dd></div>
              <div><dt>Format</dt><dd>{release.format}</dd></div>
            </dl>

            <h3 className={styles.sectionTitle}>Credits</h3>
            {release.credits?.length ? (
              <dl className={styles.credits}>
                {release.credits.map((credit, index) => (
                  <div key={`${credit.role}-${index}`}>
                    <dt>{credit.role}</dt>
                    <dd>{credit.name}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className={styles.empty}>No credits are listed for this release.</p>
            )}

            {release.description && (
              <section>
                <h3 className={styles.sectionTitle}>Release notes</h3>
                <p className={styles.description}>{release.description}</p>
              </section>
            )}

            {!!release.tracklist?.length && (
              <section>
                <h3 className={styles.sectionTitle}>Track list</h3>
                <ol className={styles.tracks}>
                  {release.tracklist.map((track, index) => (
                    <li key={`${track.title}-${index}`}>
                      <span>{track.title}{track.feat && ` ${track.feat}`}</span>
                      {track.duration && <span className={styles.duration}>{track.duration}</span>}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <Link className={styles.releaseLink} href={`/releases/${release.slug}`} onClick={onClose}>
              Full release page →
            </Link>
          </>
        ) : (
          <p className={styles.empty}>No release selected.</p>
        )}
      </div>
    </section>
  );
}
