import { revalidatePath, revalidateTag } from "next/cache";
import {
  isWebhookAuthorized,
  isWebhookSecretConfigured,
} from "@/lib/cms-webhook.mjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.WORDPRESS_REVALIDATE_SECRET;
  if (!isWebhookSecretConfigured(secret)) {
    return Response.json({ error: "WordPress webhook is not configured." }, { status: 503 });
  }
  if (!isWebhookAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!process.env.WORDPRESS_CONTENT_URL && !process.env.WORDPRESS_ARTISTS_URL) {
    return Response.json({ error: "WordPress content is not connected." }, { status: 409 });
  }

  // WordPress cannot choose arbitrary cache tags or paths through this endpoint.
  revalidateTag("wordpress-content", { expire: 0 });
  revalidatePath("/", "layout");
  for (const path of ["/roster", "/merch", "/shows", "/about", "/legal"]) {
    revalidatePath(path);
  }
  revalidatePath("/roster/[slug]", "page");
  revalidatePath("/releases/[slug]", "page");
  return Response.json({ revalidated: true });
}
