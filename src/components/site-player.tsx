"use client";

import { createContext, Suspense, useCallback, useContext, useMemo, useRef } from "react";
import { RadioBeta, type RadioController, type RadioRelease } from "./radio-beta";

const SitePlayerContext = createContext<{ playRelease: (slug: string) => void } | null>(null);

/** The root layout owns one native player, independent of the page being read. */
export function SitePlayerProvider({ releases, customBandcampPreview, children }: {
  releases: RadioRelease[];
  customBandcampPreview: boolean;
  children: React.ReactNode;
}) {
  const controllerRef = useRef<RadioController>(null);
  const playRelease = useCallback((slug: string) => controllerRef.current?.playRelease(slug), []);
  const value = useMemo(() => ({ playRelease }), [playRelease]);
  return <SitePlayerContext.Provider value={value}>
    {children}
    <Suspense fallback={null}>
      <RadioBeta releases={releases} customBandcampPreview={customBandcampPreview} controllerRef={controllerRef} />
    </Suspense>
  </SitePlayerContext.Provider>;
}

export function useSitePlayer() {
  const player = useContext(SitePlayerContext);
  if (!player) throw new Error("Music controls require the site player.");
  return player;
}
