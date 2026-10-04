import test from "node:test";
import assert from "node:assert/strict";
import { isWebhookAuthorized, isWebhookSecretConfigured } from "../src/lib/cms-webhook.mjs";

const secret = "qwerty_QWERTY-01234567890123456789";

test("webhook requires a long URL-safe server secret", () => {
  for (const value of [undefined, "", "short", " ".repeat(32), "a".repeat(257)]) {
    assert.equal(isWebhookSecretConfigured(value), false);
  }
  assert.equal(isWebhookSecretConfigured(secret), true);
});

test("only the exact bearer header authorizes cache invalidation", () => {
  assert.equal(isWebhookAuthorized(`Bearer ${secret}`, secret), true);
  for (const header of [null, "", secret, `bearer ${secret}`, `Bearer ${secret}x`, `Bearer ${secret.slice(1)}`, `Bearer ${"x".repeat(secret.length)}`]) {
    assert.equal(isWebhookAuthorized(header, secret), false);
  }
  assert.equal(isWebhookAuthorized("Bearer short", "short"), false);
});
