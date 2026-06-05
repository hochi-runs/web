/** Shared page heading in the arrow-wrapped Hochi style: ⇼ Title ⇼ */
export function PageHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-10">
      <h1 className="text-yellow text-3xl font-bold tracking-tight sm:text-4xl">
        ⇼ {title} ⇼
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-xl text-sm text-muted">{subtitle}</p>
      )}
    </header>
  );
}
