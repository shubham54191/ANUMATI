"use client";
import { ChevronsRight, Pause, Play, RotateCcw, Send } from "lucide-react";
import type { ApplicationFile, DerivedMatrixState } from "@/types/matrix";
import { useMatrixStore } from "@/store/useMatrixStore";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const TONE_BAR: Record<DerivedMatrixState["tone"], string> = {
  neutral: "bg-line-strong",
  active: "bg-state-active",
  orange: "bg-state-deemed",
  red: "bg-critical",
  green: "bg-state-done",
};

const VERDICT_LABEL: Record<DerivedMatrixState["verdict"], string> = {
  awaiting_dispatch: "Not yet dispatched",
  in_progress: "Parallel review running",
  conflict_halted: "Halted — technical veto",
  conflict_escalation: "Suspended — equal weight",
  conflict_scored: "Scored — under evaluation",
  awaiting_tie_breaker: "With the tie-breaker panel",
  cleared: "All departments cleared",
  settled: "Phase settled",
};

/**
 * The file's masthead, the overarching progress bar, and the clock. The bar
 * turns orange the moment the phase stops being able to finish on its own —
 * that colour is the difference between "still working" and "stuck".
 */
export function FileHeader({
  app,
  derived,
}: {
  app: ApplicationFile;
  derived: DerivedMatrixState;
}) {
  const dispatchAll = useMatrixStore((s) => s.dispatchAll);
  const advance = useMatrixStore((s) => s.advance);
  const toggleClock = useMatrixStore((s) => s.toggleClock);
  const clockRunning = useMatrixStore((s) => s.clockRunning);
  const resetFile = useMatrixStore((s) => s.resetFile);

  // The engine refuses to advance a settled file; the controls say so rather
  // than sitting there looking live and doing nothing.
  const settled = Boolean(app.resolution);

  return (
    <div className="flex-none border-b border-line bg-surface">
      <div className="flex items-start gap-4 px-5 pb-3 pt-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11.5px] font-semibold tracking-[0.04em] text-ink">
              {app.id}
            </span>
            <span className="h-[14px] w-px bg-line" />
            <span className="truncate text-[12.5px] text-muted">{app.applicant}</span>
            <span className="h-[14px] w-px bg-line" />
            <span className="truncate text-[12.5px] text-muted">{app.location}</span>
          </div>
          <h1 className="mt-1 font-serif text-[20px] font-medium leading-tight text-ink">
            {app.project}
          </h1>
          <p className="mt-0.5 text-[12px] text-muted">{app.phase}</p>
        </div>

        <div className="flex flex-none items-center gap-2">
          {!app.dispatched ? (
            <Button variant="primary" onClick={dispatchAll}>
              <Send className="h-3 w-3" strokeWidth={1.5} />
              Dispatch to all {app.reviews.length} departments
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-1.5 rounded border border-line bg-sunk p-0.5">
                <button
                  onClick={toggleClock}
                  aria-pressed={clockRunning}
                  disabled={settled}
                  title={
                    settled
                      ? "The phase is settled — the clock has stopped"
                      : clockRunning
                        ? "Pause the SLA clock"
                        : "Run the SLA clock"
                  }
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-sm px-2.5 font-mono text-[11px] transition-colors",
                    "disabled:pointer-events-none disabled:opacity-40",
                    clockRunning
                      ? "border border-accent/30 bg-accent-muted font-medium text-accent"
                      : "text-muted hover:text-accent",
                  )}
                >
                  {clockRunning ? (
                    <Pause className="h-3 w-3" strokeWidth={1.6} />
                  ) : (
                    <Play className="h-3 w-3" strokeWidth={1.6} />
                  )}
                  CLOCK
                </button>
                <button
                  onClick={() => advance(1)}
                  disabled={settled}
                  title={settled ? "The phase is settled — the clock has stopped" : "Advance one day"}
                  className="flex h-8 items-center gap-1 rounded-sm px-2.5 font-mono text-[11px] text-muted transition-colors hover:text-accent disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronsRight className="h-3 w-3" strokeWidth={1.6} />
                  +1 D
                </button>
              </div>
              <div className="rounded border border-line bg-sunk px-3 py-1 text-center">
                <Label className="block">Day</Label>
                <span className="font-num font-mono text-[15px] font-semibold text-ink">
                  {app.day}
                </span>
              </div>
            </>
          )}
          <Button variant="ghost" onClick={resetFile} title="Reset this file to its filed state">
            <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
            Reset
          </Button>
        </div>
      </div>

      {/* Overarching pipeline progress. */}
      <div className="flex items-center gap-3 border-t border-line px-5 py-2">
        <span className="label flex-none">Phase</span>
        <div className="h-[6px] flex-1 overflow-hidden rounded-sm bg-sunk">
          <div
            className={cn("h-full rounded-sm transition-[width,background-color] duration-500", TONE_BAR[derived.tone])}
            style={{ width: `${Math.max(derived.progress, derived.conflict ? 100 : derived.progress)}%` }}
          />
        </div>
        <span
          className={cn(
            "flex-none font-mono text-[11px] font-medium tracking-[0.04em]",
            derived.tone === "orange" && "text-state-deemed-ink",
            derived.tone === "red" && "text-critical",
            derived.tone === "green" && "text-state-done-ink",
            (derived.tone === "active" || derived.tone === "neutral") && "text-muted",
          )}
        >
          {VERDICT_LABEL[derived.verdict].toUpperCase()}
        </span>
        <span className="flex-none font-num font-mono text-[11px] text-muted">
          {derived.approved.length + derived.deemed.length} cleared · {derived.rejected.length} rejected ·{" "}
          {derived.pending.length} open
        </span>
      </div>
    </div>
  );
}
