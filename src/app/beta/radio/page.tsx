import type { Metadata } from "next";
import { RadioBeta } from "@/components/radio-beta";
import { getReleases } from "@/lib/wordpress";
import { releaseArchive } from "@/data/releases";

export const metadata: Metadata = {
  title: "Radio beta · Hochi Runs",
  robots: { index: false, follow: false },
};

export default async function RadioBetaPage() {
  const catalog = await getReleases();
  const releases = catalog.flatMap((release) =>
    release.bandcampId && Number.isSafeInteger(release.bandcampId) && release.bandcampId > 0 && release.bandcampType
      ? [{
        id: release.bandcampId, type: release.bandcampType, slug: release.slug, title: release.title, artist: release.artist,
        // The shipped artwork can be sampled locally without cross-origin canvas access.
        cover: releaseArchive.find((entry) => entry.bandcampId === release.bandcampId)?.cover ?? release.cover,
      }]
      : [],
  );
  return <RadioBeta releases={releases} />;
}
