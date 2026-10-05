"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./site-player.module.css";

export type PlayerRelease = {
  id: number;
  type: "album" | "track";
  slug: string;
  title: string;
  artist: string;
};

type PlayerContextValue = {
  activeKey: string | undefined;
  open: boolean;
  loadRelease: (id: number, type: PlayerRelease["type"]) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);
const releaseKey = (release: Pick<PlayerRelease, "id" | "type">) => `${release.type}-${release.id}`;

export function useSitePlayer() {
  const player = useContext(PlayerContext);
  if (!player) throw new Error("Music controls must be inside SitePlayerProvider");
  return player;
}

/** The shared layout retains this iframe while Next.js replaces page content. */
export function SitePlayerProvider({ releases, children }: {
  releases: PlayerRelease[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The first visit to a release loads that release. Later page visits leave
  // the selected iframe alone: navigation must not interrupt someone listening.
  const [selected, setSelected] = useState<PlayerRelease | undefined>(() => {
    const slug = pathname.match(/^\/releases\/([^/]+)\/?$/)?.[1];
    return releases.find((release) => release.slug === slug) ?? releases[0];
  });
  const [open, setOpen] = useState(Boolean(selected));
  const activeKey = selected ? releaseKey(selected) : undefined;

  const loadRelease = useCallback((id: number, type: PlayerRelease["type"]) => {
    const release = releases.find((item) => item.id === id && item.type === type);
    if (!release) return;
    setSelected(release);
    setOpen(true);
  }, [releases]);

  return (
    <PlayerContext.Provider value={{ activeKey, open, loadRelease }}>
      {children}
      {selected && (open ? (
        <section id="site-music-player" className={styles.player} aria-label="Music player">
          <div className={styles.toolbar}>
            <span className={styles.label}>Listen</span>
            <select
              aria-label="Choose a release"
              className={styles.select}
              value={activeKey}
              onChange={(event) => {
                const release = releases.find((item) => releaseKey(item) === event.target.value);
                if (release) loadRelease(release.id, release.type);
              }}
            >
              {releases.map((release) => (
                <option key={releaseKey(release)} value={releaseKey(release)}>
                  {release.artist} — {release.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Stop and close music player"
              className={styles.close}
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className={styles.frame}>
            {/* Keep one native player. Bandcamp supplies its own Play control;
                it does not support starting playback from a parent button. */}
            <iframe
              key={activeKey}
              src={`https://bandcamp.com/EmbeddedPlayer/${selected.type}=${selected.id}/size=small/bgcol=ffffff/linkcol=333333/artwork=none/transparent=true/`}
              title={`Bandcamp player: ${selected.artist} — ${selected.title}`}
              className={styles.iframe}
            />
          </div>
        </section>
      ) : (
        <button type="button" className={styles.reopen} onClick={() => setOpen(true)}>
          Listen
        </button>
      ))}
    </PlayerContext.Provider>
  );
}
