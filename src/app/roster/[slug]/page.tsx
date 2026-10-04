import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArtist, getArtists, getArtistReleases } from "@/lib/wordpress";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

/** Pre-render every member page at build time. */
export async function generateStaticParams() {
  const members = await getArtists();
  return members.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const member = await getArtist(slug);
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
  const member = await getArtist(slug);
  if (!member) notFound();

  const memberReleases = await getArtistReleases(member);

  return (
    <article className="mx-auto max-w-3xl px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <Link
        href="/roster"
        className="reading-label inline-flex min-h-10 items-center text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent"
      >
        ← Artists
      </Link>

      <header className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="aspect-square w-40 shrink-0 overflow-hidden bg-surface">
          {member.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photo}
              alt={member.name}
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-muted">
              {member.name}
            </div>
          )}
        </div>
        <div className="reading-surface min-w-0">
          <h1 className="text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-[-0.04em] [overflow-wrap:anywhere]">{member.name}</h1>
          <p className="mt-3 break-words text-sm text-muted">{member.role}</p>
        </div>
      </header>

      {member.bio && (
        <p className="reading-surface mt-8 max-w-prose whitespace-pre-line text-[14px] leading-[1.8] text-muted [overflow-wrap:anywhere]">
          {member.bio}
        </p>
      )}

      {member.socials && member.socials.length > 0 && (
        <ul className="reading-surface mt-5 flex w-fit flex-wrap gap-x-5 text-xs uppercase tracking-widest">
          {member.socials.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center text-muted transition-colors hover:text-accent"
              >
                {s.platform} ↗
              </a>
            </li>
          ))}
        </ul>
      )}

      {memberReleases.length > 0 && (
        <section className="reading-surface mt-12">
          <h2 className="text-xs uppercase tracking-widest text-muted">
            Releases
          </h2>
          <ul className="mt-4 border-t border-hairline">
            {memberReleases.map((release) => (
              <li key={release.slug} className="border-b border-hairline">
                <Link
                  href={`/releases/${release.slug}`}
                  className="group flex items-baseline justify-between gap-4 py-4"
                >
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    <span className="block group-hover:underline">
                      {release.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted">{release.artist}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">
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
