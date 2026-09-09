import type { Config } from "tailwindcss";

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
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
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
