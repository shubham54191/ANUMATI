"use client";
import { CheckCircle2, ChevronRight, Circle, Gavel, Loader2, ShieldAlert, Users } from "lucide-react";
import type { DerivedMatrixState } from "@/types/matrix";
import { cn } from "@/lib/utils";

/**
 * Where the file is in its own life, as three stops rather than a bar.
 *
 * A bar answers "how far"; an officer's question is "which stage, and is it
 * moving". The middle stop carries the file, so it is the one that pulses —
 * and it stops pulsing the moment the phase halts, which is exactly when a
 * still amber pill and an unmoving file should agree with each other.
 */

type StopState = "done" | "current" | "halted" | "ahead";

const STOP: Record<StopState, { tile: string; shell: string; text: string; Icon: typeof Circle }> = {
  done: {
    tile: "bg-db-green text-white",
    shell: "border-db-green/25 bg-db-green-tint",
    text: "text-db-ink",
    Icon: CheckCircle2,
  },
  current: {
    tile: "bg-db-blue text-white",
    shell: "border-db-blue/30 bg-db-blue-tint",
    text: "text-db-ink",
    Icon: Loader2,
  },
  halted: {
    tile: "bg-db-amber-strong text-white",
    shell: "border-db-amber-line bg-db-amber-tint",
    text: "text-db-ink",
    Icon: ShieldAlert,
  },
  ahead: {
    tile: "bg-db-bg text-db-faint",
    shell: "border-db-line bg-surface",
    text: "text-db-muted",
    Icon: Users,
  },
};

const VERDICT_CHIP: Record<
  DerivedMatrixState["verdict"],
  { label: string; className: string; Icon: typeof Circle } | null
> = {
  awaiting_dispatch: null,
  in_progress: null,
  conflict_halted: {
    label: "HALTED — TECHNICAL VETO",
    className: "bg-db-amber-tint text-db-amber",
    Icon: ShieldAlert,
  },
  conflict_escalation: {
    label: "SUSPENDED — EQUAL WEIGHT",
    className: "bg-db-amber-tint text-db-amber",
    Icon: Gavel,
  },
  conflict_scored: {
    label: "SCORED — UNDER EVALUATION",
    className: "bg-db-purple-tint text-db-purple",
    Icon: Circle,
  },
  awaiting_tie_breaker: {
    label: "WITH THE TIE-BREAKER PANEL",
    className: "bg-db-amber-tint text-db-amber",
    Icon: Gavel,
  },
  cleared: {
    label: "ALL DEPARTMENTS CLEARED",
    className: "bg-db-green-tint text-db-green",
    Icon: CheckCircle2,
  },
  settled: {
    label: "PHASE SETTLED",
    className: "bg-db-green-tint text-db-green",
    Icon: CheckCircle2,
  },
};

function Stop({
  index,
  name,
  state,
}: {
  index: number;
  name: string;
  state: StopState;
}) {
  const s = STOP[state];
  return (
    <div
      className={cn(
        "db-pop flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3.5 py-2.5",
        s.shell,
      )}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <span
        className={cn(
          "flex h-7 w-7 flex-none items-center justify-center rounded-lg",
          s.tile,
          state === "current" && "db-halo",
        )}
        style={state === "current" ? ({ "--halo": "rgba(37, 99, 235, 0.35)" } as React.CSSProperties) : undefined}
      >
        <s.Icon
          className={cn("h-[15px] w-[15px]", state === "current" && "animate-spin [animation-duration:2.4s]")}
          strokeWidth={2}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[10.5px] font-bold tracking-[0.08em] text-db-muted">
          PHASE {index + 1}
        </span>
        <span className={cn("block truncate text-[12.5px] font-semibold leading-tight", s.text)}>
          {name}
        </span>
      </span>
    </div>
  );
}

export function PhaseStepper({ derived }: { derived: DerivedMatrixState }) {
  const halted =
    derived.verdict === "conflict_halted" ||
    derived.verdict === "conflict_escalation" ||
    derived.verdict === "awaiting_tie_breaker";
  const finished = derived.verdict === "cleared" || derived.verdict === "settled";

  const states: StopState[] = finished
    ? ["done", "done", "current"]
    : halted
      ? ["done", "halted", "ahead"]
      : derived.verdict === "awaiting_dispatch"
        ? ["current", "ahead", "ahead"]
        : ["done", "current", "ahead"];

  const chip = VERDICT_CHIP[derived.verdict];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Stop index={0} name="Initial Review" state={states[0]} />
      <ChevronRight className="h-4 w-4 flex-none text-db-faint" strokeWidth={2} />
      <Stop index={1} name="Parallel Review" state={states[1]} />
      <ChevronRight className="h-4 w-4 flex-none text-db-faint" strokeWidth={2} />
      <Stop index={2} name="Final Decision" state={states[2]} />

      {chip ? (
        <span
          className={cn(
            "db-pop ml-1 flex flex-none items-center gap-1.5 rounded-full px-3 py-2 text-[10.5px] font-bold tracking-[0.05em]",
            chip.className,
          )}
          style={{ animationDelay: "280ms" }}
        >
          <chip.Icon className="h-3.5 w-3.5" strokeWidth={2} />
          {chip.label}
        </span>
      ) : null}
    </div>
  );
}
