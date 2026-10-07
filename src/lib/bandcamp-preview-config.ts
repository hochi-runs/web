import "server-only";
import { isBandcampPreviewOrigin } from "@/lib/bandcamp-preview-core.mjs";

/** Hosted playback stays off until the deployment explicitly supplies its origins. */
export function getBandcampPreviewOrigins(): string[] {
  const configured = (process.env.RADIO_BANDCAMP_PREVIEW_ORIGINS ?? "")
    .split(",").map((origin) => origin.trim()).filter(isBandcampPreviewOrigin);
  if (!configured.length) return [];

  // Include only this deployment's exact platform-provided URL for deployment checks.
  const deploymentOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  if (isBandcampPreviewOrigin(deploymentOrigin)) configured.push(deploymentOrigin);
  return [...new Set(configured)];
}

export function hasCustomBandcampPreview(): boolean {
  return process.env.NODE_ENV === "development" || getBandcampPreviewOrigins().length > 0;
}
