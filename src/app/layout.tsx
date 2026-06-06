import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";

/**
 * Monospace, year0001-style. JetBrains Mono is the closest free stand-in for
 * Akkurat-Mono — clean, neutral, technical. Loaded as a CSS variable and set
 * as the default sans in globals.css.
 */
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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

/**
 * Runs before first paint to set the theme class, so there's no flash.
 * Reads a saved choice, otherwise falls back to the OS preference.
 *
 * Dark mode is currently DISABLED (light is forced). The original logic is
 * kept below, commented out, so it can be re-enabled in one step later.
 */
// const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;
// Forced-light: ensure no stale `.dark` class survives from a prior session.
const themeScript = `(function(){try{document.documentElement.classList.remove('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        {/* Fixed wordmark backdrop — sits behind everything, doesn't scroll.
            Inverts in dark mode so the black art shows on the dark bg. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 bg-[length:min(90vw,1100px)_auto] bg-center bg-no-repeat opacity-100 dark:invert"
          style={{ backgroundImage: "url('/hochi-wordmark.png')" }}
        />
        {/* Fixed-corner chrome floats over the page; only content scrolls. */}
        <SiteChrome />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
