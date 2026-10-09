"use client";

import { useEffect, type RefObject } from "react";

/** One keyboard/background lifecycle for the archive and radio mobile menus. */
export function useModalMenu(
  open: boolean,
  onClose: () => void,
  dialogRef: RefObject<HTMLDivElement | null>,
  triggerRef: RefObject<HTMLButtonElement | null>,
  fallbackRef: RefObject<HTMLAnchorElement | null>,
) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const trigger = triggerRef.current;
    const fallback = fallbackRef.current;
    const previousOverflow = document.body.style.overflow;
    const isolated: { element: HTMLElement; inert: boolean }[] = [];
    // Isolate siblings at every level, never an ancestor containing the dialog.
    // This works for radio's nested scene and the archive's body-level chrome.
    let branch: Element = dialog;
    while (branch.parentElement) {
      const parent = branch.parentElement;
      for (const element of parent.children) {
        if (element instanceof HTMLElement && element !== branch) {
          isolated.push({ element, inert: element.inert });
          element.toggleAttribute("inert", true);
        }
      }
      if (parent === document.body) break;
      branch = parent;
    }
    document.body.style.overflow = "hidden";
    const targets = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
    )).filter((element) => !element.inert && element.getClientRects().length > 0);
    const focusFirst = () => (targets()[0] ?? dialog).focus();
    focusFirst();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Tab") {
        const items = targets();
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) {
          event.preventDefault();
          dialog?.focus();
        } else if (!dialog?.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    function focusin(event: FocusEvent) {
      if (!dialog?.contains(event.target as Node)) focusFirst();
    }
    const desktop = window.matchMedia("(min-width: 640px)");
    const resize = () => { if (desktop.matches) onClose(); };
    document.addEventListener("keydown", keydown);
    document.addEventListener("focusin", focusin);
    desktop.addEventListener("change", resize);
    resize();
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("focusin", focusin);
      desktop.removeEventListener("change", resize);
      isolated.forEach(({ element, inert }) => { element.toggleAttribute("inert", inert); });
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected && !desktop.matches) trigger.focus();
      else if (desktop.matches && fallback?.isConnected) fallback.focus();
    };
  }, [open, onClose, dialogRef, triggerRef, fallbackRef]);
}
