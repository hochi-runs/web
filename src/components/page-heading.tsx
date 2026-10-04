/**
 * Shared page heading, archival style: a restrained monospace title
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
    <header className="mb-8 border-b border-hairline pb-5 sm:mb-10">
      <div className="reading-surface">
        <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.04em] [overflow-wrap:anywhere]">{title}</h1>
        {subtitle && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted [overflow-wrap:anywhere]">{subtitle}</p>
        )}
      </div>
    </header>
  );
}
