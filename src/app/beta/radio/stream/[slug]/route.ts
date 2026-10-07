import "server-only";
import { getReleases } from "@/lib/wordpress";
import { createBandcampPreviewResponse, isBandcampPreviewRequest } from "@/lib/bandcamp-preview-core.mjs";
import { getBandcampPreviewOrigins } from "@/lib/bandcamp-preview-config";

export const runtime = "nodejs";

type PreviewContext = { params: Promise<{ slug: string }> };

async function handle(request: Request, context: PreviewContext) {
  // Reject unconfigured hosts and remote origins before reading CMS/catalog data.
  const allowedOrigins = getBandcampPreviewOrigins();
  if (!isBandcampPreviewRequest(request, process.env.NODE_ENV, allowedOrigins)) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const { slug } = await context.params;
  try {
    return await createBandcampPreviewResponse({ request, slug, releases: await getReleases(), allowedOrigins });
  } catch {
    return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET(request: Request, context: PreviewContext) {
  return handle(request, context);
}

export async function HEAD(request: Request, context: PreviewContext) {
  return handle(request, context);
}
