"use client";
import type { DerivedMatrixState } from "@/types/matrix";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * Scenario C. Departments score instead of voting, and the consolidated
 * weighted average is shown live — an officer should never have to work out on
 * paper whether the phase is passing.
 */
export function WeightedScoreCard({ weighted }: { weighted: NonNullable<DerivedMatrixState["weighted"]> }) {
  const { score, threshold, pass, complete, contributions } = weighted;

  return (
    <div className="rounded-xl border border-db-line bg-surface">
      <div className="flex items-center justify-between border-b border-db-line px-3.5 py-2.5">
        <Label>Consolidated dashboard score</Label>
        <span className="font-mono text-[10.5px] text-db-faint">
          {complete ? "all departments scored" : `${contributions.length} of the panel scored`}
        </span>
      </div>

      <div className="flex items-end gap-4 px-3.5 pt-3">
        <div>
          <span
            className={cn(
              "font-num font-sans text-[38px] font-medium leading-none",
              pass ? "text-db-green" : "text-db-red",
            )}
          >
            {score.toFixed(1)}
          </span>
          <span className="ml-1 text-[12px] text-db-muted">/ 100</span>
        </div>
        <div className="pb-1">
          <div className="font-mono text-[11px] text-db-muted">
            passing score <span className="font-semibold text-db-ink">{threshold}</span>
          </div>
          <div
            className={cn(
              "font-mono text-[11px] font-medium tracking-[0.04em]",
              pass ? "text-db-green" : "text-db-red",
            )}
          >
            {pass ? "ABOVE THRESHOLD" : `BELOW THRESHOLD BY ${(threshold - score).toFixed(1)}`}
          </div>
        </div>
      </div>

      {/* The bar, with the threshold marked on it. */}
      <div className="px-3.5 pb-3 pt-2.5">
        <div className="relative h-[10px] overflow-hidden rounded-sm bg-db-bg">
          <div
            className={cn("h-full rounded-sm transition-[width] duration-500", pass ? "bg-db-green" : "bg-db-red")}
            style={{ width: `${Math.min(100, score)}%` }}
          />
          <span
            className="absolute top-0 h-full w-px bg-ink"
            style={{ left: `${threshold}%` }}
            aria-hidden
          />
        </div>
        <div className="relative mt-1 h-4">
          <span
            className="absolute -translate-x-1/2 font-mono text-[9.5px] tracking-[0.05em] text-db-ink"
            style={{ left: `${threshold}%` }}
          >
            {threshold} PASS
          </span>
        </div>
      </div>

      <div className="border-t border-db-line px-3.5 py-2.5">
        <Label className="mb-1.5 block">How the average is made</Label>
        <div className="flex flex-col gap-1.5">
          {contributions.map((c) => (
            <div key={c.dept_short} className="flex items-center gap-2.5">
              <span className="w-[76px] flex-none font-mono text-[11px] text-db-ink">{c.dept_short}</span>
              <div className="h-[5px] flex-1 overflow-hidden rounded-sm bg-db-bg">
                <div
                  className={cn("h-full rounded-sm", c.score >= threshold ? "bg-db-green" : "bg-db-red")}
                  style={{ width: `${c.score}%` }}
                />
              </div>
              <span className="font-num w-[64px] flex-none text-right font-mono text-[11px] text-db-ink">
                {c.score}/100
              </span>
              <span className="font-num w-[62px] flex-none text-right font-mono text-[10.5px] text-db-faint">
                {c.share.toFixed(0)}% wt
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
