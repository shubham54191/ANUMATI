/**
 * The one engine, on the server.
 *
 * Everything below imports the same pure functions the browser runs, from
 * anumati-web/lib. The server adds only what a browser cannot have: the rule
 * base as published in the database, and the conversion of a roadmap wave
 * into desks on a parallel-clearance file.
 */
import { buildRoadmap, type RuleBase } from "@/lib/data/engine";
import { LOCATIONS } from "@/lib/constants/locations";
import { APPROVALS, DEPENDENCIES } from "@/lib/data/maharashtraFood";
import { MATRIX_RULES } from "@/lib/matrix/rules";
import type { Approval } from "@/types/approval";
import type { Dependency } from "@/types/dependency";
import type { Roadmap, RoadmapRequest } from "@/types/roadmap";
import type { ApplicationFile, DataRecord, DeptReview, ParameterGroup } from "@/types/matrix";
import type { Dossier } from "@/types/compliance";
import type { Queryable } from "../db";

export { buildRoadmap, APPROVALS, DEPENDENCIES };
export type { Approval, Dependency, Roadmap, RoadmapRequest, ApplicationFile, DeptReview, Dossier };

/** Departments whose refusal stands on their own Act — the technical veto. */
export const TECHNICAL_AUTHORITIES = new Set(["mpcb", "mfs", "dish", "ceig-mh", "boilers-mh", "fssai"]);

let cache: { version: string; rules: RuleBase } | null = null;

/** The published rule base, as the database holds it now. Cached per version. */
export async function loadRules(c: Queryable): Promise<{ version: string; rules: RuleBase }> {
  const v = await c.query<{ version: string }>("SELECT version FROM rule_set WHERE is_current");
  const version = v.rows[0]?.version;
  if (!version) throw new Error("No published rule set. Run the seed.");
  if (cache?.version === version) return cache;
  const a = await c.query<{ body: Approval }>(
    "SELECT body FROM approval_version WHERE review_status = 'published' ORDER BY approval_id",
  );
  const d = await c.query<{ body: Dependency }>(
    "SELECT body FROM dependency_version WHERE review_status = 'published' ORDER BY id",
  );
  cache = { version, rules: { approvals: a.rows.map((r) => r.body), dependencies: d.rows.map((r) => r.body) } };
  return cache;
}

export function invalidateRules() {
  cache = null;
}

export async function roadmapFor(c: Queryable, request: RoadmapRequest, id: string) {
  const { version, rules } = await loadRules(c);
  return { version, roadmap: buildRoadmap(request, id, undefined, rules) };
}

/** Approvals whose every prerequisite is issued, and which are not yet on the file. */
export function nextWave(roadmap: Roadmap, issued: Set<string>, onFile: Set<string>): Approval[] {
  const preds = new Map<string, string[]>(roadmap.approvals.map((a) => [a.id, []]));
  for (const d of roadmap.dependencies) preds.get(d.to_approval_id)?.push(d.from_approval_id);
  return roadmap.approvals.filter(
    (a) => !onFile.has(a.id) && (preds.get(a.id) ?? []).every((p) => issued.has(p)),
  );
}

/** One desk per approval. The id carries the approval so a department with two
 *  approvals in the same wave gets two desks, each on its own clock. */
export function deskFor(a: Approval): DeptReview {
  return {
    dept_id: `${a.department_id}:${a.id}`,
    dept_name: a.department_name,
    dept_short: a.department_short,
    officer_name: `Officer on duty — ${a.department_short}`,
    officer_designation: "Competent authority",
    approval_id: a.id,
    approval_name: a.name,
    weight: 1,
    veto: TECHNICAL_AUTHORITIES.has(a.department_id),
    deemed_exists: a.deemed_exists,
    deemed_days: a.deemed_days,
    deemed_reference: a.deemed_reference,
    sla_days: Math.max(1, a.statutory_days),
    escalation_tier: "Empowered Committee (MAITRI Act, 2023 — s. 6)",
    state: "queued",
    decided_on_day: null,
    decided_at: null,
    score: null,
    remarks: null,
    escalated_on_day: null,
    requires: a.required_documents,
  };
}

