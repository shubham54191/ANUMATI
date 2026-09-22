"use client";
import { CalendarCheck, MapPin } from "lucide-react";
import type { Roadmap } from "@/types/roadmap";
import { inspectionSummary, planJointVisits } from "@/lib/compliance/inspections";
import { Label } from "@/components/ui/Card";

/**
 * One site, one visit — from the applicant's side.
 *
 * The same plan the officer console schedules, read back to the person who
 * has to stop work and walk an inspector round the building.
 */
export function InspectionSummary({ roadmap }: { roadmap: Roadmap }) {
  const visits = planJointVisits(roadmap, 7);
  const s = inspectionSummary(visits);

  return (
    <section className="rounded border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <CalendarCheck className="h-3.5 w-3.5 text-accent" strokeWidth={1.6} />
        <Label>Site inspections</Label>
        <div className="flex-1" />
        <span className="font-num font-mono text-[11.5px] text-muted">
          <span className="font-semibold text-ink">{s.inspections}</span> inspections ·{" "}
          <span className="font-semibold text-state-done-ink">{s.joint_visits}</span> visits ·{" "}
          {s.visits_saved} trips avoided
        </span>
      </div>

      <div className="flex flex-col gap-2 px-4 py-3">
        {visits.map((v) => (
          <div key={v.id} className="flex items-start gap-3 rounded border border-line bg-bg px-3 py-2">
            <MapPin className="mt-0.5 h-3 w-3 flex-none text-muted" strokeWidth={1.6} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-num font-mono text-[11px] font-semibold text-ink">
                  {v.from_day === v.to_day ? `day ${v.from_day}` : `days ${v.from_day}–${v.to_day}`}
                </span>
                <span className="font-mono text-[10.5px] tracking-[0.05em] text-accent">
                  {v.departments.join(" + ")}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-snug text-muted">
                {v.needs.map((n) => `${n.approval_id} ${n.name}`).join(" · ")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="border-t border-line px-4 py-2.5 text-[11.5px] leading-relaxed text-muted">
        Grouped by the day the site becomes ready for each department, which the dependency graph
        already knows. Inspections are to be conducted jointly as far as practicable — MAITRI Act,
        2023, s. 16.
      </p>
    </section>
  );
}
