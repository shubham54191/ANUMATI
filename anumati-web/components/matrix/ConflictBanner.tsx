"use client";
import { AlertTriangle, Scale } from "lucide-react";
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

  const tie = app.tie_breaker_open;
  const at = derived.rejected[0]?.decided_at;
  const rejecters = derived.rejected.map((r) => r.dept_short).join(", ");
  const approvers = [...derived.approved, ...derived.deemed].map((r) => r.dept_short).join(", ");
  const Icon = tie ? Scale : AlertTriangle;

  return (
    <div
      role="alert"
      className={cn(
        "db-drop flex items-start gap-3 rounded-xl border px-4 py-3.5",
        tie ? "border-db-amber-line bg-db-amber-tint" : "border-db-red-line bg-db-red-tint",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 flex-none items-center justify-center rounded-full",
          tie ? "bg-db-amber text-white" : "bg-db-red text-white",
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className={cn("text-[14px] font-semibold leading-tight", tie ? "text-db-amber" : "text-db-red")}>
          {tie
            ? "Escalated — awaiting tie-breaker panel"
            : "Conflict detected — technical rejection during parallel review phase"}
        </div>
        <div className="mt-1 text-[12.5px] leading-snug text-db-muted">
          {approvers || "—"} approved while {rejecters || "—"} rejected
          {derived.simultaneous && at ? (
            <>
              {" "}
              at the same instant — <span className="font-mono text-db-ink">{clockOf(at)}</span> on day{" "}
              {derived.rejected[0]?.decided_on_day}
            </>
          ) : (
            <> inside the same parallel phase</>
          )}
          . Resolution rule <span className="font-mono text-db-ink">{app.rule.id}</span> —{" "}
          {app.rule.label}.
        </div>
      </div>
    </div>
  );
}
