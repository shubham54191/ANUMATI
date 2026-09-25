"use client";
import { ArrowUpRight, CheckCircle2, CircleDot, FileText, Gavel, ShieldAlert, TriangleAlert, XCircle } from "lucide-react";
import type { ApplicationFile, DeptReview, DerivedMatrixState, ReviewState } from "@/types/matrix";
import { REVIEW_META, slaFraction, slaLabel } from "@/lib/matrix/display";
import { cn } from "@/lib/utils";

/**
 * The visual pipeline. One track goes in, splits into a lane per department,
 * and comes back together at a gate. When two lanes end in opposite colours the
 * split is the whole story — you can see the roadblock without reading a word.
 *
 * The connectors draw themselves in once, left to right, so the eye follows
 * dispatch → desks → gate in the order the file actually travels. Lanes still
 * sitting with a desk keep their dashes crawling; that is the only loop on the
 * screen, and it means "this clock is running".
 */

const START_W = 150;
const NODE_X = 258;
const NODE_W = 300;
const NODE_H = 74;
const PITCH = 96;
const GATE_X = 636;
const GATE_W = 152;
const TIE_X = 828;
const TIE_W = 200;

const STATE_ICON: Record<ReviewState, typeof FileText> = {
  queued: FileText,
  in_review: CircleDot,
  approved: CheckCircle2,
  rejected: XCircle,
  deemed_approved: TriangleAlert,
  transferred_to_committee: ArrowUpRight,
};

function laneColor(review: DeptReview): string {
  return `var(${REVIEW_META[review.state].colorVar})`;
}

