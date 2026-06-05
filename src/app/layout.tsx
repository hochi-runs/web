import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hochi Runs — Label · Collective · Agency",
  description:
    "Hochi Runs is an independent record label, collective, and agency. Browse the catalog, talent, videos, and shows.",
  metadataBase: new URL("https://hochiruns.com"),
  openGraph: {
    title: "Hochi Runs — Label · Collective · Agency",
    description:
      "Independent record label, collective, and agency. Browse the catalog, talent, videos, and shows.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${mulish.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
