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
    <div className="mx-auto max-w-5xl px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <PageHeading title="Artists" />

      <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
        {members.map((member) => (
          <li key={member.slug}>
            <Link href={`/roster/${member.slug}`} className="group block">
              <div className="flex aspect-square items-center justify-center overflow-hidden bg-surface text-xs uppercase tracking-widest text-muted">
                {member.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                  />
                ) : (
                  <span>{member.name}</span>
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