function DeptNode({ review, day, delay }: { review: DeptReview; day: number; delay: number }) {
  const meta = REVIEW_META[review.state];
  const Icon = STATE_ICON[review.state];
  const fraction = slaFraction(review, day);
  const overdue = review.decided_on_day === null && review.sla_days - day < 0;

  return (
    <div
      className={cn(
        "db-pop db-lift relative flex h-full w-full items-start gap-2.5 overflow-hidden rounded-xl border bg-surface px-3 py-2.5",
        meta.border,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className={cn("flex h-6 w-6 flex-none items-center justify-center rounded-full", meta.tile)}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold tracking-[0.03em] text-db-ink">
              {review.dept_short}
            </span>
            {review.veto ? (
              <ShieldAlert
                className="h-3 w-3 text-db-amber"
                strokeWidth={2}
                aria-label="Holds veto power on this file"
              />
            ) : null}
          </span>
          <span
            className={cn(
              "flex flex-none items-center gap-1 rounded-full px-2 py-[2px] text-[9.5px] font-bold tracking-[0.05em]",
              meta.bg,
              meta.text,
            )}
          >
            {review.state === "approved" ? <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.4} /> : null}
            {review.state === "rejected" ? <XCircle className="h-2.5 w-2.5" strokeWidth={2.4} /> : null}
            {meta.label}
          </span>
        </div>

        <div className="truncate text-[11.5px] leading-tight text-db-ink">
          <span className="font-mono text-[10px] text-db-faint">{review.approval_id}</span>{" "}
          {review.approval_name}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10.5px] text-db-muted">{review.officer_name}</span>
          <span
            className={cn(
              "font-num flex-none text-[10px]",
              overdue ? "font-semibold text-db-amber" : "text-db-faint",
            )}
          >
            {slaLabel(review, day)} · {review.sla_days} d
          </span>
        </div>
      </div>

      {/* A hairline of the window used, along the bottom edge. Two pixels of
          information rather than a bar competing with the card. */}
      <span
        className="absolute bottom-0 left-0 h-[2px] transition-[width] duration-500"
        style={{
          width: `${fraction * 100}%`,
          background: overdue ? "var(--db-amber)" : laneColor(review),
        }}
      />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
      <span className="text-[11.5px] text-db-muted">{label}</span>
    </span>
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
  const width = app.tie_breaker_open ? TIE_X + TIE_W : GATE_X + GATE_W + 16;
  const midY = height / 2;
  const rowY = (i: number) => i * PITCH;
  const rowMid = (i: number) => rowY(i) + NODE_H / 2;

  const blocked = derived.conflict;
  const cleared = derived.verdict === "cleared" || derived.verdict === "settled";
  const gateTone = blocked ? "var(--db-red)" : cleared ? "var(--db-green)" : "var(--db-line)";

  return (
    <section className="db-rise rounded-xl border border-db-line bg-surface px-5 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-bold tracking-[0.02em] text-db-ink">REVIEW FLOW</h2>
          <p className="mt-0.5 text-[12.5px] text-db-muted">
            How the departments evaluated the file and where the conflict occurred.
          </p>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-4 pt-1">
          <LegendDot color="var(--db-green)" label="Approved" />
          <LegendDot color="var(--db-red)" label="Rejected" />
          <LegendDot color="var(--db-blue)" label="Processing" />
          <LegendDot color="var(--db-faint)" label="Open" />
        </div>
      </div>

      <div className="mt-3.5 overflow-x-auto rounded-xl bg-db-bg/70 px-4 py-4">
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
              const color = app.dispatched ? laneColor(r) : "var(--db-line)";
              const settled = r.state === "approved" || r.state === "deemed_approved";
              const open = r.state === "in_review" || r.state === "queued";
              const rejected = r.state === "rejected";
              return (
                <g key={r.dept_id}>
                  <path
                    d={`M ${START_W} ${midY} C ${START_W + 52} ${midY}, ${NODE_X - 52} ${y}, ${NODE_X} ${y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={rejected ? 2.6 : 2}
                    strokeLinecap="round"
                    className={open ? "db-edge-open" : "db-edge"}
                    style={
                      open
                        ? undefined
                        : ({ "--draw-len": 300, animationDelay: `${140 + i * 90}ms` } as React.CSSProperties)
                    }
                  />
                  <path
                    d={`M ${NODE_X + NODE_W} ${y} C ${NODE_X + NODE_W + 52} ${y}, ${GATE_X - 52} ${midY}, ${GATE_X} ${midY}`}
                    fill="none"
                    stroke={settled ? color : rejected ? "var(--db-red)" : "var(--db-line)"}
                    strokeWidth={rejected ? 2.6 : 2}
                    strokeLinecap="round"
                    strokeDasharray={settled ? undefined : "6 5"}
                    className={settled ? "db-edge" : undefined}
                    style={
                      settled
                        ? ({ "--draw-len": 300, animationDelay: `${420 + i * 90}ms` } as React.CSSProperties)
                        : undefined
                    }
                  />
                </g>
              );
            })}
            {app.tie_breaker_open ? (
              <path
                d={`M ${GATE_X + GATE_W} ${midY} L ${TIE_X} ${midY}`}
                fill="none"
                stroke="var(--db-amber)"
                strokeWidth={2.4}
                strokeDasharray="6 5"
                className="db-edge-open"
              />
            ) : null}
          </svg>

          {/* Dispatch node. */}
          <div
            className="db-pop absolute flex flex-col justify-center rounded-xl border border-db-line bg-surface px-3 py-2.5"
            style={{ left: 0, top: midY - NODE_H / 2, width: START_W, height: NODE_H }}
          >
            <span className="mb-1 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-db-blue-tint">
                <FileText className="h-3 w-3 text-db-blue" strokeWidth={2} />
              </span>
              <span className="text-[10px] font-bold tracking-[0.08em] text-db-muted">DISPATCH</span>
            </span>
            <div className="text-[12.5px] font-semibold leading-tight text-db-ink">
              {app.dispatched ? "Pushed to all" : "Not yet sent"}
            </div>
            <div className="mt-0.5 text-[10.5px] text-db-faint">
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
              <DeptNode review={r} day={app.day} delay={180 + i * 90} />
              {r.escalated_on_day !== null ? (
                <span className="absolute -bottom-2 right-2 flex items-center gap-1 rounded-full bg-db-amber-tint px-2 py-px text-[9px] font-bold tracking-[0.05em] text-db-amber">
                  <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2.4} />
                  ESCALATED d{r.escalated_on_day}
                </span>
              ) : null}
            </div>
          ))}

          {/* The gate the phase has to pass. */}
          <div
            className={cn(
              "db-pop absolute flex flex-col justify-center rounded-xl border px-3 py-2.5",
              blocked ? "bg-db-red-tint" : cleared ? "bg-db-green-tint" : "bg-surface",
            )}
            style={{
              left: GATE_X,
              top: midY - NODE_H / 2,
              width: GATE_W,
              height: NODE_H,
              borderColor: gateTone,
              animationDelay: "560ms",
            }}
          >
            <span className="mb-1 flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full",
                  blocked ? "bg-db-red text-white" : cleared ? "bg-db-green text-white" : "bg-db-bg text-db-faint",
                )}
              >
                {blocked ? (
                  <TriangleAlert className="h-3 w-3" strokeWidth={2.2} />
                ) : (
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.2} />
                )}
              </span>
              <span className="text-[10px] font-bold tracking-[0.08em] text-db-muted">PHASE GATE</span>
            </span>
            <div
              className={cn(
                "text-[13px] font-semibold leading-tight",
                blocked ? "text-db-red" : cleared ? "text-db-green" : "text-db-ink",
              )}
            >
              {blocked ? "Blocked" : cleared ? "Open" : "Waiting"}
            </div>
            <div className="font-num mt-0.5 text-[10.5px] text-db-muted">
              {derived.approved.length + derived.deemed.length}/{n} cleared
            </div>
          </div>

          {/* Scenario B adds a temporary node at the end of the track. */}
          {app.tie_breaker_open ? (
            <div
              className="db-pop absolute flex flex-col justify-center rounded-xl border border-dashed border-db-amber bg-db-amber-tint px-3 py-2.5"
              style={{ left: TIE_X, top: midY - NODE_H / 2, width: TIE_W, height: NODE_H }}
            >
              <span className="mb-1 flex items-center gap-1.5">
                <Gavel className="h-3.5 w-3.5 text-db-amber" strokeWidth={2} />
                <span className="text-[10px] font-bold tracking-[0.08em] text-db-amber">TIE-BREAKER</span>
              </span>
              <div className="truncate text-[12.5px] font-semibold leading-tight text-db-ink">
                {app.rule.tie_breaker?.panel ?? "Steering committee"}
              </div>
              <div className="mt-0.5 truncate text-[10.5px] text-db-amber">
                {app.rule.tie_breaker?.sla_days ?? 7} d window · temporary node
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
