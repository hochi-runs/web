import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRelease, getReleases } from "@/lib/wordpress";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

/** Pre-render every release at build time. */
export async function generateStaticParams() {
  const releases = await getReleases();
  return releases.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const release = await getRelease(slug);
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
  const release = await getRelease(slug);
  if (!release) notFound();

  return (
    <article className="px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <div className="mx-auto max-w-[76rem]">
        <Link
          href="/"
          className="reading-label inline-flex min-h-10 items-center text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent"
        >
          ← Index
        </Link>

        <header className="reading-surface mt-6 max-w-4xl">
          <p className="break-words text-xs uppercase tracking-widest text-muted">
            {release.artist}
          </p>
          <h1 className="mt-3 max-w-[28ch] text-[clamp(1.5rem,3.6vw,3rem)] leading-[1.15] tracking-[-0.04em] [overflow-wrap:anywhere]">
            {release.title}
          </h1>
        </header>

        {/* Two columns: artwork left, metadata + tracklist right */}
        <div className="mt-10 grid grid-cols-1 items-start gap-x-14 gap-y-10 lg:mt-12 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
          {/* Artwork */}
          <div>
            <div className="aspect-square w-full overflow-hidden bg-surface">
              {release.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={release.cover}
                  alt={`${release.artist} — ${release.title}`}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-sm uppercase tracking-widest text-muted">
                  {release.code}
                </div>
              )}
            </div>

            {/* Streaming links as small text icons under the art */}
            {release.links && release.links.length > 0 && (
              <ul className="reading-label mt-4 flex w-fit flex-wrap gap-x-5 text-xs uppercase tracking-widest">
                {release.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center text-muted transition-colors hover:text-accent"
                    >
                      {link.platform} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {release.buyUrl && (
              <a
                href={release.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="reading-label mt-1 inline-flex min-h-10 items-center text-xs uppercase tracking-widest transition-colors hover:underline"
              >
                Buy ↗
              </a>
            )}
          </div>

          {/* Metadata + credits + tracklist */}
          <div className="reading-surface min-w-0 text-sm">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {release.code}
            </p>

            <dl className="mt-6 space-y-3">
              <MetaRow label="Album / Release" value={release.title} />
              <MetaRow label="Artist" value={release.artist} />
              <MetaRow label="Release Type" value={release.format} />
              {release.date && (
                <MetaRow label="Date of release" value={release.date} />
              )}
              <MetaRow label="Year" value={String(release.year)} />
              <MetaRow label="Label" value="Hochi Runs" />
              {release.tags && release.tags.length > 0 && (
                <MetaRow label="Tags" value={release.tags.join(", ")} />
              )}
            </dl>

            {release.credits && release.credits.length > 0 && (
              <dl className="mt-6 space-y-3">
                {release.credits.map((credit, i) => (
                  <MetaRow
                    key={`${credit.role}-${i}`}
                    label={credit.role}
                    value={credit.name}
                  />
                ))}
              </dl>
            )}

            {release.description && (
              <p className="mt-8 max-w-prose whitespace-pre-line text-[14px] leading-[1.8] text-muted [overflow-wrap:anywhere]">
                {release.description}
              </p>
            )}

            {release.tracklist && release.tracklist.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xs uppercase tracking-widest text-muted">
                  Tracks
                </h2>
                <ol className="mt-4 space-y-3">
                  {release.tracklist.map((track, i) => (
                    <li
                      key={`${track.title}-${i}`}
                      className="flex items-baseline gap-3"
                    >
                      <span className="w-6 shrink-0 font-mono text-xs text-muted">
                        {i + 1}.
                      </span>
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        {track.title}
                        {track.feat && (
                          <span className="text-muted"> {track.feat}</span>
                        )}
                        {track.duration && (
                          <span className="text-muted">
                            {" "}
                            ({track.duration})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** One metadata row in the "Label: …" liner-note style. */
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
      <dt className="text-muted">{label}:</dt>
      <dd className="min-w-0 [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}
