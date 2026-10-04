import { getReleases } from "@/lib/wordpress";
import { ReleaseFeed } from "@/components/release-feed";

/**
 * Home = the release archive. The fixed-corner chrome (logo/nav/toggle/info)
 * lives in SiteChrome; this page is just the centered, scrolling feed of
 * album art + sparse captions. Filters and the year index are pinned to the
 * left/right edges from inside ReleaseFeed (a client component) so they can
 * stay fixed while reflecting filter state.
 *
 * Generous vertical padding clears the fixed top/bottom corners.
 */
export const revalidate = 60;

export default async function Home() {
  const releases = await getReleases();
  return (
    <div className="px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <ReleaseFeed releases={releases} />
    </div>
  );
}
