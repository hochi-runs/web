import test from "node:test";
import assert from "node:assert/strict";
import { getContactConfig, handleContactRequest } from "../src/lib/contact-core.mjs";

const environment = { RESEND_API_KEY: "re_test_fake_key_123456", CONTACT_FROM_EMAIL: "website@example.com", CONTACT_TO_EMAIL: "label@example.com" };
const message = { name: "Test Artist", email: "artist@example.net", message: "A booking inquiry.\nSecond line.", website: "" };
const request = (body = message, extraHeaders = {}) => new Request("https://hochiruns.com/api/contact", {
  method: "POST",
  headers: { origin: "https://hochiruns.com", "content-type": "application/json", ...extraHeaders },
  body: typeof body === "string" ? body : JSON.stringify(body),
});
const forbiddenFetch = () => { throw new Error("External sending must not occur in this test."); };

test("unconfigured contact is unavailable and cannot send", async () => {
  for (const env of [{}, { ...environment, RESEND_API_KEY: "" }, { ...environment, CONTACT_FROM_EMAIL: "bad\r\nBcc: attacker@example.net" }]) {
    assert.equal(getContactConfig(env), null);
    const response = await handleContactRequest(request(), { environment: env, fetchImpl: forbiddenFetch });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, undefined);
  }
});

test("cross-origin and unsupported browser requests never reach email delivery", async () => {
  for (const origin of ["https://evil.example", "null", "https://hochiruns.com.evil.example"]) {
    const response = await handleContactRequest(request(message, { origin }), { environment, fetchImpl: forbiddenFetch });
    assert.equal(response.status, 403);
  }
  const response = await handleContactRequest(request(message, { "content-type": "text/plain" }), { environment, fetchImpl: forbiddenFetch });
  assert.equal(response.status, 415);
});

test("the Next internal URL does not reject the visitor's exact Host origin", async () => {
  for (const [host, origin, protocol] of [
    ["127.0.0.1:3000", "http://127.0.0.1:3000", "http"],
    ["hochiruns.com", "https://hochiruns.com", "https"],
    ["hochiruns.com:443", "https://hochiruns.com", "https"],
  ]) {
    const proxied = new Request("http://localhost:3000/api/contact", {
      method: "POST", headers: { host, origin, "x-forwarded-proto": protocol, "content-type": "application/json" },
      body: JSON.stringify(message),
    });
    const response = await handleContactRequest(proxied, { environment: {}, fetchImpl: forbiddenFetch });
    assert.equal(response.status, 503, "same-origin request must reach the unavailable-config check");
  }
});

test("Origin remains exact and forwarded authority/malformed headers cannot authorize sending", async () => {
  const invalid = [
    { host: "hochiruns.com", origin: "https://evil.example", "x-forwarded-host": "evil.example" },
    { host: "hochiruns.com", origin: "https://hochiruns.com.evil.example" },
    { host: "hochiruns.com", origin: "https://hochiruns.com:8443" },
    { host: "hochiruns.com,evil.example" },
    { host: "hochiruns.com/evil" },
    { host: "user:password@hochiruns.com" },
    { host: "hochiruns.com", "x-forwarded-proto": "https,http" },
    { host: "hochiruns.com", "x-forwarded-proto": "file" },
    { host: "hochiruns.com", origin: "https://hochiruns.com/path" },
    { host: "hochiruns.com", "sec-fetch-site": "cross-site" },
    { host: "hochiruns.com", origin: "http://hochiruns.com", "x-forwarded-proto": "http" },
  ];
  for (const extraHeaders of invalid) {
    const response = await handleContactRequest(request(message, extraHeaders), { environment, fetchImpl: forbiddenFetch });
    assert.equal(response.status, 403);
  }
});

