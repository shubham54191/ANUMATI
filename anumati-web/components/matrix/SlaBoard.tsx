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
      <div className="flex flex-none items-center gap-2 border-b border-db-line px-4 py-2.5">
        <Timer className="h-3.5 w-3.5 text-db-blue" strokeWidth={1.6} />
        <Label>SLA and escalation</Label>
        <div className="flex-1" />
        <span className="font-num font-mono text-[10.5px] text-db-faint">day {app.day}</span>
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
                  "rounded-xl border px-3 py-2.5",
                  overdue
                    ? "border-db-amber/50 bg-db-amber/[0.06]"
                    : warning
                      ? "border-db-blue-secondary/40 bg-accent-secondary/[0.04]"
                      : "border-db-line bg-surface",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold tracking-[0.05em] text-db-ink">
                    {r.dept_short}
                  </span>
                  <span className={cn("font-mono text-[9.5px] font-medium tracking-[0.06em]", meta.text)}>
                    {meta.label}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 flex-none text-db-faint" strokeWidth={1.6} />
                  <span
                    className={cn(
                      "font-num font-mono text-[11px]",
                      overdue ? "font-medium text-db-amber" : "text-db-muted",
                    )}
                  >
                    {slaLabel(r, app.day)}
                  </span>
                </div>

                {open ? (
                  <p className="mt-1.5 text-[11.5px] leading-snug text-db-muted">
                    {r.deemed_exists ? (
                      <>
                        Its own Act deems this granted after{" "}
                        <span className="font-medium text-db-ink">{r.deemed_days} days</span> —{" "}
                        <span className="font-mono text-[10.5px]">{r.deemed_reference}</span>.
                      </>
                    ) : (
                      <>
                        No deeming clause in the parent Act. On breach the file transfers to{" "}
                        <span className="font-medium text-db-ink">{r.escalation_tier}</span>, which decides it under
                        the same law.
                      </>
                    )}
                  </p>
                ) : null}

                {r.escalated_on_day !== null ? (
                  <div className="mt-2 flex items-start gap-1.5 rounded-sm border border-accent/45 bg-accent-muted px-2 py-1">
                    <ArrowUpRight className="mt-0.5 h-3 w-3 flex-none text-accent" strokeWidth={1.8} />
                    <span className="text-[10.5px] leading-snug text-accent">
                      <span className="font-mono font-medium tracking-[0.05em]">
                        TRANSFERRED ON DAY {r.escalated_on_day}
                      </span>{" "}
                      — {r.dept_short} ceased to have power over this application. MAITRI Act, 2023
                      s. 5(1) and s. 5(2).
                    </span>
                  </div>
                ) : null}

                {r.state === "deemed_approved" ? (
                  <div className="mt-2 rounded-sm border border-db-amber/45 bg-db-amber/[0.1] px-2 py-1 text-[11px] leading-snug text-db-amber">
                    Deemed granted on day {r.decided_on_day} under{" "}
                    <span className="font-mono text-[10.5px]">{r.deemed_reference}</span> — the Act&apos;s
                    own clause, not a service-delivery rule.
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-db-line bg-db-bg px-3 py-2.5">
          <Label className="mb-1 block">How the ladder works</Label>
          <ol className="flex flex-col gap-1 text-[11.5px] leading-relaxed text-db-muted">
            <li>1. Two days out, the desk and its supervisor are warned.</li>
            <li>
              2. Where the parent Act has its own deeming clause, silence deems the clearance granted
              on that Act&apos;s terms.
            </li>
            <li>
              3. Everywhere else the file transfers to the Empowered Committee and the department
              ceases to have power over it — MAITRI Act s. 5.
            </li>
            <li>
              4. The Committee still decides under the relevant law (s. 5(3)). Nothing is waved through.
            </li>
            <li>5. Every step is written to the audit trail with the provision it was taken under.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
