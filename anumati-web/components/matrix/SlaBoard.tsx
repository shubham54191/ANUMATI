"use client";
import { ArrowUpRight, Clock, Timer } from "lucide-react";
import type { ApplicationFile } from "@/types/matrix";
import { REVIEW_META, slaLabel } from "@/lib/matrix/display";
import { isOpen } from "@/lib/matrix/engine";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * The escalation matrix, made visible.
 *
 * Two rules run against every open lane. A statutory clearance that misses its
 * window cannot be waved through, so the file is lifted a tier and the delay
 * becomes someone senior's problem. A non-critical one that misses its window
 * with no reason recorded is deemed approved, and the phase moves on.
 */
export function SlaBoard({ app }: { app: ApplicationFile }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-2 border-b border-line px-4 py-2.5">
        <Timer className="h-3.5 w-3.5 text-accent" strokeWidth={1.6} />
        <Label>SLA and escalation</Label>
        <div className="flex-1" />
        <span className="font-num font-mono text-[10.5px] text-faint">day {app.day}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-2.5">
          {app.reviews.map((r) => {
            const meta = REVIEW_META[r.state];
            const left = r.sla_days - app.day;
            const open = isOpen(r);
            const overdue = open && left < 0;
            const warning = open && left >= 0 && left <= 2;

            return (
              <div
                key={r.dept_id}
                className={cn(
                  "rounded border px-3 py-2.5",
                  overdue
                    ? "border-state-deemed/50 bg-state-deemed/[0.06]"
                    : warning
                      ? "border-accent-secondary/40 bg-accent-secondary/[0.04]"
                      : "border-line bg-surface",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold tracking-[0.05em] text-ink">
                    {r.dept_short}
                  </span>
                  <span className={cn("font-mono text-[9.5px] font-medium tracking-[0.06em]", meta.text)}>
                    {meta.label}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 flex-none text-faint" strokeWidth={1.6} />
                  <span
                    className={cn(
                      "font-num font-mono text-[11px]",
                      overdue ? "font-medium text-state-deemed-ink" : "text-muted",
                    )}
                  >
                    {slaLabel(r, app.day)}
                  </span>
                </div>

                {open ? (
                <p className="mt-1.5 text-[11.5px] leading-snug text-muted">
                  {r.statutory ? (
                    <>
                      Statutory — cannot be deemed. On breach the file goes to{" "}
                      <span className="text-ink">{r.escalation_tier}</span>.
                    </>
                  ) : (
                    <>
                      Non-critical — deemed approved on breach if no reason is recorded, under the
                      Right to Public Services Act.
                    </>
                  )}
                </p>
                ) : null}

                {r.escalated_on_day !== null ? (
                  <div className="mt-2 flex items-center gap-1.5 rounded-sm border border-state-deemed/45 bg-state-deemed/[0.1] px-2 py-1">
                    <ArrowUpRight className="h-3 w-3 flex-none text-state-deemed-ink" strokeWidth={1.8} />
                    <span className="font-mono text-[10px] font-medium tracking-[0.05em] text-state-deemed-ink">
                      ESCALATED ON DAY {r.escalated_on_day} → {r.escalation_tier.toUpperCase()}
                    </span>
                  </div>
                ) : null}

                {r.state === "deemed_approved" ? (
                  <div className="mt-2 rounded-sm border border-state-deemed/45 bg-state-deemed/[0.1] px-2 py-1 text-[11px] leading-snug text-state-deemed-ink">
                    Deemed approved on day {r.decided_on_day} — the window closed with no action and no
                    recorded reason.
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded border border-line bg-sunk px-3 py-2.5">
          <Label className="mb-1 block">How the ladder works</Label>
          <ol className="flex flex-col gap-1 text-[11.5px] leading-relaxed text-muted">
            <li>1. Two days out, the desk and its supervisor are warned.</li>
            <li>2. On breach, a statutory desk is escalated a tier and the file is flagged.</li>
            <li>3. On breach, a non-critical desk is deemed approved and the phase advances.</li>
            <li>4. Every step is written to the audit trail with the provision it was taken under.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
