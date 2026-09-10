import type { Roadmap } from "@/types/roadmap";

/**
 * Derived-only workflow status for the Workflow pane.
 *
 * This is NOT live data — there is no backend, no auth, no session, so there
 * is nothing to be "live" about. Everything here is computed from fields the
 * engine already produces (earliest_finish, statutory_days, critical_path)
 * plus a "simulated day" cursor the viewer drags, the same honest pattern
 * the graph's TimeCollapse animation and the conditional controls already
 * use. Query/resolve state is local session state the viewer sets by hand —
 * it is a demo of the RBAC write-gate, not a fabricated live applicant file.
 *
 * Nothing here is added to types/approval.ts — that type mirrors the
 * backend schema and this has no backend counterpart yet.
 */

export type TrackStatus = "locked" | "active" | "query" | "approved";

export interface TrackRow {
  approvalId: string;
  approvalName: string;
  departmentId: string;
  departmentName: string;
  departmentShort: string;
  stage: string;
  start: number;
  finish: number;
  statutoryDays: number;
  status: TrackStatus;
  daysUsed: number;
  slaPct: number;
  overrun: boolean;
  onCriticalPath: boolean;
}

export interface DepartmentGroup {
  departmentId: string;
  departmentName: string;
  departmentShort: string;
  earliestStart: number;
  rows: TrackRow[];
}

export function buildTrackRows(
  roadmap: Roadmap,
  simulatedDay: number,
  queried: Record<string, boolean>,
  resolved: Record<string, boolean>,
): TrackRow[] {
  const criticalSet = new Set(roadmap.critical_path);

  return roadmap.approvals.map((a) => {
    const finish = roadmap.earliest_finish[a.id] ?? a.statutory_days;
    const start = finish - a.statutory_days;

    let status: TrackStatus;
    if (simulatedDay < start) {
      status = "locked";
    } else if (queried[a.id] && !resolved[a.id]) {
      status = "query";
    } else if (simulatedDay >= finish) {
      status = "approved";
    } else {
      status = "active";
    }

    const daysUsed = Math.min(Math.max(simulatedDay - start, 0), a.statutory_days);
    const slaPct = a.statutory_days > 0 ? Math.min(1, daysUsed / a.statutory_days) : 1;
    const overrun = (status === "active" || status === "query") && simulatedDay > finish;

    return {
      approvalId: a.id,
      approvalName: a.name,
      departmentId: a.department_id,
      departmentName: a.department_name,
      departmentShort: a.department_short,
      stage: a.stage,
      start,
      finish,
      statutoryDays: a.statutory_days,
      status,
      daysUsed,
      slaPct,
      overrun,
      onCriticalPath: criticalSet.has(a.id),
    };
  });
}

export function groupByDepartment(rows: TrackRow[]): DepartmentGroup[] {
  const map = new Map<string, DepartmentGroup>();
  for (const row of rows) {
    const existing = map.get(row.departmentId);
    if (existing) {
      existing.rows.push(row);
      existing.earliestStart = Math.min(existing.earliestStart, row.start);
    } else {
      map.set(row.departmentId, {
        departmentId: row.departmentId,
        departmentName: row.departmentName,
        departmentShort: row.departmentShort,
        earliestStart: row.start,
        rows: [row],
      });
    }
  }
  const groups = Array.from(map.values());
  for (const g of groups) {
    g.rows.sort((a, b) => a.start - b.start || a.approvalId.localeCompare(b.approvalId));
  }
  groups.sort((a, b) => a.earliestStart - b.earliestStart || a.departmentName.localeCompare(b.departmentName));
  return groups;
}

export interface TrackEvent {
  day: number;
  approvalId: string;
  approvalName: string;
  departmentShort: string;
  kind: "started" | "approved" | "query_raised" | "query_resolved";
}

/**
 * Events implied by the schedule itself (started / approved), plus whatever
 * query/resolve events the viewer triggered this session. Sorted most
 * recent first, capped to the simulated day — this is a log of "what the
 * schedule says has happened by day N," not a real audit trail.
 */
export function buildActivityLog(
  rows: TrackRow[],
  simulatedDay: number,
  queryEvents: { approvalId: string; day: number; kind: "query_raised" | "query_resolved" }[],
): TrackEvent[] {
  const events: TrackEvent[] = [];
  for (const row of rows) {
    if (row.start <= simulatedDay) {
      events.push({ day: row.start, approvalId: row.approvalId, approvalName: row.approvalName, departmentShort: row.departmentShort, kind: "started" });
    }
    if (row.status === "approved" && row.finish <= simulatedDay) {
      events.push({ day: row.finish, approvalId: row.approvalId, approvalName: row.approvalName, departmentShort: row.departmentShort, kind: "approved" });
    }
  }
  const byId = new Map(rows.map((r) => [r.approvalId, r] as const));
  for (const qe of queryEvents) {
    if (qe.day > simulatedDay) continue;
    const row = byId.get(qe.approvalId);
    if (!row) continue;
    events.push({ day: qe.day, approvalId: row.approvalId, approvalName: row.approvalName, departmentShort: row.departmentShort, kind: qe.kind });
  }
  return events.sort((a, b) => b.day - a.day || a.approvalId.localeCompare(b.approvalId));
}
