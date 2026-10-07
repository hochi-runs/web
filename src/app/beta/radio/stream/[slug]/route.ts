import "server-only";
import { getReleases } from "@/lib/wordpress";
import { createBandcampPreviewResponse, isLocalBandcampPreviewRequest } from "@/lib/bandcamp-preview-core.mjs";

export const runtime = "nodejs";

type PreviewContext = { params: Promise<{ slug: string }> };

async function handle(request: Request, context: PreviewContext) {
  // Reject deployments and remote origins before reading any CMS/catalog data.
  if (!isLocalBandcampPreviewRequest(request)) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const { slug } = await context.params;
  try {
    return await createBandcampPreviewResponse({ request, slug, releases: await getReleases() });
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
