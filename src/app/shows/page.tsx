import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { shows } from "@/data/content";

export const metadata: Metadata = {
  title: "Shows · Hochi Runs",
  description: "Upcoming Hochi Runs shows and events.",
};

export default function ShowsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <PageHeading
        title="Upcoming Shows"
        subtitle="No fluff, just real, unforgettable experiences."
      />
      {shows.length === 0 ? (
        <p className="text-sm text-muted">
          No upcoming shows announced. Check back soon.
        </p>
      ) : (
        <ul className="divide-y divide-yellow/10 border-t border-yellow/10">
          {shows.map((show, i) => (
            <li
              key={`${show.date}-${i}`}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4"
            >
              <div>
                <span className="font-semibold text-yellow">{show.venue}</span>{" "}
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
                    className="text-sm text-red!"
                  >
                    Tickets
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
