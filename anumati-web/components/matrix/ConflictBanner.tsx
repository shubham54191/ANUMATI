"use client";
import { AlertTriangle, ArrowDown } from "lucide-react";
import type { ApplicationFile, DerivedMatrixState } from "@/types/matrix";
import { clockOf } from "@/lib/matrix/engine";
import { cn } from "@/lib/utils";

/**
 * The system does not hide a clash. It drops a banner across the top of the
 * file for everyone who can see it, so nobody spends a week wondering why the
 * pipeline stopped moving.
 */
export function ConflictBanner({
  app,
  derived,
}: {
  app: ApplicationFile;
  derived: DerivedMatrixState;
}) {
  // Once the file is settled the outcome card carries the story; a standing
  // red banner over a decided file is just alarm fatigue.
  if (app.resolution) return null;
  if (!derived.conflict && !app.tie_breaker_open) return null;

  const at = derived.rejected[0]?.decided_at;
  const rejecters = derived.rejected.map((r) => r.dept_short).join(", ");
  const approvers = [...derived.approved, ...derived.deemed].map((r) => r.dept_short).join(", ");

  return (
    <div
      role="alert"
      className={cn(
        "anim-rise flex flex-none items-center gap-3 border-b px-5 py-2.5",
        app.tie_breaker_open
          ? "border-state-deemed/50 bg-state-deemed/[0.09]"
          : "border-critical/45 bg-critical/[0.07]",
      )}
    >
      <AlertTriangle
        className={cn("h-4 w-4 flex-none", app.tie_breaker_open ? "text-state-deemed-ink" : "text-critical")}
        strokeWidth={1.7}
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[13px] font-semibold leading-tight",
            app.tie_breaker_open ? "text-state-deemed-ink" : "text-critical",
          )}
        >
          {app.tie_breaker_open
            ? "Escalated: awaiting tie-breaker panel"
            : `Conflict detected — technical rejection during parallel review phase`}
        </div>
        <div className="mt-0.5 truncate text-[12px] text-ink">
          {approvers || "—"} approved while {rejecters || "—"} rejected
          {derived.simultaneous && at ? (
            <>
              {" "}
              at the same instant — <span className="font-mono">{clockOf(at)}</span> on day{" "}
              {derived.rejected[0]?.decided_on_day}
            </>
          ) : (
            <> inside the same parallel phase</>
          )}
          . Resolution rule <span className="font-mono">{app.rule.id}</span> — {app.rule.label}.
        </div>
      </div>
      <span className="hidden items-center gap-1.5 font-mono text-[10.5px] tracking-[0.06em] text-muted lg:flex">
        RESOLUTION BELOW
        <ArrowDown className="h-3 w-3" strokeWidth={1.6} />
      </span>
    </div>
  );
}
