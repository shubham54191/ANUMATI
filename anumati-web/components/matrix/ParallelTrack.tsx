"use client";
import { ArrowUpRight, Gavel, ShieldAlert } from "lucide-react";
import type { ApplicationFile, DeptReview, DerivedMatrixState } from "@/types/matrix";
import { REVIEW_META, slaFraction, slaLabel } from "@/lib/matrix/display";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * The visual pipeline. One track goes in, splits into a lane per department,
 * and comes back together at a gate. When two lanes end in opposite colours the
 * split is the whole story — you can see the roadblock without reading a word.
 */

const START_W = 132;
const NODE_X = 208;
const NODE_W = 252;
const NODE_H = 76;
const PITCH = 100;
const GATE_X = 528;
const GATE_W = 132;
const TIE_X = 712;
const TIE_W = 196;

function laneColor(review: DeptReview): string {
  return `var(${REVIEW_META[review.state].colorVar})`;
}

function DeptNode({ review, day }: { review: DeptReview; day: number }) {
  const meta = REVIEW_META[review.state];
  const fraction = slaFraction(review, day);
  const overdue = review.decided_on_day === null && review.sla_days - day < 0;

  return (
    <div
      className={cn(
        "anim-node flex h-full w-full flex-col justify-between rounded border bg-surface px-2.5 py-2",
        meta.border,
        review.state === "rejected" && "shadow-[0_0_0_3px_rgba(220,38,38,0.12)]",
        review.state === "approved" && "shadow-[0_0_0_3px_rgba(22,163,74,0.10)]",
      )}
      style={{ borderLeft: `3px solid var(${meta.colorVar})` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] font-semibold tracking-[0.05em] text-ink">
            {review.dept_short}
          </span>
          {review.veto ? (
            <ShieldAlert
              className="h-3 w-3 text-accent-secondary"
              strokeWidth={1.7}
              aria-label="Holds veto power on this file"
            />
          ) : null}
        </span>
        <span
          className={cn(
            "rounded-sm px-1.5 py-px font-mono text-[9.5px] font-medium tracking-[0.06em]",
            meta.bg,
            meta.text,
          )}
        >
          {meta.label}
        </span>
      </div>

      <div className="truncate text-[11.5px] font-medium leading-tight text-ink">
        <span className="font-mono text-[10px] text-faint">{review.approval_id}</span>{" "}
        {review.approval_name}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-[10.5px] text-muted">{review.officer_name}</span>
          <span
            className={cn(
              "flex-none font-num font-mono text-[10px]",
              overdue ? "font-medium text-state-deemed-ink" : "text-faint",
            )}
          >
            {slaLabel(review, day)}
          </span>
        </div>
        <div className="h-[3px] overflow-hidden rounded-sm bg-sunk">
          <div
            className="h-full rounded-sm transition-[width] duration-500"
            style={{
              width: `${fraction * 100}%`,
              background: overdue ? "var(--state-deemed)" : laneColor(review),
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function ParallelTrack({
  app,
  derived,
}: {
  app: ApplicationFile;
  derived: DerivedMatrixState;
}) {
  const n = app.reviews.length;
  const height = Math.max(n * PITCH - (PITCH - NODE_H), 190);
  const width = app.tie_breaker_open ? TIE_X + TIE_W : GATE_X + GATE_W + 24;
  const midY = height / 2;
  const rowY = (i: number) => i * PITCH;
  const rowMid = (i: number) => rowY(i) + NODE_H / 2;

  const gateTone = derived.conflict
    ? "var(--critical)"
    : derived.verdict === "cleared" || derived.verdict === "settled"
      ? "var(--state-done)"
      : "var(--border-strong)";

  return (
    <section className="border-b border-line bg-bg px-5 py-4">
      <div className="mb-3 flex items-center gap-3">
        <Label>Parallel review track</Label>
        <span className="text-[11.5px] text-muted">
          One file, {n} departments, dispatched together. Each lane runs its own clock.
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="relative" style={{ width, height }}>
          {/* Connectors first, so the nodes sit on top of them. */}
          <svg
            width={width}
            height={height}
            className="absolute inset-0"
            aria-hidden
            style={{ overflow: "visible" }}
          >
            {app.reviews.map((r, i) => {
              const y = rowMid(i);
              const color = app.dispatched ? laneColor(r) : "var(--border-strong)";
              const cleared = r.state === "approved" || r.state === "deemed_approved";
              return (
                <g key={r.dept_id}>
                  <path
                    d={`M ${START_W} ${midY} C ${START_W + 40} ${midY}, ${NODE_X - 40} ${y}, ${NODE_X} ${y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={r.state === "rejected" ? 2.4 : 1.8}
                    strokeDasharray={r.state === "in_review" || r.state === "queued" ? "5 4" : undefined}
                  />
                  <path
                    d={`M ${NODE_X + NODE_W} ${y} C ${NODE_X + NODE_W + 40} ${y}, ${GATE_X - 40} ${midY}, ${GATE_X} ${midY}`}
                    fill="none"
                    stroke={cleared ? color : r.state === "rejected" ? "var(--critical)" : "var(--border-strong)"}
                    strokeWidth={r.state === "rejected" ? 2.4 : 1.8}
                    strokeDasharray={cleared ? undefined : "5 4"}
                  />
                </g>
              );
            })}
            {app.tie_breaker_open ? (
              <path
                d={`M ${GATE_X + GATE_W} ${midY} L ${TIE_X} ${midY}`}
                fill="none"
                stroke="var(--state-deemed)"
                strokeWidth={2.2}
                strokeDasharray="6 4"
              />
            ) : null}
          </svg>

          {/* Dispatch node. */}
          <div
            className="absolute flex flex-col justify-center rounded border border-line bg-surface px-2.5 py-2"
            style={{ left: 0, top: midY - NODE_H / 2, width: START_W, height: NODE_H }}
          >
            <Label className="mb-0.5 block">Dispatch</Label>
            <div className="text-[12px] font-medium leading-tight text-ink">
              {app.dispatched ? "Pushed to all" : "Not yet sent"}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-faint">
              {app.dispatched ? `${n} desks · day 0` : `${n} desks queued`}
            </div>
          </div>

          {/* One lane per department. */}
          {app.reviews.map((r, i) => (
            <div
              key={r.dept_id}
              className="absolute"
              style={{ left: NODE_X, top: rowY(i), width: NODE_W, height: NODE_H }}
            >
              <DeptNode review={r} day={app.day} />
              {r.escalated_on_day !== null ? (
                <span className="absolute -bottom-2 right-2 flex items-center gap-1 rounded-sm border border-state-deemed/50 bg-state-deemed/[0.12] px-1.5 py-px font-mono text-[9px] font-medium tracking-[0.05em] text-state-deemed-ink">
                  <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2} />
                  ESCALATED d{r.escalated_on_day}
                </span>
              ) : null}
            </div>
          ))}

          {/* The gate the phase has to pass. */}
          <div
            className="absolute flex flex-col justify-center rounded border bg-surface px-2.5 py-2"
            style={{
              left: GATE_X,
              top: midY - NODE_H / 2,
              width: GATE_W,
              height: NODE_H,
              borderColor: gateTone,
            }}
          >
            <Label className="mb-0.5 block">Phase gate</Label>
            <div
              className={cn(
                "text-[12px] font-medium leading-tight",
                derived.conflict ? "text-critical" : "text-ink",
              )}
            >
              {derived.conflict
                ? "Blocked"
                : derived.verdict === "cleared" || derived.verdict === "settled"
                  ? "Open"
                  : "Waiting"}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-faint">
              {derived.approved.length + derived.deemed.length}/{n} cleared
            </div>
          </div>

          {/* Scenario B adds a temporary node at the end of the track. */}
          {app.tie_breaker_open ? (
            <div
              className="anim-node absolute flex flex-col justify-center rounded border border-dashed border-state-deemed bg-state-deemed/[0.07] px-3 py-2"
              style={{ left: TIE_X, top: midY - NODE_H / 2, width: TIE_W, height: NODE_H }}
            >
              <span className="mb-0.5 flex items-center gap-1.5">
                <Gavel className="h-3 w-3 text-state-deemed-ink" strokeWidth={1.7} />
                <Label className="text-state-deemed-ink">Tie-breaker</Label>
              </span>
              <div className="text-[12px] font-medium leading-tight text-ink">
                {app.rule.tie_breaker?.panel ?? "Steering committee"}
              </div>
              <div className="mt-0.5 truncate font-mono text-[10px] text-state-deemed-ink">
                {app.rule.tie_breaker?.sla_days ?? 7} d window · temporary node
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
