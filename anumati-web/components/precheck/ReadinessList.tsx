"use client";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, FileWarning, Info } from "lucide-react";
import type { Roadmap } from "@/types/roadmap";
import type { ApprovalReadiness, Gap } from "@/types/compliance";
import { prevalidate, prevalidationSummary } from "@/lib/compliance/prevalidate";
import { SEED_DOSSIER } from "@/lib/data/dossier";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { GrievanceDialog } from "./GrievanceDialog";
import { cn } from "@/lib/utils";

const GAP_META: Record<Gap["kind"], { label: string; Icon: typeof Info }> = {
  missing_document: { label: "DOCUMENT MISSING", Icon: FileWarning },
  prerequisite_pending: { label: "PRIOR ORDER PENDING", Icon: Info },
  field_mismatch: { label: "FORMS DISAGREE", Icon: AlertTriangle },
};

/**
 * The check that happens before filing, not three weeks after.
 *
 * Every gap on this screen is one an officer would otherwise have found at the
 * counter — a missing annexure, an order that does not exist yet, or the same
 * measurement written two different ways on two departments' forms. None of it
 * requires asking a department anything, which is exactly why it can be done
 * in advance and for nothing.
 */
export function ReadinessList({ roadmap }: { roadmap: Roadmap }) {
  const rows = prevalidate(roadmap, SEED_DOSSIER);
  const summary = prevalidationSummary(rows);
  const [openId, setOpenId] = useState<string | null>(
    rows.find((r) => !r.ready)?.approval_id ?? null,
  );
  const [grievance, setGrievance] = useState<ApprovalReadiness | null>(null);

  return (
    <section className="rounded border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <Label>Pre-submission check</Label>
        <span className="text-[12px] text-muted">
          Run against the dossier you hold today. Nothing is sent to a department.
        </span>
        <div className="flex-1" />
        <span className="font-num font-mono text-[11.5px]">
          <span className="font-semibold text-critical">{summary.blocked}</span>
          <span className="text-muted"> of {summary.total} would be turned away</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-4 py-3 sm:grid-cols-4">
        {[
          ["Ready to file", summary.ready, "text-state-done-ink"],
          ["Would be refused", summary.blocked, "text-critical"],
          ["Blocking gaps", summary.blocking_gaps, "text-critical"],
          ["Advisory notes", summary.advisory_gaps, "text-muted"],
        ].map(([label, value, tone]) => (
          <div key={label as string} className="rounded border border-line bg-bg px-3 py-2">
            <Label className="mb-0.5 block">{label as string}</Label>
            <span className={cn("font-num font-serif text-[22px] font-medium", tone as string)}>
              {value as number}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        {rows.map((r) => {
          const open = openId === r.approval_id;
          return (
            <div key={r.approval_id} className="border-b border-line last:border-b-0">
              <button
                onClick={() => setOpenId(open ? null : r.approval_id)}
                aria-expanded={open}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-sunk",
                  !r.ready && "shadow-[inset_3px_0_0_var(--critical)]",
                )}
              >
                {r.gaps.length > 0 ? (
                  open ? (
                    <ChevronDown className="h-3 w-3 flex-none text-muted" strokeWidth={1.6} />
                  ) : (
                    <ChevronRight className="h-3 w-3 flex-none text-muted" strokeWidth={1.6} />
                  )
                ) : (
                  <CheckCircle2 className="h-3 w-3 flex-none text-state-done-ink" strokeWidth={1.7} />
                )}

                <span className="font-mono text-[11px] font-semibold text-ink">{r.approval_id}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{r.name}</span>
                <span className="hidden font-mono text-[10.5px] text-faint md:inline">
                  {r.department_short}
                </span>
                <span className="font-num font-mono text-[10.5px] text-faint">
                  filable d{r.filable_on_day}
                </span>
                <span
                  className={cn(
                    "w-[92px] flex-none text-right font-mono text-[10px] font-medium tracking-[0.05em]",
                    r.ready ? "text-state-done-ink" : "text-critical",
                  )}
                >
                  {r.ready ? "READY" : `${r.gaps.filter((g) => g.blocking).length} BLOCKING`}
                </span>
              </button>

              {open && r.gaps.length > 0 ? (
                <div className="flex flex-col gap-2 bg-bg px-4 pb-3 pt-1">
                  {r.gaps.map((g, i) => {
                    const meta = GAP_META[g.kind];
                    return (
                      <div
                        key={i}
                        className={cn(
                          "rounded border px-3 py-2",
                          g.blocking ? "border-critical/40 bg-critical/[0.04]" : "border-line bg-surface",
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <meta.Icon
                            className={cn("h-3 w-3", g.blocking ? "text-critical" : "text-muted")}
                            strokeWidth={1.7}
                          />
                          <span
                            className={cn(
                              "font-mono text-[9.5px] font-medium tracking-[0.06em]",
                              g.blocking ? "text-critical" : "text-muted",
                            )}
                          >
                            {meta.label}
                            {g.blocking ? "" : " · ADVISORY"}
                          </span>
                        </span>
                        <p className="mt-1 text-[12.5px] leading-snug text-ink">{g.detail}</p>
                        <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{g.remedy}</p>
                      </div>
                    );
                  })}

                  <div className="flex items-center gap-2 pt-0.5">
                    <Button onClick={() => setGrievance(r)} className="h-7 px-2.5">
                      Raise a grievance on {r.approval_id}
                    </Button>
                    <span className="text-[11px] text-muted">
                      Goes to the Empowered Committee, not back to the same desk.
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <GrievanceDialog readiness={grievance} onClose={() => setGrievance(null)} />
    </section>
  );
}
