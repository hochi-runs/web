"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
  const frameRef = useRef<HTMLIFrameElement>(null);
  const reopenRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const activeKey = selected ? releaseKey(selected) : undefined;

  useEffect(() => {
    if (restoreFocus.current) {
      if (open) frameRef.current?.focus();
      else reopenRef.current?.focus();
      restoreFocus.current = false;
    }
  }, [open]);

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
          <iframe
            ref={frameRef}
            key={activeKey}
            src={`https://bandcamp.com/EmbeddedPlayer/${selected.type}=${selected.id}/size=small/bgcol=ffffff/linkcol=333333/artwork=none/transparent=true/`}
            title={`Bandcamp player: ${selected.artist} — ${selected.title}`}
            className={styles.iframe}
          />
          <button
            type="button"
            aria-label="Stop and close music player"
            className={styles.close}
            onClick={() => {
              restoreFocus.current = true;
              setOpen(false);
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        </section>
      ) : (
        <button
          ref={reopenRef}
          type="button"
          aria-label="Open music player"
          className={styles.reopen}
          onClick={() => {
            restoreFocus.current = true;
            setOpen(true);
          }}
        >
          Listen
        </button>
      ))}
    </PlayerContext.Provider>
  );
}
