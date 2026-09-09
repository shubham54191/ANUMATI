"use client";
import { useEffect, useState } from "react";

export function TimeCollapse({
  sequential,
  optimised,
}: {
  sequential: number;
  optimised: number;
}) {
  const ratio = optimised / sequential;
  const saved = sequential - optimised;
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase(2);
      return;
    }
    const a = window.setTimeout(() => setPhase(1), 80);
    const b = window.setTimeout(() => setPhase(2), 950);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  const barWidth = phase === 0 ? "0%" : phase === 1 ? "100%" : `${ratio * 100}%`;

  return (
    <div className="flex h-[38px] flex-none items-center gap-4 border-t border-line bg-surface px-5">
      <span className="label w-[54px] flex-none">To scale</span>

      <div className="relative h-[14px] flex-1">
        {/* the full sequential span, always present as the ground */}
        <div className="absolute inset-y-0 left-0 right-0 rounded-sm border border-line bg-bg" />

        {/* the saving — revealed by the collapse, never drawn on top of it */}
        <div
          className="absolute inset-y-0 rounded-r-sm transition-opacity duration-500"
          style={{
            left: `${ratio * 100}%`,
            right: 0,
            opacity: phase === 2 ? 1 : 0,
            transitionDelay: phase === 2 ? "220ms" : "0ms",
            background:
              "repeating-linear-gradient(135deg, rgba(220,38,38,0.16) 0 5px, rgba(220,38,38,0.05) 5px 10px)",
          }}
        />

        {/* the target notch: where the bar is going, visible before it gets there */}
        <div
          className="absolute -top-1 bottom-[-4px] w-px bg-critical/40"
          style={{ left: `${ratio * 100}%` }}
        />

        {/* the bar itself */}
        <div
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{
            width: barWidth,
            background: phase === 2 ? "var(--text)" : "var(--border-strong)",
            transition:
              "width 820ms var(--ease-collapse), background-color 420ms ease",
          }}
        />
      </div>

      <div className="flex w-[228px] flex-none items-center justify-end gap-2">
        <span
          className="font-num font-mono text-[11px] transition-colors duration-300"
          style={{ color: phase === 2 ? "var(--text)" : "var(--text-faint)" }}
        >
          {phase === 2 ? `${optimised} d parallel` : `${sequential} d in sequence`}
        </span>
        <span
          className="font-num rounded-sm border border-critical/40 bg-critical/[0.06] px-1.5 py-px font-mono text-[10.5px] font-medium text-critical transition-opacity duration-500"
          style={{ opacity: phase === 2 ? 1 : 0, transitionDelay: "300ms" }}
        >
          {saved} d saved
        </span>
      </div>
    </div>
  );
}
