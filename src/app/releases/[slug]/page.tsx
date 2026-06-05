import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRelease, releases } from "@/data/releases";

/** Pre-render every release at build time. */
export function generateStaticParams() {
  return releases.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const release = getRelease(slug);
  if (!release) return {};
  return {
    title: `${release.artist} — ${release.title} · Hochi Runs`,
    description: release.description,
  };
}

export default async function ReleasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const release = getRelease(slug);
  if (!release) notFound();

  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <Link href="/" className="text-xs text-muted hover:text-yellow">
        ← All releases
      </Link>

      <header className="mt-6">
        <p className="font-mono text-xs text-red">
          {release.code} · {release.year}
        </p>
        <h1 className="mt-2 text-yellow text-3xl font-bold tracking-tight sm:text-4xl">
          {release.artist}
        </h1>
        <p className="mt-1 text-lg text-muted">{release.title}</p>
      </header>

      {release.description && (
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">
          {release.description}
        </p>
      )}

      {release.tracklist && release.tracklist.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-widest text-red">
            Tracklist
          </h2>
          <ol className="mt-4 divide-y divide-yellow/10 border-t border-yellow/10">
            {release.tracklist.map((track, i) => (
              <li
                key={`${track.title}-${i}`}
                className="flex items-baseline gap-4 py-3"
              >
                <span className="font-mono text-xs text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-yellow">
                  {track.title}
                  {track.feat && (
                    <span className="text-muted"> {track.feat}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {release.links && release.links.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-widest text-red">Listen</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {release.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded border border-red px-4 py-2 text-sm text-red! hover:bg-red hover:text-black!"
                >
                  {link.platform}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
