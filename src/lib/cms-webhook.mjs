import { timingSafeEqual } from "node:crypto";

export function isWebhookSecretConfigured(secret) {
  return typeof secret === "string" && /^[A-Za-z0-9_-]{32,256}$/.test(secret);
}

export function isWebhookAuthorized(authorization, secret) {
  if (!isWebhookSecretConfigured(secret) || typeof authorization !== "string") {
    return false;
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const supplied = Buffer.from(authorization);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
