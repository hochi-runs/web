import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { getPageParagraphs } from "@/lib/wordpress";
import { getLocalPageParagraphs } from "@/data/pages";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Legal · Hochi Runs",
  description: "Legal information for Hochi Runs.",
};

export default async function LegalPage() {
  const paragraphs = await getPageParagraphs("legal") ?? getLocalPageParagraphs().legal.paragraphs;
  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-6 sm:px-8 sm:pb-16">
      <PageHeading title="Legal" />
      <div className="reading-surface max-w-xl space-y-4 text-sm leading-relaxed text-muted">
        {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
    </div>
  );
}
