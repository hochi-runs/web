import "server-only";
import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { ContactForm } from "@/components/contact-form";
import { getContactConfig } from "@/lib/contact-core.mjs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact · Hochi Runs",
  description: "Contact Hochi Runs for bookings and label inquiries.",
};

export default function ContactPage() {
  const available = getContactConfig(process.env) !== null;
  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-6 sm:px-8 sm:pb-16">
      <div className="reading-panel">
        <PageHeading title="Contact" subtitle={available
          ? "For bookings and label inquiries, send us a message."
          : "Booking and label inquiries: online contact is temporarily unavailable."} />
        <ContactForm available={available} />
      </div>
    </div>
  );
}
