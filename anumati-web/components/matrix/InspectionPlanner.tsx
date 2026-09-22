"use client";
import { useMemo } from "react";
import { CalendarCheck, MapPin } from "lucide-react";
import type { ApplicationFile } from "@/types/matrix";
import { buildRoadmap, DEFAULT_REQUEST } from "@/lib/data/engine";
import { inspectionSummary, planJointVisits } from "@/lib/compliance/inspections";
import { Label } from "@/components/ui/Card";

/**
 * The officer's half of "one site, one visit".
 *
 * The reason joint inspection rarely happens is not unwillingness — it is that
 * no single desk knows when every department will be ready to travel. The
 * dependency graph does: an approval's window opens on the day the site is
 * ready for that department. Grouping those days is the whole coordination the
 * Act asked for in s. 16.
 */
export function InspectionPlanner({ app }: { app: ApplicationFile }) {
  const { visits, summary } = useMemo(() => {
    const roadmap = buildRoadmap(DEFAULT_REQUEST);
    const v = planJointVisits(roadmap, 7);
    return { visits: v, summary: inspectionSummary(v) };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-2 border-b border-line px-4 py-2.5">
        <CalendarCheck className="h-3.5 w-3.5 text-accent" strokeWidth={1.6} />
        <Label>Joint inspections</Label>
        <div className="flex-1" />
        <span className="font-num font-mono text-[10.5px] text-faint">
          {summary.inspections} → {summary.joint_visits} visits
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-3 rounded border border-state-done/40 bg-state-done/[0.04] px-3 py-2.5">
          <div className="font-num font-serif text-[22px] font-medium text-state-done-ink">
            {summary.visits_saved} trips avoided
          </div>
          <p className="mt-0.5 text-[11.5px] leading-snug text-muted">
            {summary.inspections} separate inspections at {app.location} grouped into{" "}
            {summary.joint_visits} visits, by the day the site becomes ready for each department.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {visits.map((v) => (
            <div key={v.id} className="rounded border border-line bg-surface px-3 py-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 flex-none text-muted" strokeWidth={1.6} />
                <span className="font-num font-mono text-[11px] font-semibold text-ink">
                  {v.from_day === v.to_day ? `day ${v.from_day}` : `days ${v.from_day}–${v.to_day}`}
                </span>
                <div className="flex-1" />
                <span className="font-mono text-[9.5px] tracking-[0.06em] text-accent">
                  {v.departments.length} DEPT{v.departments.length === 1 ? "" : "S"}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {v.departments.map((d) => (
                  <span
                    key={d}
                    className="rounded-sm border border-line bg-bg px-1.5 py-px font-mono text-[10px] text-ink"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {v.needs.map((n) => (
                  <li key={n.approval_id} className="text-[11.5px] leading-snug text-muted">
                    <span className="font-mono text-[10.5px] text-faint">{n.approval_id}</span> {n.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
          Inspections are to be conducted jointly as far as practicable, and may be selected at
          random — MAITRI Act, 2023, s. 16. The grouping window is a district setting; seven days
          here.
        </p>
      </div>
    </div>
  );
}
