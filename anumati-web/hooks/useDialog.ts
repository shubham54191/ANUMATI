"use client";
import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * One behaviour for every dialog in the app.
 *
 * - Focus moves into the dialog when it opens and returns to whatever opened
 *   it when it closes.
 * - Tab and Shift+Tab stay inside the dialog.
 * - Escape (and the backdrop, via the returned `dismiss`) closes it — unless
 *   `dirty` is true, i.e. the person has typed something a stray key would
 *   throw away. Then only Cancel or ✕ closes it.
 */
export function useDialog(open: boolean, onClose: () => void, dirty = false) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const dirtyRef = useRef(dirty);
  closeRef.current = onClose;
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const node = ref.current;
    // First field if there is one (the person came to type), else the first control.
    const first =
      node?.querySelector<HTMLElement>("[data-autofocus]") ??
      node?.querySelector<HTMLElement>("textarea:not([disabled]), input:not([disabled]):not([type=hidden]):not([type=radio]):not([type=checkbox]), select:not([disabled])") ??
      node?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // The dialog owns Escape while it is open: it never also closes the
        // panel behind it (which would take the dialog and its text with it).
        e.stopPropagation();
        if (!dirtyRef.current) closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      opener?.focus?.();
    };
  }, [open]);

  const dismiss = () => {
    if (!dirtyRef.current) closeRef.current();
  };

  return { ref, dismiss };
}
