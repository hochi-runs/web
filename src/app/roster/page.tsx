import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { getArtists } from "@/lib/wordpress";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Roster · Hochi Runs",
  description: "The Hochi Runs roster — artists, producers, and DJs.",
};

export default async function RosterPage() {
  const members = await getArtists();
  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 pt-6 sm:px-8 sm:pb-16">
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
                    alt={`${member.name} profile image`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                  />
                ) : (
                  <span className="px-4 text-center">Portrait not published</span>
                )}
              </div>
              <div className="reading-surface mt-3">
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
