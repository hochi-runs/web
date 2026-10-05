import Link from "next/link";
import type { Release } from "@/data/releases";
import { ReleaseArtwork } from "./release-artwork";
import styles from "./release-prototype.module.css";

/** A single-release study; the remaining archive retains its existing layout. */
export function ReleasePrototype({ release }: { release: Release }) {
  const purchaseUrl = release.buyUrl;
  const otherLinks = release.links?.filter((link) => link.url !== purchaseUrl) ?? [];

  return (
    <article className={styles.page}>
      <Link href="/" className={styles.index}>← Index</Link>
      <h1 className={`${styles.title} reading-surface`}>
        : {release.artist} — {release.title}
      </h1>

      <div className={styles.layout}>
        <div className={styles.media}>
          <ReleaseArtwork
            src={release.cover}
            title={`${release.artist} — ${release.title}`}
            code={release.code}
            id={release.bandcampId}
            type={release.bandcampType}
          />

          <div className={styles.links}>
            {purchaseUrl && (
              <a href={purchaseUrl} target="_blank" rel="noopener noreferrer">
                Buy on Bandcamp <span aria-hidden="true">↗</span>
              </a>
            )}
            {otherLinks.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                {link.platform} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>

        <div className={`${styles.notes} reading-surface`}>
          <p className={styles.code}>{release.code}</p>
          <dl className={styles.details}>
            <Note label="Album / Release" value={release.title} />
            <Note label="Artist" value={release.artist} />
            <Note label="Release Type" value={release.format} />
            {release.date && <Note label="Date of release" value={release.date} />}
            <Note label="Year" value={String(release.year)} />
            <Note label="Label" value="Hochi Runs" />
            {!!release.tags?.length && <Note label="Tags" value={release.tags.join(", ")} />}
          </dl>

          {!!release.credits?.length && (
            <dl className={styles.details}>
              {release.credits.map((credit, i) => (
                <Note key={`${credit.role}-${i}`} label={credit.role} value={credit.name} />
              ))}
            </dl>
          )}

          {release.description && <p className={styles.description}>{release.description}</p>}

          {!!release.tracklist?.length && (
            <section className={styles.tracks} aria-labelledby="release-tracks">
              <h2 id="release-tracks">Tracks</h2>
              <ol>
                {release.tracklist.map((track, i) => (
                  <li key={`${track.title}-${i}`}>
                    <span className={styles.trackNumber}>{String(i + 1).padStart(2, "0")}</span>
                    <span>{track.title}{track.feat && ` ${track.feat}`}</span>
                    {track.duration && <span className={styles.duration}>{track.duration}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}

function Note({ label, value }: { label: string; value: string }) {
  return <div className={styles.note}><dt>{label}:</dt><dd>{value}</dd></div>;
}
