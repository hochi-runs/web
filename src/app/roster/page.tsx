import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { getArtists } from "@/lib/wordpress";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Roster · Hochi Runs",
  description: "The Hochi Runs roster — artists, producers, and directors.",
};

export default async function RosterPage() {
  const members = await getArtists();
  return (
    <div className="mx-auto max-w-5xl px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <PageHeading title="Artists" />

      <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-12">
        {members.map((member, index) => (
          <li key={member.slug}>
            <Link href={`/roster/${member.slug}`} className="group block">
              <div className="flex aspect-square items-center justify-center overflow-hidden bg-surface text-xs uppercase tracking-widest text-muted">
                {member.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photo}
                    alt={member.name}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="artwork-image h-full w-full object-cover"
                  />
                ) : (
                  <span>{member.name}</span>
                )}
              </div>
              <div className="card-caption reading-surface mt-3">
                <p className="break-words font-medium group-hover:underline">
                  {member.name}
                </p>
                <p className="mt-1 break-words text-xs text-muted">{member.role}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
