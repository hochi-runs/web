const MAX_BODY_BYTES = 16 * 1024;
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const SINGLE_LINE_CONTROLS = /[\u0000-\u001f\u007f]/;
const MESSAGE_CONTROLS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

class ContactInputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function validEmail(value) {
  if (typeof value !== "string" || value.length > 254 || !EMAIL.test(value)) return false;
  const local = value.split("@")[0];
  return local.length <= 64 && !local.startsWith(".") && !local.endsWith(".") && !local.includes("..");
}

/** These values are used only on the server; the page receives a readiness boolean. */
export function getContactConfig(environment = {}) {
  const apiKey = environment.RESEND_API_KEY?.trim();
  const to = environment.CONTACT_TO_EMAIL?.trim();
  const from = environment.CONTACT_FROM_EMAIL?.trim();
  if (!apiKey || !/^re_[A-Za-z0-9_-]{10,256}$/.test(apiKey) || !validEmail(to) || !validEmail(from)) return null;
  return { apiKey, to, from };
}

export function parseContactMessage(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new ContactInputError("Please check the contact form and try again.");
  }
  if (Object.keys(value).some((key) => !["name", "email", "message", "website"].includes(key))) {
    throw new ContactInputError("Please check the contact form and try again.");
  }
  if (value.website != null && (typeof value.website !== "string" || value.website !== "")) {
    throw new ContactInputError("Please check the contact form and try again.");
  }
  if (typeof value.name !== "string" || typeof value.email !== "string" || typeof value.message !== "string") {
    throw new ContactInputError("Please enter your name, email address, and message.");
  }
  const name = value.name.trim();
  const email = value.email.trim();
  const message = value.message.trim().replace(/\r\n?/g, "\n");
  if (!name || name.length > 100 || SINGLE_LINE_CONTROLS.test(name)) {
    throw new ContactInputError("Enter a name of up to 100 characters.");
  }
  if (!validEmail(email)) throw new ContactInputError("Enter a valid email address.");
  if (!message || message.length > 5000 || MESSAGE_CONTROLS.test(message)) {
    throw new ContactInputError("Enter a message of up to 5,000 characters.");
  }
  return { name, email, message };
}

async function readJsonBody(request, timeoutMs) {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength != null && !/^\d+$/.test(declaredLength)) throw new ContactInputError("Invalid request.");
  if (declaredLength != null && Number(declaredLength) > MAX_BODY_BYTES) {
    throw new ContactInputError("The message is too large.", 413);
  }
  if (!request.body) throw new ContactInputError("Please complete the contact form.");
  const reader = request.body.getReader();
  let timer;
  const timedOut = new Promise((_, reject) => {
    timer = setTimeout(() => {
      void reader.cancel().catch(() => {});
      reject(new ContactInputError("The request timed out. Please try again.", 408));
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      (async () => {
        let size = 0;
        const parts = [];
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BODY_BYTES) {
            void reader.cancel().catch(() => {});
            throw new ContactInputError("The message is too large.", 413);
          }
          parts.push(value);
        }
        try {
          return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts)));
        } catch {
          throw new ContactInputError("Please check the contact form and try again.");
        }
      })(),
      timedOut,
    ]);
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}

function json(body, status) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Resend REST contract: https://resend.com/docs/api-reference/emails/send-email */
export async function handleContactRequest(request, {
  environment = process.env,
  fetchImpl = fetch,
  timeoutMs = 8000,
  bodyTimeoutMs = 5000,
} = {}) {
  // This blocks cross-origin browser submissions, not scripts impersonating a browser.
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return json({ error: "Please send your message from the website's contact form." }, 403);
  }
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get("content-type") ?? "")) {
    return json({ error: "Please use the website's contact form." }, 415);
  }
  const config = getContactConfig(environment);
  if (!config) return json({ error: "Contact is temporarily unavailable. Please try again later." }, 503);

  let controller;
  let timer;
  try {
    const message = parseContactMessage(await readJsonBody(request, bodyTimeoutMs));
    controller = new AbortController();
    const timedOut = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error("Contact delivery timed out"));
      }, timeoutMs);
    });
    await Promise.race([
      (async () => {
        const response = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          redirect: "error",
          signal: controller.signal,
          headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `Hochi Runs <${config.from}>`,
            to: [config.to],
            reply_to: message.email,
            subject: `Website inquiry from ${message.name}`,
            text: `Name: ${message.name}\nReply email: ${message.email}\n\n${message.message}`,
          }),
        });
        if (!response.ok) {
          await response.body?.cancel();
          throw new Error("Contact delivery was not accepted");
        }
        const result = await response.json();
        if (typeof result?.id !== "string" || !result.id) throw new Error("Contact delivery response was invalid");
      })(),
      timedOut,
    ]);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof ContactInputError) return json({ error: error.message }, error.status);
    // Do not return/log email contents, recipient, credentials, or provider error bodies.
    return json({ error: "Your message could not be sent. Please try again later." }, 502);
  } finally {
    clearTimeout(timer);
  }
}
