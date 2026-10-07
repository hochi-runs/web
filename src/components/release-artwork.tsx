import styles from "./release-artwork.module.css";

type ReleaseArtworkProps = {
  src?: string;
  title: string;
  code: string;
};

/** Static release artwork, independent of the music player. */
export function ReleaseArtwork({ src, title, code }: ReleaseArtworkProps) {
  const artwork = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={title} className={styles.image} />
  ) : (
    <span className={styles.empty}>{code}</span>
  );

  return <div className={styles.frame}>{artwork}</div>;
}
