import "server-only";
import { handleContactRequest } from "@/lib/contact-core.mjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleContactRequest(request);
}
