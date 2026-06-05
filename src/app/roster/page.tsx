import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { members } from "@/data/roster";

export const metadata: Metadata = {
  title: "Roster · Hochi Runs",
  description: "The Hochi Runs roster — artists, producers, and directors.",
};

export default function RosterPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <PageHeading
        title="Roster"
        subtitle="The collective — artists, producers, and directors."
      />

      <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
        {members.map((member) => (
          <li key={member.slug}>
            <Link
              href={`/roster/${member.slug}`}
              className="group block text-yellow! hover:text-yellow!"
            >
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded border border-yellow/10 bg-white/5 text-xs text-muted">
                {member.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                  />
                ) : (
                  <span>Photo coming soon</span>
                )}
              </div>
              <div className="mt-3">
                <p className="font-semibold group-hover:underline">
                  {member.name}
                </p>
                <p className="text-sm text-muted">{member.role}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
