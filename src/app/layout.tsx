import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";
import { SiteFooter } from "@/components/site-footer";
import { SiteBackdrop } from "@/components/site-backdrop";
import { SitePlayerProvider } from "@/components/site-player";
import type { CSSProperties } from "react";
import { getAppearance, getReleases } from "@/lib/wordpress";
import { appearanceCssVariables } from "@/lib/wordpress-core.mjs";
import { releaseArchive } from "@/data/releases";
import { hasCustomBandcampPreview } from "@/lib/bandcamp-preview-config";

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
  title: "Hochi Runs",
  description:
    "Browse the Hochi Runs music catalog, artists, and shows.",
  metadataBase: new URL("https://hochiruns.com"),
  openGraph: {
    title: "Hochi Runs",
    description:
      "Browse the Hochi Runs music catalog, artists, and shows.",
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
  const [appearance, catalog] = await Promise.all([getAppearance(), getReleases()]);
  const playerReleases = catalog.flatMap((release) => release.bandcampId
    && Number.isSafeInteger(release.bandcampId) && release.bandcampId > 0 && release.bandcampType
    ? [{ id: release.bandcampId, type: release.bandcampType, slug: release.slug, title: release.title,
      artist: release.artist, buyUrl: release.buyUrl, details: release,
      cover: releaseArchive.find((entry) => entry.bandcampId === release.bandcampId)?.cover ?? release.cover }]
    : []);
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
      <body className="min-h-full" style={backgroundStyle} data-custom-background={appearance.backgroundImageUrl ? "true" : undefined}>
        {/* Fixed wordmark backdrop — sits behind everything, doesn't scroll.
            Inverts in dark mode so the black art shows on the dark bg. */}
        <SitePlayerProvider releases={playerReleases} customBandcampPreview={hasCustomBandcampPreview()}>
          <SiteBackdrop imageUrl={appearance.backgroundLogoUrl} opacity={appearance.backgroundLogoOpacity} />
          {/* Header, page-specific composition, and site information own separate regions. */}
          <SiteChrome logoUrl={appearance.logoUrl} />
          <main className="relative z-10">{children}</main>
          <SiteFooter />
        </SitePlayerProvider>
      </body>
    </html>
  );
}
