import type { Approval } from "@/types/approval";
import type { ApprovalEvidence, FieldReport } from "@/types/report";

/**
 * The second clock.
 *
 * The rule base holds what the law allows a department. This holds what
 * applicants actually waited, and the two are almost never the same number.
 * Running the critical path on the second one is the whole point: a roadmap
 * built from statute tells you what you are entitled to, a roadmap built from
 * evidence tells you when you will actually open.
 *
 * The median, not the mean — one file stuck behind a land dispute for a year
 * should not move a district's planning figure.
 */

export type ClockBasis = "statutory" | "observed";

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

export function evidenceFor(approval: Approval, reports: FieldReport[]): ApprovalEvidence {
  const mine = reports.filter((r) => r.approval_id === approval.id);
  const timing = mine.filter((r) => r.observed_days !== null);
  const observed = median(timing.map((r) => r.observed_days as number));

  return {
    approval_id: approval.id,
    statutory_days: approval.statutory_days,
    observed_days: observed,
    sample: timing.length,
    delta: observed === null ? null : Math.round((observed - approval.statutory_days) * 10) / 10,
    extra_document: mine.filter((r) => r.kind === "extra_document").length,
    not_required: mine.filter((r) => r.kind === "not_required").length,
    wrong_order: mine.filter((r) => r.kind === "wrong_order").length,
    reports: [...mine].sort((a, b) => b.reported_on.localeCompare(a.reported_on)),
    seeded_only: mine.length > 0 && mine.every((r) => r.origin === "seeded"),
  };
}

export function evidenceIndex(
  approvals: Approval[],
  reports: FieldReport[],
): Record<string, ApprovalEvidence> {
  const index: Record<string, ApprovalEvidence> = {};
  for (const a of approvals) index[a.id] = evidenceFor(a, reports);
  return index;
}

/**
 * Days to plan with under a given basis. Where nobody has reported a timing,
 * the statutory figure stands — an absence of evidence is not evidence that
 * the department is quick.
 */
export function daysUnder(
  approval: Approval,
  basis: ClockBasis,
  index: Record<string, ApprovalEvidence>,
): number {
  if (basis === "statutory") return approval.statutory_days;
  const observed = index[approval.id]?.observed_days;
  return observed === null || observed === undefined
    ? approval.statutory_days
    : Math.round(observed);
}

/** How much of the rule base the second clock can actually speak to. */
export function coverage(index: Record<string, ApprovalEvidence>): {
  covered: number;
  total: number;
  reports: number;
} {
  const values = Object.values(index);
  return {
    covered: values.filter((e) => e.sample > 0).length,
    total: values.length,
    reports: values.reduce((n, e) => n + e.reports.length, 0),
  };
}
