"use client";
import { useEffect } from "react";
import { Info } from "lucide-react";
import { useExplainStore } from "@/store/useExplainStore";
import { cn } from "@/lib/utils";

/**
 * Copy that explains how the product works rather than helping with the task in
 * front of the reader. Hidden unless Explain is on, so the working screens stay
 * short and the walkthrough still has its script.
 */
export function Explain({ children, className }: { children: React.ReactNode; className?: string }) {
  const on = useExplainStore((s) => s.on);
  const hydrate = useExplainStore((s) => s.hydrate);
  useEffect(() => hydrate(), [hydrate]);
  if (!on) return null;
  return (
    <p
      className={cn(
        "anim-rise mt-2 max-w-2xl border-l-2 border-accent/30 pl-2.5 text-[12px] leading-relaxed text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** The switch itself. One per chrome bar. */
export function ExplainToggle({ className }: { className?: string }) {
  const on = useExplainStore((s) => s.on);
  const toggle = useExplainStore((s) => s.toggle);
  const hydrate = useExplainStore((s) => s.hydrate);
  useEffect(() => hydrate(), [hydrate]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={on ? "Hide the notes on how this works" : "Show notes on how this works"}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded border px-2.5 font-mono text-[11px] transition-colors",
        on
          ? "border-accent bg-accent-muted text-accent"
          : "border-line text-muted hover:border-accent hover:text-accent",
        className,
      )}
    >
      <Info className="h-3.5 w-3.5" strokeWidth={1.6} />
      Explain
    </button>
  );
}
