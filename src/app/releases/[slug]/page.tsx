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
    <article className="px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <div className="mx-auto max-w-[100rem]">
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
        >
          ← Index
        </Link>

        <h1 className="mt-6 text-xl tracking-tight sm:text-2xl">
          : {release.artist} — {release.title}
        </h1>

        {/* Two columns: artwork left, metadata + tracklist right */}
        <div className="mt-10 grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
          {/* Artwork */}
          <div>
            <div className="aspect-square w-full overflow-hidden bg-surface">
              {release.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={release.cover}
                  alt={`${release.artist} — ${release.title}`}
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
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs uppercase tracking-widest">
                {release.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted transition-colors hover:text-foreground"
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
                className="mt-3 inline-block text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
              >
                Buy ↗
              </a>
            )}
          </div>

          {/* Metadata + credits + tracklist */}
          <div className="text-sm">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {release.code}
            </p>

            <dl className="mt-6 space-y-1.5">
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
              <dl className="mt-6 space-y-1.5">
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
              <p className="mt-6 max-w-md leading-relaxed text-muted">
                {release.description}
              </p>
            )}

            {release.tracklist && release.tracklist.length > 0 && (
              <section className="mt-10">
                <h2 className="text-xs uppercase tracking-widest text-muted">
                  Tracks
                </h2>
                <ol className="mt-3 space-y-1.5">
                  {release.tracklist.map((track, i) => (
                    <li
                      key={`${track.title}-${i}`}
                      className="flex items-baseline gap-3"
                    >
                      <span className="font-mono text-xs text-muted">
                        {i + 1}.
                      </span>
                      <span>
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
    <div className="flex gap-2">
      <dt className="text-muted">{label}:</dt>
      <dd>{value}</dd>
    </div>
  );
}
