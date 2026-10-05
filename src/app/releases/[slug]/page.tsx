import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRelease, getReleases } from "@/lib/wordpress";
import { ReleasePrototype } from "@/components/release-prototype";
import { ReleaseArtwork } from "@/components/release-artwork";

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

  if (slug === "like-dat-riddim") return <ReleasePrototype release={release} />;

  return (
    <article className="px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <div className="mx-auto max-w-[100rem]">
        <Link
          href="/"
          className="reading-label text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent"
        >
          ← Index
        </Link>

        <h1 className="reading-surface mt-6 w-fit text-xl tracking-tight sm:text-2xl">
          : {release.artist} — {release.title}
        </h1>

        {/* Two columns: artwork left, metadata + tracklist right */}
        <div className="mt-10 grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
          {/* Artwork */}
          <div>
            <ReleaseArtwork
              src={release.cover}
              title={`${release.artist} — ${release.title}`}
              code={release.code}
              id={release.bandcampId}
              type={release.bandcampType}
            />

            {/* Streaming links as small text icons under the art */}
            {release.links && release.links.length > 0 && (
              <ul className="reading-label mt-5 flex w-fit flex-wrap gap-x-5 gap-y-2 text-xs uppercase tracking-widest">
                {release.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted transition-colors hover:text-accent"
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
                className="reading-label mt-3 inline-block text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent"
              >
                Buy ↗
              </a>
            )}
          </div>

          {/* Metadata + credits + tracklist */}
          <div className="reading-surface h-fit text-sm">
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
