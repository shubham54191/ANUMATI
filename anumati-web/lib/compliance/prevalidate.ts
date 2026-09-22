import type { Roadmap } from "@/types/roadmap";
import type { ApprovalReadiness, Dossier, Gap } from "@/types/compliance";

/**
 * Check a file before it is filed.
 *
 * A single window portal accepts an application and then rejects it three
 * weeks later for a missing annexure. Everything needed to catch that is
 * already on this side of the counter: the department's own document list,
 * the dependency graph that says which prior order must exist, and the fact
 * that the same physical quantity appears on several forms and has to match.
 *
 * Nothing here talks to a department. It is arithmetic over what the applicant
 * already holds, which is exactly why it can run before filing.
 */

export function readinessFor(
  roadmap: Roadmap,
  dossier: Dossier,
  approvalId: string,
): ApprovalReadiness {
  const approval = roadmap.approvals.find((a) => a.id === approvalId)!;
  const held = new Set(dossier.documents.map((d) => d.toLowerCase()));
  const gaps: Gap[] = [];

  // A document that another approval on this roadmap issues is not a gap in
  // the applicant's dossier — it is a prerequisite, and it is reported once as
  // that below. Counting it twice would tell somebody to go and find a
  // certificate that does not exist yet.
  const issuedByAnother = new Map(
    roadmap.approvals
      .filter((a) => a.produces_document && a.id !== approvalId)
      .map((a) => [(a.produces_document as string).toLowerCase(), a.id]),
  );

  // 1. Documents the department's own list asks for.
  for (const doc of approval.required_documents) {
    // "NA order or MIDC lease particulars" is satisfied by either side.
    const alternatives = doc.split(/\s+or\s+/i).map((x) => x.trim().toLowerCase());
    if (alternatives.some((alt) => held.has(alt))) continue;
    if (alternatives.some((alt) => issuedByAnother.has(alt))) continue;
    gaps.push({
      kind: "missing_document",
      detail: `${doc} is on ${approval.department_short}'s list and is not in the dossier.`,
      blocking: true,
      remedy: "Add the document — no approval on this roadmap issues it for you.",
    });
  }

  // 2. Prior orders the graph says must exist first.
  const finish = roadmap.earliest_finish[approvalId] ?? 0;
  const filable = finish - approval.statutory_days;
  for (const d of roadmap.dependencies.filter((x) => x.to_approval_id === approvalId)) {
    const from = roadmap.approvals.find((a) => a.id === d.from_approval_id);
    if (!from?.produces_document) continue;
    if (held.has(from.produces_document.toLowerCase())) continue;
    gaps.push({
      kind: "prerequisite_pending",
      detail: `${from.produces_document} from ${d.from_approval_id} is not issued yet.`,
      // A practice edge is a convention, not a refusal ground: flag it, do not
      // block on it. The rule base already knows the difference.
      blocking: d.edge_type !== "practice",
      remedy: `File ${d.from_approval_id} first, or ask the counter to accept the acknowledgement.`,
    });
  }

  // 3. The same fact, written two different ways on two forms.
  for (const field of dossier.fields) {
    const values = Object.entries(field.declared);
    if (!values.some(([id]) => id === approvalId)) continue;
    const distinct = new Set(values.map(([, v]) => v));
    if (distinct.size <= 1) continue;
    gaps.push({
      kind: "field_mismatch",
      detail: `${field.label} is declared as ${values
        .map(([id, v]) => `${v} ${field.unit} on ${id}`)
        .join(", ")}.`,
      blocking: field.blocking_for.includes(approvalId),
      remedy: "Correct one of the forms so both departments see the same figure.",
    });
  }

  return {
    approval_id: approvalId,
    name: approval.name,
    department_short: approval.department_short,
    filable_on_day: filable,
    gaps,
    ready: gaps.every((g) => !g.blocking),
  };
}

export function prevalidate(roadmap: Roadmap, dossier: Dossier): ApprovalReadiness[] {
  return roadmap.approvals
    .map((a) => readinessFor(roadmap, dossier, a.id))
    .sort((x, y) => x.filable_on_day - y.filable_on_day || x.approval_id.localeCompare(y.approval_id));
}

/** The headline an applicant actually cares about. */
export function prevalidationSummary(rows: ApprovalReadiness[]) {
  const blocked = rows.filter((r) => !r.ready);
  return {
    total: rows.length,
    ready: rows.length - blocked.length,
    blocked: blocked.length,
    blocking_gaps: blocked.reduce((n, r) => n + r.gaps.filter((g) => g.blocking).length, 0),
    advisory_gaps: rows.reduce((n, r) => n + r.gaps.filter((g) => !g.blocking).length, 0),
  };
}
