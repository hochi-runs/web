import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { getPageParagraphs } from "@/lib/wordpress";
import { getLocalPageParagraphs } from "@/data/pages";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About · Hochi Runs",
  description:
    "Hochi Runs is an independent record label, collective, and agency.",
};

export default async function AboutPage() {
  const paragraphs = await getPageParagraphs("about") ?? getLocalPageParagraphs().about.paragraphs;
  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <PageHeading title="About" />
      <div className="reading-surface max-w-xl space-y-4 text-sm leading-relaxed text-muted">
        {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
    </div>
  );
}
