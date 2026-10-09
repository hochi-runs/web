/** Read/negative-path checks only against a disconnected loopback Next server. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { load } from "cheerio";

const target = new URL(process.argv[2] ?? "http://127.0.0.1:3001");
if (target.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(target.hostname)
  || !target.port || target.username || target.password || target.pathname !== "/" || target.search || target.hash) {
  throw new Error("Use an explicit HTTP loopback origin and port for the disconnected local server.");
}
createRequire(import.meta.url)("@next/env").loadEnvConfig(process.cwd());
const origin = target.origin;
const contact = await fetch(origin + "/contact");
assert.equal(contact.status, 200);
const $ = load(await contact.text());
assert.equal($("fieldset[disabled]").length, 1, "Run only with contact delivery unavailable");
assert.match($(".reading-panel").text(), /online contact is temporarily unavailable/);
console.log("GET /contact: 200, accurate unavailable heading, disabled fieldset.");

const alias = new URL(origin);
alias.hostname = target.hostname === "localhost" ? "127.0.0.1" : "localhost";
for (const [requestOrigin, expected] of [[null, 403], ["https://untrusted.example", 403], [alias.origin, 403], [origin, 503]]) {
  const headers = { "content-type": "application/json" };
  if (requestOrigin) headers.origin = requestOrigin;
  // Always-invalid input cannot send even if delivery is enabled concurrently.
  const response = await fetch(origin + "/api/contact", { method: "POST", headers, body: "{}" });
  assert.equal(response.status, expected);
  assert.equal((await response.json()).ok, undefined);
  assert.equal(response.headers.get("cache-control"), "no-store");
  console.log("POST /api/contact: " + (requestOrigin === origin ? "exact visitor origin, absent delivery configuration"
    : requestOrigin ? "foreign/internal-alias origin" : "missing origin") + " => " + response.status + ", no success.");
}
for (const authorization of [undefined, "Bearer invalid-fixture-token"]) {
  const response = await fetch(origin + "/api/wordpress/revalidate", {
    method: "POST", headers: authorization ? { authorization } : {},
  });
  assert.equal(response.status, 401);
  console.log("POST /api/wordpress/revalidate: " + (authorization ? "incorrect bearer" : "missing bearer") + " => 401.");
}
// This is the existing LOCAL server secret, never a production request or URL.
assert.ok(process.env.WORDPRESS_REVALIDATE_SECRET, "Local server secret needed for disconnected-mode check");
const refresh = await fetch(origin + "/api/wordpress/revalidate", {
  method: "POST", headers: { authorization: "Bearer " + process.env.WORDPRESS_REVALIDATE_SECRET },
});
assert.equal(refresh.status, 409, "Run with both WordPress URL settings explicitly empty");
console.log("POST /api/wordpress/revalidate: correct local bearer, disconnected CMS => 409; no cache invalidation.");