/** The registry checks every file gets, answered by the API Setu adapter. */
export function registryRecords(): DataRecord[] {
  const r = (
    id: string,
    label: string,
    source: string,
    source_short: string,
    endpoint: string,
    replaces: string,
  ): DataRecord => ({
    id,
    label,
    source,
    source_short,
    endpoint,
    state: "idle",
    value: null,
    fetched_at: null,
    latency_ms: 600,
    replaces,
    consumers: [],
  });
  return [
    r("REG-PAN", "PAN of the company", "Income Tax Department via API Setu", "API SETU · PAN", "apisetu:pan/verify", "Self-attested PAN copy"),
    r("REG-CIN", "Company incorporation (CIN)", "Ministry of Corporate Affairs via API Setu", "API SETU · MCA", "apisetu:mca/company", "Certificate of Incorporation copy"),
    r("REG-GSTIN", "GST registration", "GSTN via API Setu", "API SETU · GSTN", "apisetu:gstn/taxpayer", "GST certificate copy"),
    r("REG-UDYAM", "Udyam registration", "Ministry of MSME via API Setu", "API SETU · UDYAM", "apisetu:udyam/verify", "Udyam certificate copy"),
  ];
}

function parametersFor(desks: DeptReview[], dossier: Dossier): ParameterGroup[] {
  return desks.map((d) => {
    const declared = dossier.fields
      .filter((f) => f.declared[d.approval_id] !== undefined)
      .map((f) => ({ name: f.label, value: `${f.declared[d.approval_id]} ${f.unit}` }));
    return {
      id: `PG-${d.approval_id}`,
      label: `${d.approval_name} — particulars`,
      fields: [
        ...declared,
        { name: "Documents on this department's list", value: d.requires.join(", ") || "none" },
      ],
      owner_dept: d.dept_id,
      owner_short: d.dept_short,
      verified_by_dept: null,
      verified_on_day: null,
      signature_ref: null,
    };
  });
}

/** Turn a submitted application's first wave into a parallel-clearance file. */
export function fileFromApplication(input: {
  id: string;
  applicant: string;
  project: string;
  sector: string;
  location: string;
  filed_on: string;
  wave: Approval[];
  dossier: Dossier;
}): ApplicationFile {
  const reviews = input.wave.map(deskFor);
  const technical = reviews.find((r) => r.veto);
  const other = reviews.find((r) => r !== technical);
  return {
    id: input.id,
    applicant: input.applicant,
    project: input.project,
    sector: input.sector,
    // The file carries the place's name, not its lookup key.
    location: LOCATIONS.find((l) => l.id === input.location)?.label ?? input.location,
    filed_on: input.filed_on,
    phase: "Wave 1 — approvals with no pending prerequisite",
    day: 0,
    dispatched: false,
    rule: MATRIX_RULES["MX-VETO-TECH"],
    reviews,
    records: registryRecords(),
    parameters: parametersFor(reviews, input.dossier),
    thread: [],
    events: [],
    resolution: null,
    tie_breaker_open: false,
    // Only used by the demo-mode "replay a clash" control.
    demo: {
      approver_dept: other?.dept_id ?? reviews[0]?.dept_id ?? "",
      rejecter_dept: technical?.dept_id ?? reviews[1]?.dept_id ?? "",
      approver_note: "Particulars in order.",
      rejection_reason: "Technical particulars do not meet the parent Act's requirement.",
    },
  };
}

export function desksForWave(wave: Approval[]): DeptReview[] {
  return wave.map(deskFor);
}

export function parametersForDesks(desks: DeptReview[], dossier: Dossier) {
  return parametersFor(desks, dossier);
}

/** Refuse a rule base with a cycle before it is published, not after. */
export function findCycle(approvalIds: string[], deps: { from_approval_id: string; to_approval_id: string }[]): string[] | null {
  const ids = new Set(approvalIds);
  const indeg = new Map([...ids].map((i) => [i, 0]));
  const out = new Map<string, string[]>([...ids].map((i) => [i, []]));
  for (const d of deps) {
    if (!ids.has(d.from_approval_id) || !ids.has(d.to_approval_id)) continue;
    out.get(d.from_approval_id)!.push(d.to_approval_id);
    indeg.set(d.to_approval_id, (indeg.get(d.to_approval_id) ?? 0) + 1);
  }
  const queue = [...ids].filter((i) => indeg.get(i) === 0);
  let seen = 0;
  while (queue.length) {
    const n = queue.shift()!;
    seen += 1;
    for (const m of out.get(n)!) {
      indeg.set(m, indeg.get(m)! - 1);
      if (indeg.get(m) === 0) queue.push(m);
    }
  }
  return seen === ids.size ? null : [...ids].filter((i) => (indeg.get(i) ?? 0) > 0);
}
