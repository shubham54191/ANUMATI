"use client";
import { useEffect } from "react";
import { Scale } from "lucide-react";
import type { Grievance } from "@/types/compliance";
import { useGrievanceStore } from "@/store/useGrievanceStore";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const STATUS_META: Record<Grievance["status"], { label: string; text: string; border: string }> = {
  open: { label: "OPEN", text: "text-critical", border: "border-critical/45" },
  acknowledged: { label: "ACKNOWLEDGED", text: "text-state-deemed-ink", border: "border-state-deemed/45" },
  resolved: { label: "RESOLVED", text: "text-state-done-ink", border: "border-state-done/45" },
};

/**
 * What arrives when an applicant runs out of other options.
 *
 * The Committee may call for the department's reasons and inquire into the
 * delay (s. 8). It cannot grant the clearance itself on different terms — the
 * application is still disposed of under the relevant law.
 */
export function GrievanceQueue() {
  const hydrate = useGrievanceStore((s) => s.hydrate);
  const filed = useGrievanceStore((s) => s.filed);
  const setStatus = useGrievanceStore((s) => s.setStatus);
  useEffect(() => hydrate(), [hydrate]);

  const all = useGrievanceStore.getState().all();
  const open = all.filter((g) => g.status === "open").length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-2 border-b border-line px-4 py-2.5">
        <Scale className="h-3.5 w-3.5 text-accent" strokeWidth={1.6} />
        <Label>Grievances</Label>
        <div className="flex-1" />
        <span
          className={cn(
            "font-mono text-[10.5px]",
            open > 0 ? "font-medium text-critical" : "text-faint",
          )}
        >
          {open} open · {all.length} total
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {all.length === 0 ? (
          <p className="text-[12px] leading-relaxed text-muted">
            Nothing on the queue. An applicant raises one from the pre-check screen when a file has
            gone past its limit with no written query.
          </p>
        ) : null}

        <div className="flex flex-col gap-2.5">
          {all.map((g) => {
            const meta = STATUS_META[g.status];
            const mine = filed.some((f) => f.id === g.id);
            return (
              <div key={g.id} className={cn("rounded border bg-surface px-3 py-2.5", meta.border)}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10.5px] font-semibold text-ink">
                    {g.id} · {g.approval_id} · {g.department_short}
                  </span>
                  <span className={cn("font-mono text-[9.5px] font-medium tracking-[0.06em]", meta.text)}>
                    {meta.label}
                  </span>
                </div>
                <div className="mt-0.5 text-[12px] font-medium text-ink">{g.approval_name}</div>
                <p className="mt-1 text-[11.5px] leading-snug text-ink">{g.reason}</p>
                <p className="mt-1 font-mono text-[10px] text-faint">
                  {g.applicant} · raised {g.raised_on} · {g.days_pending} d pending
                  {mine ? " · RAISED IN THIS SESSION" : ""}
                </p>
                <p className="mt-1 font-mono text-[10px] leading-snug text-muted">{g.authority}</p>

                {mine && g.status !== "resolved" ? (
                  <div className="mt-2 flex gap-2">
                    {g.status === "open" ? (
                      <Button onClick={() => setStatus(g.id, "acknowledged")} className="h-6 px-2 text-[11px]">
                        Acknowledge
                      </Button>
                    ) : null}
                    <Button onClick={() => setStatus(g.id, "resolved")} className="h-6 px-2 text-[11px]">
                      Mark resolved
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
