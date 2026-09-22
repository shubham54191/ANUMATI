"use client";
import { CalendarClock } from "lucide-react";
import type { RenewalAlert } from "@/types/compliance";
import { renewalBoard } from "@/lib/compliance/renewals";
import { SEED_RENEWALS } from "@/lib/data/renewals";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const ALERT_META: Record<RenewalAlert, { label: string; text: string; border: string }> = {
  none: { label: "IN DATE", text: "text-muted", border: "border-line" },
  "60": { label: "60 DAYS", text: "text-accent-secondary", border: "border-accent-secondary/40" },
  "30": { label: "30 DAYS", text: "text-state-deemed-ink", border: "border-state-deemed/45" },
  "7": { label: "7 DAYS", text: "text-critical", border: "border-critical/45" },
  expired: { label: "LAPSED", text: "text-critical", border: "border-critical" },
};

/**
 * A clearance is not a finish line.
 *
 * The day a licence expires the unit is operating unlawfully without anybody
 * having done anything wrong, which is the most avoidable failure on the whole
 * roadmap. Every validity period here comes from the parent rules.
 */
export function RenewalBoard({ today = new Date() }: { today?: Date }) {
  const board = renewalBoard(SEED_RENEWALS, today);
  const urgent = board.filter((b) => b.alert !== "none").length;

  return (
    <section className="rounded border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <CalendarClock className="h-3.5 w-3.5 text-accent" strokeWidth={1.6} />
        <Label>Renewal calendar</Label>
        <div className="flex-1" />
        <span className="font-num font-mono text-[11.5px] text-muted">
          <span className={cn("font-semibold", urgent > 0 ? "text-critical" : "text-ink")}>{urgent}</span>{" "}
          of {board.length} need attention
        </span>
      </div>

      <div className="flex flex-col">
        {board.map(({ renewal, days_left, window_open, alert }) => {
          const meta = ALERT_META[alert];
          return (
            <div
              key={renewal.approval_id}
              className={cn(
                "flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0",
                alert !== "none" && "shadow-[inset_3px_0_0_currentColor]",
                alert !== "none" ? meta.text : undefined,
              )}
            >
              <span className="font-mono text-[11px] font-semibold text-ink">{renewal.approval_id}</span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{renewal.name}</span>
              <span className="hidden font-mono text-[10.5px] text-faint md:inline">
                {renewal.department_short}
              </span>
              <span className="font-num font-mono text-[11px] text-muted">
                expires {renewal.valid_until}
              </span>
              <span className={cn("font-num w-[96px] flex-none text-right font-mono text-[11.5px] font-medium", meta.text)}>
                {days_left < 0 ? `${Math.abs(days_left)} d ago` : `${days_left} d left`}
              </span>
              <span
                className={cn(
                  "w-[86px] flex-none rounded-sm border px-1.5 py-px text-center font-mono text-[9.5px] font-medium tracking-[0.06em]",
                  meta.border,
                  meta.text,
                )}
              >
                {meta.label}
              </span>
              <span className="w-full text-[11px] leading-snug text-faint md:w-auto md:flex-1 md:basis-full">
                {window_open ? "Renewal window is open. " : ""}
                {renewal.source}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
