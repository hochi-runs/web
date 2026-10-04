import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { getShows } from "@/lib/wordpress";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shows · Hochi Runs",
  description: "Upcoming Hochi Runs shows and events.",
};

export default async function ShowsPage() {
  const shows = await getShows();
  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <PageHeading title="Live" />
      {shows.length === 0 ? (
        <p className="reading-surface inline-block text-sm text-muted">
          No upcoming shows announced. Check back soon.
        </p>
      ) : (
        <ul className="reading-surface border-t border-hairline">
          {shows.map((show, i) => (
            <li
              key={`${show.date}-${i}`}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-hairline py-4"
            >
              <div>
                <span>{show.venue}</span>{" "}
                <span className="text-sm text-muted">— {show.city}</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-xs text-muted">
                  {show.date}
                </span>
                {show.ticketUrl && (
                  <a
                    href={show.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
                  >
                    Tickets ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
