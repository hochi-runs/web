/**
 * Shared page heading, archival style: a small uppercase eyebrow-free title
 * with a thin rule beneath. Quiet and editorial to match the catalog.
 */
export function PageHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-12 border-b border-hairline pb-4">
      <h1 className="text-xl tracking-tight sm:text-2xl">{title}</h1>
      {subtitle && (
        <p className="mt-2 max-w-xl text-sm text-muted">{subtitle}</p>
      )}
    </header>
  );
}
