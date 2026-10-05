import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { getShows } from "@/lib/wordpress";
import type { Show } from "@/data/content";
import { partitionShows } from "@/lib/show-dates.mjs";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shows · Hochi Runs",
  description: "Upcoming dates and the Hochi Runs show and event archive.",
};

export default async function ShowsPage() {
  const { upcoming, past } = partitionShows(await getShows());
  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <PageHeading title="Live" />
      <section aria-labelledby="upcoming-shows">
        <h2 id="upcoming-shows" className="reading-label mb-3 w-fit text-xs uppercase tracking-widest text-muted">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="reading-surface inline-block text-sm text-muted">
            No upcoming shows announced. Check back soon.
          </p>
        ) : <ShowsList shows={upcoming} />}
      </section>
      {past.length > 0 && (
        <section aria-labelledby="past-shows" className="mt-10">
          <h2 id="past-shows" className="reading-label mb-3 w-fit text-xs uppercase tracking-widest text-muted">
            Archive
          </h2>
          <ShowsList shows={past} past />
        </section>
      )}
    </div>
  );
}

function ShowsList({ shows, past = false }: { shows: Show[]; past?: boolean }) {
  return (
    <ul className="reading-surface border-t border-hairline">
      {shows.map((show, i) => (
        <li
          key={`${show.date}-${i}`}
          className="flex items-start gap-5 border-b border-hairline py-4"
        >
          {show.image && (
            <a
              href={show.image}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View full flyer for ${show.venue}`}
              className="block aspect-[3/4] w-24 shrink-0 sm:w-36"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={show.image}
                alt={`${show.venue} event flyer`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain object-top"
              />
            </a>
          )}
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <div className="min-w-0 break-words">
              <span>{show.venue}</span>{" "}
              <span className="text-sm text-muted">— {show.city}</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
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
                  {past ? "Details ↗" : "Tickets ↗"}
                </a>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
