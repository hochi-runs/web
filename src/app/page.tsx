import { getReleases } from "@/lib/wordpress";
import { ReleaseFeed } from "@/components/release-feed";

/**
 * Home = the release archive. SiteChrome owns the header; ReleaseFeed owns
 * the centered scrolling art, the shared left rail (filters and site links),
 * and the right year index. Filter state stays with the feed.
 *
 * Local spacing complements the shared header and normal-flow footer.
 */
export const revalidate = 60;

export default async function Home() {
  const releases = await getReleases();
  return (
    <div className="px-5 pb-12 pt-6 sm:px-8 sm:pb-16">
      <ReleaseFeed releases={releases} />
    </div>
  );
}
