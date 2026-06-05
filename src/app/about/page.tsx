import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";

export const metadata: Metadata = {
  title: "About · Hochi Runs",
  description:
    "Hochi Runs is an independent record label, collective, and agency.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <PageHeading title="About" />
      <div className="max-w-xl space-y-4 text-sm leading-relaxed text-muted">
        <p>
          Hochi Runs is an independent record label, collective, and agency.
          We put out music, make videos, and put on shows.
        </p>
        <p>
          This is placeholder copy — replace it with the real story of the
          label whenever you&apos;re ready. The structure is here; just swap the
          words.
        </p>
      </div>
    </div>
  );
}
