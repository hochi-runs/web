import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";
import type { CSSProperties } from "react";
import { getAppearance } from "@/lib/wordpress";
import { appearanceCssVariables } from "@/lib/wordpress-core.mjs";

export const revalidate = 60;

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appearance = await getAppearance();
  const backgroundStyle: CSSProperties | undefined = appearance.backgroundImageUrl ? {
    backgroundImage: `url(${JSON.stringify(appearance.backgroundImageUrl)})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  } : undefined;
  return (
    <html
      lang="en"
      className={`${mono.variable} h-full antialiased`}
      style={appearanceCssVariables(appearance) as CSSProperties}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full" style={backgroundStyle}>
        {/* Fixed wordmark backdrop — sits behind everything, doesn't scroll.
            Inverts in dark mode so the black art shows on the dark bg. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 bg-[length:min(90vw,1100px)_auto] bg-center bg-no-repeat opacity-100 dark:invert"
          style={{
            backgroundImage: `url(${JSON.stringify(appearance.backgroundLogoUrl ?? "/hochi-wordmark.png")})`,
            opacity: appearance.backgroundLogoOpacity,
          }}
        />
        {/* Fixed-corner chrome floats over the page; only content scrolls. */}
        <SiteChrome logoUrl={appearance.logoUrl} />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
