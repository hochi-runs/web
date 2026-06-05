import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { talent } from "@/data/content";

export const metadata: Metadata = {
  title: "Talent · Hochi Runs",
  description: "Artists, producers, and directors in the Hochi Runs collective.",
};

export default function TalentPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <PageHeading
        title="Talent"
        subtitle="The artists, producers, and directors of the collective."
      />
      <ul className="divide-y divide-yellow/10 border-t border-yellow/10">
        {talent.map((member) => {
          const inner = (
            <div className="flex items-baseline justify-between gap-4 py-4">
              <span className="font-semibold text-yellow">{member.name}</span>
              <span className="text-sm text-muted">{member.role}</span>
            </div>
          );
          return (
            <li key={member.name}>
              {member.url ? (
                <a
                  href={member.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-yellow! hover:text-yellow!"
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
