/**
 * The Maharashtra rule base, expressed in OAGS.
 *
 * This is what `GET /api/v1/standard/export` returns and what the validator is
 * pointed at in tests. Building it from the same arrays the engine runs on
 * means the published file cannot drift from the product: if a rule changes,
 * the export changes with it.
 */

import type { Approval } from "@/types/approval";
import type { Dependency } from "@/types/dependency";
import { APPROVALS, DEPENDENCIES } from "@/lib/data/maharashtraFood";
import { OAGS_VERSION, OAGS_SCHEMA_ID } from "./schema";

export interface OagsDocument {
  $schema: string;
  oags_version: string;
  jurisdiction: { country: string; state: string; sector: string | null };
  rules_version: string;
  rules_as_of: string;
  licence: string;
  generated_at: string;
  approvals: unknown[];
  dependencies: unknown[];
}

export const RULES_VERSION = "v1.3";
export const RULES_AS_OF = "2026-09-07";

/**
 * `asOf` returns the rule base as it stood on a date: an approval whose source
 * had not come into force yet, or had already been superseded, is left out.
 * This is what makes a roadmap built a year ago still resolvable — the promise
 * the new-roadmap screen makes.
 */
export function oagsDocument(asOf?: string): OagsDocument {
  const approvals = asOf ? APPROVALS.filter((a) => inForce(a, asOf)) : APPROVALS;
  const ids = new Set(approvals.map((a) => a.id));
  const dependencies = DEPENDENCIES.filter(
    (d) => ids.has(d.from_approval_id) && ids.has(d.to_approval_id),
  );

  return {
    $schema: OAGS_SCHEMA_ID,
    oags_version: OAGS_VERSION,
    jurisdiction: { country: "IN", state: "MH", sector: "food_processing" },
    rules_version: RULES_VERSION,
    rules_as_of: asOf ?? RULES_AS_OF,
    licence: "CC-BY-4.0",
    generated_at: new Date().toISOString(),
    approvals: approvals.map(approvalOut),
    dependencies: dependencies.map(dependencyOut),
  };
}

/** True when the approval's own source was in force on that date. */
export function inForce(a: Approval, asOf: string): boolean {
  const from = a.source.effective_from;
  const to = a.source.effective_to;
  if (from && asOf < from) return false;
  if (to && asOf > to) return false;
  return true;
}

function approvalOut(a: Approval) {
  return {
    id: a.id,
    name: a.name,
    name_mr: a.name_mr ?? null,
    department_id: a.department_id,
    department_name: a.department_name,
    department_short: a.department_short,
    stage: a.stage,
    statutory_days: a.statutory_days,
    deemed_exists: a.deemed_exists,
    deemed_days: a.deemed_days,
    deemed_reference: a.deemed_reference,
    required_documents: a.required_documents,
    produces_document: a.produces_document,
    conditional_on: a.conditional_on,
    confidence: a.confidence,
    review_status: a.review_status,
    source: a.source,
    // Who checked the row, and when — carried so a reader can weigh the row
    // rather than take the publisher's word for it.
    verified_by: a.verified_by,
    verified_on: a.verified_on,
    version: a.version,
  };
}

function dependencyOut(d: Dependency) {
  return {
    from_approval_id: d.from_approval_id,
    to_approval_id: d.to_approval_id,
    edge_type: d.edge_type,
    confidence: d.confidence,
    rationale: d.rationale,
    evidence_document: d.evidence_document,
    condition: d.condition,
    source: d.source,
  };
}
