"use client";
import { create } from "zustand";

const KEY = "anumati.explain";

/**
 * Explain mode.
 *
 * The screens used to carry paragraphs saying how the product works — why a
 * phase runs in parallel, why a button is disabled, what a decision matrix is.
 * That copy is worth having when the product is being shown to someone for the
 * first time and is noise to anyone actually working a file, so it lives behind
 * this switch instead of on the screen. Off by default.
 */
interface ExplainState {
  on: boolean;
  hydrated: boolean;
  hydrate: () => void;
  toggle: () => void;
}

export const useExplainStore = create<ExplainState>((set, get) => ({
  on: false,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    let on = false;
    try {
      on = window.localStorage.getItem(KEY) === "1";
    } catch {
      // Private browsing, or storage blocked. The default stands.
    }
    set({ on, hydrated: true });
  },
  toggle: () =>
    set((s) => {
      const on = !s.on;
      try {
        window.localStorage.setItem(KEY, on ? "1" : "0");
      } catch {
        // Nothing to do — the switch still works for this session.
      }
      return { on };
    }),
}));
