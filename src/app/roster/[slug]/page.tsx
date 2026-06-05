import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMember, members } from "@/data/roster";
import { getReleasesByMember } from "@/data/releases";

/** Pre-render every member page at build time. */
export function generateStaticParams() {
  return members.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const member = getMember(slug);
  if (!member) return {};
  return {
    title: `${member.name} · Hochi Runs`,
    description: member.bio ?? `${member.name} — ${member.role}`,
  };
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = getMember(slug);
  if (!member) notFound();

  const memberReleases = getReleasesByMember(member.slug);

  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <Link href="/roster" className="text-xs text-muted hover:text-yellow">
        ← Roster
      </Link>

      <header className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="aspect-square w-40 shrink-0 overflow-hidden rounded border border-yellow/10 bg-white/5">
          {member.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photo}
              alt={member.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted">
              Photo coming soon
            </div>
          )}
        </div>
        <div>
          <h1 className="text-yellow text-3xl font-bold tracking-tight sm:text-4xl">
            {member.name}
          </h1>
          <p className="mt-1 text-muted">{member.role}</p>
        </div>
      </header>

      {member.bio && (
        <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted">
          {member.bio}
        </p>
      )}

      {member.socials && member.socials.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {member.socials.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.platform}
              </a>
            </li>
          ))}
        </ul>
      )}

      {memberReleases.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-widest text-red">
            Releases
          </h2>
          <ul className="mt-4 divide-y divide-yellow/10 border-t border-yellow/10">
            {memberReleases.map((release) => (
              <li key={release.slug}>
                <Link
                  href={`/releases/${release.slug}`}
                  className="group flex items-baseline justify-between gap-4 py-3 text-yellow! hover:text-yellow!"
                >
                  <span className="min-w-0">
                    <span className="font-semibold group-hover:underline">
                      {release.artist}
                    </span>{" "}
                    <span className="text-sm text-muted">{release.title}</span>
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {release.code}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
