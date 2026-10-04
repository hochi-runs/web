import { releases } from "@/data/releases";
import { createWordPressCatalog } from "@/lib/wordpress-catalog.mjs";

/** A read-only picker feed. It has no dependency on the WordPress content feed. */
export function GET(request: Request) {
  const url = new URL(request.url);
  // Local previews still use public HTTPS references for the few archive covers.
  const origin = url.protocol === "https:" ? url.origin : "https://hochiruns.com";
  return Response.json(createWordPressCatalog(releases, origin), {
    headers: { "Cache-Control": "no-store" },
  });
}
