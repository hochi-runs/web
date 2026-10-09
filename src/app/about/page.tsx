import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { getPageParagraphs } from "@/lib/wordpress";
import { getLocalPageParagraphs } from "@/data/pages";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About · Hochi Runs",
  description: "About Hochi Runs.",
};

export default async function AboutPage() {
  const paragraphs = await getPageParagraphs("about") ?? getLocalPageParagraphs().about.paragraphs;
  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-6 sm:px-8 sm:pb-16">
      <PageHeading title="About" />
      <div className="reading-surface max-w-xl space-y-4 text-sm leading-relaxed text-muted">
        {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
    </div>
  );
}
