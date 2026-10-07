"use client";

import { usePathname } from "next/navigation";

/** Keep the archive's poster composition, with a quieter backdrop behind reading pages. */
export function SiteBackdrop({ imageUrl, opacity }: { imageUrl?: string; opacity?: number }) {
  const pathname = usePathname();
  if (pathname.startsWith("/beta/radio")) return null;
  return (
    <div
      aria-hidden="true"
      data-reading={pathname !== "/"}
      className="site-backdrop pointer-events-none fixed inset-0 z-0 bg-[length:min(90vw,1100px)_auto] bg-center bg-no-repeat dark:invert"
      style={{
        backgroundImage: `url(${JSON.stringify(imageUrl ?? "/hochi-wordmark.png")})`,
        opacity,
      }}
    />
  );
}