test("invalid data, address injection and honeypot submissions cannot send", async () => {
  const invalid = [
    null, [], "not-json", { ...message, name: "" }, { ...message, name: "A\nB" },
    { ...message, email: "artist@example.net\r\nBcc: attacker@example.net" },
    { ...message, email: "a@example.net,b@example.net" }, { ...message, message: "" },
    { ...message, message: "x".repeat(5001) }, { ...message, message: "bad\u0000content" },
    { ...message, website: "https://bot.example" }, { ...message, to: "attacker@example.net" },
  ];
  for (const body of invalid) {
    const response = await handleContactRequest(request(body), { environment, fetchImpl: forbiddenFetch });
    assert.equal(response.status, 400);
  }
});

test("body limits check actual streamed bytes even without a declared length", async () => {
  const response = await handleContactRequest(request("x".repeat(16 * 1024 + 1)), { environment, fetchImpl: forbiddenFetch });
  assert.equal(response.status, 413);
  const declared = await handleContactRequest(request(message, { "content-length": "20000" }), { environment, fetchImpl: forbiddenFetch });
  assert.equal(declared.status, 413);
});

test("an incomplete request body times out without sending", async () => {
  const slowBody = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"name":')); } });
  const slowRequest = new Request("https://hochiruns.com/api/contact", {
    method: "POST", duplex: "half", body: slowBody,
    headers: { origin: "https://hochiruns.com", "content-type": "application/json" },
  });
  const response = await handleContactRequest(slowRequest, { environment, fetchImpl: forbiddenFetch, bodyTimeoutMs: 10 });
  assert.equal(response.status, 408);
});

test("valid submission uses the private fixed recipient and safe reply address through Resend", async () => {
  let sent;
  const response = await handleContactRequest(request(message), {
    environment,
    fetchImpl: async (url, init) => { sent = { url, init, body: JSON.parse(init.body) }; return Response.json({ id: "fake-message-id" }); },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(sent.url, "https://api.resend.com/emails");
  assert.equal(sent.init.method, "POST");
  assert.equal(sent.init.redirect, "error");
  assert.equal(sent.init.headers.Authorization, `Bearer ${environment.RESEND_API_KEY}`);
  assert.deepEqual(sent.body.to, [environment.CONTACT_TO_EMAIL]);
  assert.equal(sent.body.from, `Hochi Runs <${environment.CONTACT_FROM_EMAIL}>`);
  assert.equal(sent.body.reply_to, message.email);
  assert.ok(sent.body.text.includes(message.message));
  assert.equal(sent.body.html, undefined);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("provider failures and timeouts return failure without leaking provider details", async () => {
  for (const fetchImpl of [
    async () => Response.json({ error: "private provider details", key: environment.RESEND_API_KEY }, { status: 429 }),
    async () => Response.json({ unexpected: true }),
    async () => { throw new Error(`Private key ${environment.RESEND_API_KEY}`); },
    async () => new Promise(() => {}),
  ]) {
    const response = await handleContactRequest(request(), { environment, fetchImpl, timeoutMs: 10 });
    assert.equal(response.status, 502);
    const body = await response.text();
    assert.ok(!body.includes(environment.RESEND_API_KEY));
    assert.ok(!body.includes("private provider"));
    assert.ok(!body.includes(environment.CONTACT_TO_EMAIL));
  }
});

test("a provider response timeout is an unconfirmed submission, never a receipt claim", async () => {
  let deliverySignal;
  const response = await handleContactRequest(request(), {
    environment,
    timeoutMs: 10,
    fetchImpl: async (_, { signal }) => {
      deliverySignal = signal;
      // The provider returned 200, but its acceptance response never completed.
      // The server cannot determine whether a message was accepted or delivered.
      return new Response(new ReadableStream({
        start(controller) { controller.enqueue(new TextEncoder().encode('{"id":')); },
      }), { headers: { "content-type": "application/json" } });
    },
  });
  assert.equal(response.status, 502);
  assert.equal(deliverySignal.aborted, true);
  const result = await response.json();
  assert.equal(result.ok, undefined);
  assert.match(result.error, /could not confirm submission/i);
  assert.doesNotMatch(result.error, /has been sent|received|could not be sent/i);
});
