"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, FlaskConical, Users } from "lucide-react";
import type { ApprovalEvidence } from "@/types/report";
import { REPORT_KIND_LABEL } from "@/types/report";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * Where the second clock's number comes from.
 *
 * The median is shown with the rows it was computed from one click away,
 * because a planning figure nobody can trace is the same kind of claim this
 * project refuses to make about the law. Seeded pilot rows say so on their
 * face; a report filed in this session is marked as awaiting a verifier,
 * because counting towards a median and being published into the rule base
 * are two different things.
 */
export function EvidenceBlock({ evidence }: { evidence: ApprovalEvidence }) {
  const [open, setOpen] = useState(false);
  const { observed_days, sample, delta, reports, statutory_days } = evidence;
  const slower = (delta ?? 0) > 0;

  const complaints =
    evidence.extra_document + evidence.not_required + evidence.wrong_order;

  return (
    <div className="border-b border-line px-[18px] py-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5">
          <Users className="h-3 w-3" strokeWidth={1.6} />
          What applicants reported
        </Label>
        {evidence.seeded_only && reports.length > 0 ? (
          <span
            className="flex items-center gap-1 rounded-sm border border-accent-secondary/50 bg-accent-secondary/[0.08] px-1.5 py-px font-mono text-[9px] font-medium tracking-[0.06em] text-accent-secondary"
            title="Illustrative pilot data shipped with this build, not filed reports"
          >
            <FlaskConical className="h-2.5 w-2.5" strokeWidth={1.8} />
            SEEDED PILOT DATA
          </span>
        ) : null}
      </div>

      {sample === 0 ? (
        <p className="text-[12px] leading-relaxed text-muted">
          Nobody has reported a timing for this approval yet, so the roadmap plans with the statutory{" "}
          {statutory_days} days on both clocks. An absence of reports is not evidence that the
          department is quick.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-4">
            <div>
              <span
                className={cn(
                  "font-num font-serif text-[26px] font-medium leading-none",
                  slower ? "text-critical" : "text-state-done-ink",
                )}
              >
                {observed_days}
              </span>
              <span className="ml-1 text-[11.5px] text-muted">days, median</span>
            </div>
            <div className="pb-0.5">
              <div className="font-mono text-[11px] text-muted">
                statutory <span className="font-semibold text-ink">{statutory_days}</span>
              </div>
              <div
                className={cn(
                  "font-mono text-[11px] font-medium",
                  slower ? "text-critical" : "text-state-done-ink",
                )}
              >
                {slower ? "+" : ""}
                {delta} days · n={sample}
              </div>
            </div>
          </div>

          {complaints > 0 ? (
            <p className="mt-2 text-[11.5px] leading-snug text-muted">
              Also reported:{" "}
              {[
                evidence.extra_document > 0 && `${evidence.extra_document} × extra document`,
                evidence.wrong_order > 0 && `${evidence.wrong_order} × different order`,
                evidence.not_required > 0 && `${evidence.not_required} × not required at all`,
              ]
                .filter(Boolean)
                .join(" · ")}
              .
            </p>
          ) : null}
        </>
      )}

      {reports.length > 0 ? (
        <>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-2.5 flex items-center gap-1 text-[11.5px] text-link hover:underline"
          >
            {open ? (
              <ChevronDown className="h-3 w-3" strokeWidth={1.6} />
            ) : (
              <ChevronRight className="h-3 w-3" strokeWidth={1.6} />
            )}
            {open ? "Hide" : "Read"} the {reports.length} report
            {reports.length === 1 ? "" : "s"} behind this
          </button>

          {open ? (
            <div className="mt-2 flex flex-col gap-2">
              {reports.map((r) => (
                <div key={r.id} className="rounded border border-line bg-bg px-2.5 py-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-faint">
                      {r.id} · {r.district} · {r.reported_on}
                    </span>
                    {r.observed_days !== null ? (
                      <span className="font-num font-mono text-[10.5px] font-medium text-ink">
                        {r.observed_days} d
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11.5px] leading-snug text-ink">{r.detail}</p>
                  <p className="mt-1 font-mono text-[9.5px] tracking-[0.05em] text-faint">
                    {REPORT_KIND_LABEL[r.kind].toUpperCase()}
                    {r.origin === "filed" ? " · FILED HERE · AWAITING A VERIFIER" : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
