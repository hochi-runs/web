"use client";

import { useSyncExternalStore } from "react";

/**
 * Minimal light/dark toggle. The actual first-paint theme is set by the
 * inline script in layout.tsx (to avoid a flash); this component reads the
 * resulting `.dark` class and flips it (plus localStorage) on click.
 *
 * `useSyncExternalStore` lets us read the DOM class as the source of truth
 * while rendering a stable SSR fallback — no setState-in-effect needed.
 * Rendered as a quiet text control to match the archival aesthetic.
 */
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getIsDark() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  // Client snapshot reads the DOM; server snapshot is always `false` so the
  // label renders as a neutral placeholder until hydration.
  const isDark = useSyncExternalStore(subscribe, getIsDark, () => false);

  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable (private mode) — fall back to in-session only
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light or dark theme"
      aria-pressed={isDark}
      className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
      suppressHydrationWarning
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
