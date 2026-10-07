import type { Metadata } from "next";
import { RadioBeta } from "@/components/radio-beta";

export const metadata: Metadata = {
  title: "Radio beta · Hochi Runs",
  robots: { index: false, follow: false },
};

export default function RadioBetaPage() {
  return <RadioBeta />;
}
