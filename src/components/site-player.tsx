"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./site-player.module.css";

export type PlayerRelease = {
  id: number;
  type: "album" | "track";
  slug: string;
  title: string;
  artist: string;
};

const releaseKey = (release: Pick<PlayerRelease, "id" | "type">) => `${release.type}-${release.id}`;

/** The shared layout retains this iframe while Next.js replaces page content. */
export function SitePlayerProvider({ releases, children }: {
  releases: PlayerRelease[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The first visit to a release loads that release. Later page visits leave
  // the selected iframe alone: navigation must not interrupt someone listening.
  const [selected] = useState<PlayerRelease | undefined>(() => {
    const slug = pathname.match(/^\/releases\/([^/]+)\/?$/)?.[1];
    return releases.find((release) => release.slug === slug) ?? releases[0];
  });
  const activeKey = selected ? releaseKey(selected) : undefined;

  return (
    <>
      {children}
      {selected && !pathname.startsWith("/beta/radio") && (
        <section id="site-music-player" className={styles.player} aria-label="Music player">
          <iframe
            key={activeKey}
            src={`https://bandcamp.com/EmbeddedPlayer/${selected.type}=${selected.id}/size=small/bgcol=ffffff/linkcol=333333/artwork=none/transparent=true/`}
            title={`Bandcamp player: ${selected.artist} — ${selected.title}`}
            className={styles.iframe}
          />
        </section>
      )}
    </>
  );
}
