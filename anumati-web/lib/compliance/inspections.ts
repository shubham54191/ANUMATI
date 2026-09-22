import type { Roadmap } from "@/types/roadmap";
import type { InspectionNeed, JointVisit } from "@/types/compliance";

/**
 * One site, one visit.
 *
 * The MAITRI Act, 2023 asks for inspections to be conducted jointly as far as
 * practicable (s. 16). "As far as practicable" is doing a lot of work in that
 * sentence, and the reason it rarely happens is not unwillingness — it is that
 * no single desk knows when every department will be ready to visit.
 *
 * The dependency graph does know. An approval's earliest start is the day the
 * site is ready for that department, so grouping those days into windows is
 * all the coordination the Act was asking for.
 */

/**
 * Clearances that involve someone physically visiting the site. In a
 * deployment this is a field on the rule base; here it is a list, because
 * inventing a field on thirty-four rows we cannot verify would be worse.
 */
const SITE_VISIT = new Set([
  "A10", // building plan — site and setbacks
  "A13", // fire NOC, provisional
  "A15", // consent to establish
  "A16", // factory plan
  "A18", // boiler registration
  "A20", // consent to operate
  "A21", // factory licence
  "A22", // electrical inspector
  "A23", // fire NOC, final
  "A24", // FSSAI licence
  "A25", // occupancy certificate
  "A30", // weights and measures
]);

export function inspectionNeeds(roadmap: Roadmap): InspectionNeed[] {
  return roadmap.approvals
    .filter((a) => SITE_VISIT.has(a.id))
    .map((a) => ({
      approval_id: a.id,
      name: a.name,
      department_short: a.department_short,
      // The day the site is ready for this department: when its own window opens.
      ready_day: (roadmap.earliest_finish[a.id] ?? a.statutory_days) - a.statutory_days,
    }))
    .sort((x, y) => x.ready_day - y.ready_day || x.approval_id.localeCompare(y.approval_id));
}

/**
 * Group needs into visit windows. Two departments that become ready within
 * `windowDays` of each other can see the site on the same trip.
 */
export function planJointVisits(roadmap: Roadmap, windowDays = 7): JointVisit[] {
  const needs = inspectionNeeds(roadmap);
  const visits: JointVisit[] = [];

  for (const need of needs) {
    const open = visits[visits.length - 1];
    if (open && need.ready_day - open.from_day <= windowDays) {
      open.needs.push(need);
      open.to_day = Math.max(open.to_day, need.ready_day);
      continue;
    }
    visits.push({
      id: `JV-${visits.length + 1}`,
      from_day: need.ready_day,
      to_day: need.ready_day,
      needs: [need],
      departments: [],
      visits_saved: 0,
    });
  }

  for (const v of visits) {
    v.departments = Array.from(new Set(v.needs.map((n) => n.department_short)));
    // A department that has to come twice in one window still only travels
    // once, so the saving counts departments, not approvals.
    v.visits_saved = Math.max(0, v.needs.length - v.departments.length) + 0;
  }
  return visits;
}

export function inspectionSummary(visits: JointVisit[]) {
  const needs = visits.reduce((n, v) => n + v.needs.length, 0);
  const separate = needs;
  const merged = visits.length;
  return {
    inspections: needs,
    separate_visits: separate,
    joint_visits: merged,
    visits_saved: Math.max(0, separate - merged),
  };
}
