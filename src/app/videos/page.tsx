import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { videos } from "@/data/content";

export const metadata: Metadata = {
  title: "Videos · Hochi Runs",
  description: "Music videos from Hochi Runs artists.",
};

export default function VideosPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <PageHeading title="Videos" />
      {videos.length === 0 ? (
        <p className="text-sm text-muted">Videos coming soon.</p>
      ) : (
        <div className="space-y-12">
          {videos.map((video) => (
            <figure key={video.youtubeId}>
              <div className="aspect-video w-full overflow-hidden bg-surface">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${video.youtubeId}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
              <figcaption className="reading-surface mt-3">
                <p className="text-sm">{video.title}</p>
                {video.credit && (
                  <p className="text-sm text-muted">{video.credit}</p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
