"use client";

import { useState, type FormEvent } from "react";

export function ContactForm({ available }: { available: boolean }) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ message: string; error: boolean } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!available || pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setStatus(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        credentials: "same-origin",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          website: data.get("website") ?? "",
        }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setStatus({ message: typeof result.error === "string" ? result.error : "We could not confirm submission. Your message is still here; please try again later.", error: true });
        return;
      }
      form.reset();
      setStatus({ message: "Thanks. Your message has been submitted for delivery.", error: false });
    } catch {
      // A lost response can happen after the provider accepts the message.
      setStatus({ message: "We could not confirm submission. Your message is still here; please try again later.", error: true });
    } finally {
      window.clearTimeout(timer);
      setPending(false);
    }
  }

  return (
    <form className="contact-form" method="post" action="/api/contact" onSubmit={submit} aria-busy={pending}>
      {!available && <p className="contact-status" role="status">Contact is temporarily unavailable. Please try again later.</p>}
      <fieldset disabled={!available || pending}>
        <legend className="sr-only">Your contact details and message</legend>
        <div className="contact-field">
          <label htmlFor="contact-name">Name</label>
          <input id="contact-name" name="name" autoComplete="name" maxLength={100} required />
        </div>
        <div className="contact-field">
          <label htmlFor="contact-email">Email</label>
          <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required />
        </div>
        <div className="contact-field">
          <label htmlFor="contact-message">Message</label>
          <textarea id="contact-message" name="message" rows={7} maxLength={5000} required />
        </div>
        <div className="contact-honeypot" aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
          <label htmlFor="contact-website">Website</label>
          <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <button type="submit" className="contact-submit" disabled={!available || pending}>{pending ? "SENDING…" : "SEND MESSAGE"}</button>
      </fieldset>
      <div aria-live="polite" aria-atomic="true">
        {status && <p className="contact-status" role={status.error ? "alert" : "status"}>{status.message}</p>}
      </div>
      <noscript><p>Enable JavaScript to use this contact form.</p></noscript>
    </form>
  );
}
