import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Radio · Hochi Runs",
  robots: { index: false, follow: false },
};

/** The shared layout expands its existing player for this route. */
export default async function RadioBetaPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await searchParams;
  return null;
}
