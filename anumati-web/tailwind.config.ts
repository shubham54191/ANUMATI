import type { Config } from "tailwindcss";

/**
 * Tokens live in app/globals.css as CSS variables and are surfaced here.
 * Add a colour to globals.css first, then name it here. Never hardcode a hex in a component.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        sunk: "var(--surface-sunk)",
        line: "var(--border)",
        "line-strong": "var(--border-strong)",
        control: "var(--border-control)",
        ink: "var(--text)",
        muted: "var(--text-muted)",
        faint: "var(--text-faint)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-ink": "var(--accent-ink)",
        "accent-muted": "var(--accent-muted)",
        link: "var(--link)",
        "accent-secondary": "var(--accent-secondary)",
        state: {
          pending: "var(--state-pending)",
          active: "var(--state-active)",
          done: "var(--state-done)",
          blocked: "var(--state-blocked)",
          deemed: "var(--state-deemed)",
          "deemed-ink": "var(--state-deemed-ink)",
          "done-ink": "var(--state-done-ink)",
        },
        edge: {
          statutory: "var(--edge-statutory)",
          documentary: "var(--edge-documentary)",
          physical: "var(--edge-physical)",
          practice: "var(--edge-practice)",
        },
        critical: "var(--critical)",
        db: {
          bg: "color-mix(in srgb, var(--db-bg) calc(<alpha-value> * 100%), transparent)",
          line: "color-mix(in srgb, var(--db-line) calc(<alpha-value> * 100%), transparent)",
          ink: "color-mix(in srgb, var(--db-ink) calc(<alpha-value> * 100%), transparent)",
          muted: "color-mix(in srgb, var(--db-muted) calc(<alpha-value> * 100%), transparent)",
          faint: "color-mix(in srgb, var(--db-faint) calc(<alpha-value> * 100%), transparent)",
          navy: "color-mix(in srgb, var(--db-navy) calc(<alpha-value> * 100%), transparent)",
          blue: "color-mix(in srgb, var(--db-blue) calc(<alpha-value> * 100%), transparent)",
          "blue-tint": "color-mix(in srgb, var(--db-blue-tint) calc(<alpha-value> * 100%), transparent)",
          green: "color-mix(in srgb, var(--db-green) calc(<alpha-value> * 100%), transparent)",
          "green-tint": "color-mix(in srgb, var(--db-green-tint) calc(<alpha-value> * 100%), transparent)",
          purple: "color-mix(in srgb, var(--db-purple) calc(<alpha-value> * 100%), transparent)",
          "purple-tint": "color-mix(in srgb, var(--db-purple-tint) calc(<alpha-value> * 100%), transparent)",
          emerald: "color-mix(in srgb, var(--db-emerald) calc(<alpha-value> * 100%), transparent)",
          "emerald-tint": "color-mix(in srgb, var(--db-emerald-tint) calc(<alpha-value> * 100%), transparent)",
          red: "color-mix(in srgb, var(--db-red) calc(<alpha-value> * 100%), transparent)",
          "red-tint": "color-mix(in srgb, var(--db-red-tint) calc(<alpha-value> * 100%), transparent)",
          "red-line": "color-mix(in srgb, var(--db-red-line) calc(<alpha-value> * 100%), transparent)",
          teal: "color-mix(in srgb, var(--db-teal) calc(<alpha-value> * 100%), transparent)",
          "teal-tint": "color-mix(in srgb, var(--db-teal-tint) calc(<alpha-value> * 100%), transparent)",
          amber: "color-mix(in srgb, var(--db-amber) calc(<alpha-value> * 100%), transparent)",
          "amber-strong": "color-mix(in srgb, var(--db-amber-strong) calc(<alpha-value> * 100%), transparent)",
          "amber-tint": "color-mix(in srgb, var(--db-amber-tint) calc(<alpha-value> * 100%), transparent)",
          "amber-line": "color-mix(in srgb, var(--db-amber-line) calc(<alpha-value> * 100%), transparent)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: { DEFAULT: "3px", sm: "2px", md: "3px" },
      boxShadow: {
        panel: "-12px 0 28px rgba(26, 26, 24, 0.06)",
        critical: "0 0 0 4px var(--critical-glow)",
      },
    },
  },
  plugins: [],
};
export default config;
