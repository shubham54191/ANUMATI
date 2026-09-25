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
          bg: "var(--db-bg)",
          line: "var(--db-line)",
          ink: "var(--db-ink)",
          muted: "var(--db-muted)",
          faint: "var(--db-faint)",
          navy: "var(--db-navy)",
          blue: "var(--db-blue)",
          "blue-tint": "var(--db-blue-tint)",
          green: "var(--db-green)",
          "green-tint": "var(--db-green-tint)",
          purple: "var(--db-purple)",
          "purple-tint": "var(--db-purple-tint)",
          emerald: "var(--db-emerald)",
          "emerald-tint": "var(--db-emerald-tint)",
          red: "var(--db-red)",
          "red-tint": "var(--db-red-tint)",
          "red-line": "var(--db-red-line)",
          teal: "var(--db-teal)",
          "teal-tint": "var(--db-teal-tint)",
          amber: "var(--db-amber)",
          "amber-strong": "var(--db-amber-strong)",
          "amber-tint": "var(--db-amber-tint)",
          "amber-line": "var(--db-amber-line)",
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
