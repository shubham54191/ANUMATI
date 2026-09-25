"use client";
import { ChevronsRight, Pause, Play, RotateCcw, Send } from "lucide-react";
import type { ApplicationFile, DerivedMatrixState } from "@/types/matrix";
import { useMatrixStore } from "@/store/useMatrixStore";
import { PhaseStepper } from "./PhaseStepper";
import { cn } from "@/lib/utils";

/**
 * The file's masthead, its clock, and the three-stop phase stepper. The
 * stepper replaced a thin progress bar: a bar answers "how far along", and the
 * question an officer actually has is "which stage is this in, and is it still
 * moving".
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
    <div className="db-rise rounded-xl border border-db-line bg-surface px-5 py-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[11.5px] font-semibold tracking-[0.03em] text-db-ink">
              {app.id}
            </span>
            <span className="h-[14px] w-px bg-db-line" />
            <span className="truncate text-[12.5px] text-db-muted">{app.applicant}</span>
            <span className="h-[14px] w-px bg-db-line" />
            <span className="truncate text-[12.5px] text-db-muted">{app.location}</span>
          </div>

          <h1 className="mt-1.5 text-[23px] font-semibold leading-tight tracking-[-0.01em] text-db-ink">
            {app.project}
          </h1>
          <p className="mt-1 text-[13px] text-db-muted">{app.phase}</p>
        </div>

        <div className="flex flex-none items-center gap-2">
          {!app.dispatched ? (
            <button
              onClick={dispatchAll}
              className="flex h-10 items-center gap-2 rounded-xl bg-db-blue px-4 text-[13px] font-semibold text-white transition-colors hover:brightness-95"
            >
              <Send className="h-4 w-4" strokeWidth={1.9} />
              Dispatch to all {app.reviews.length} departments
            </button>
          ) : (
            <>
              <div className="flex h-11 flex-col items-center justify-center rounded-xl border border-db-line bg-db-bg px-4">
                <span className="text-[9.5px] font-bold tracking-[0.09em] text-db-faint">DAY</span>
                <span
                  key={app.day}
                  className="db-count font-num text-[16px] font-bold leading-none text-db-ink"
                >
                  {app.day}
                </span>
              </div>

              <div className="flex h-11 items-center gap-1 rounded-xl border border-db-line bg-surface px-1.5">
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
                    "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11.5px] font-semibold transition-colors",
                    "disabled:pointer-events-none disabled:opacity-40",
                    clockRunning
                      ? "bg-db-blue-tint text-db-blue"
                      : "text-db-muted hover:bg-db-bg hover:text-db-ink",
                  )}
                >
                  {clockRunning ? (
                    <Pause className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    <Play className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  CLOCK
                </button>
                <span className="h-5 w-px bg-db-line" />
                <button
                  onClick={() => advance(1)}
                  disabled={settled}
                  title={settled ? "The phase is settled — the clock has stopped" : "Advance one day"}
                  className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11.5px] font-semibold text-db-muted transition-colors hover:bg-db-bg hover:text-db-ink disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronsRight className="h-3.5 w-3.5" strokeWidth={2} />
                  +1 D
                </button>
              </div>
            </>
          )}

          <button
            onClick={resetFile}
            title="Reset this file to its filed state"
            className="flex h-11 items-center gap-2 rounded-xl border border-db-line bg-surface px-3.5 text-[12.5px] text-db-muted transition-colors hover:border-db-blue/40 hover:text-db-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4">
        <PhaseStepper derived={derived} />
      </div>
    </div>
  );
}
