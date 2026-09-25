/**
 * The OAGS validator.
 *
 * The /standard page used to show four green ticks whatever you dropped on it.
 * This is the real thing behind them, and it runs the four checks the page
 * names, in that order:
 *
 *   1. Schema conformance
 *   2. Every rule carries a citation
 *   3. No dependency cycles
 *   4. No orphaned approvals
 *
 * Deliberately hand-written rather than pulled from a JSON Schema library: the
 * four checks are what the page promises, three of them are graph properties no
 * schema can express, and a validator a state has to install nothing to run is
 * easier to adopt than one that drags in a dependency tree.
 *
 * Pure. No I/O, no throwing on bad input — malformed input is a finding, which
 * is the whole point.
 */

import { OAGS_VERSION } from "./schema";

export type Severity = "error" | "warning";

export interface Finding {
  /** Which of the four named checks raised it. */
  check: "schema" | "citation" | "cycle" | "orphan";
  severity: Severity;
  /** JSON-pointer-ish path into the submitted document. */
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  oags_version: string | null;
  counts: { approvals: number; dependencies: number };
  /** One entry per named check, so a caller can render the tick list directly. */
  checks: { id: Finding["check"]; label: string; passed: boolean; findings: number }[];
  findings: Finding[];
}

const CHECK_LABELS: Record<Finding["check"], string> = {
  schema: "Schema conformance",
  citation: "Every rule carries a citation",
  cycle: "No dependency cycles",
  orphan: "No orphaned approvals",
};

const EDGE_TYPES = new Set(["statutory", "documentary", "physical", "practice"]);
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export function validateOags(input: unknown): ValidationResult {
  const findings: Finding[] = [];
  const err = (check: Finding["check"], path: string, message: string) =>
    findings.push({ check, severity: "error", path, message });
  const warn = (check: Finding["check"], path: string, message: string) =>
    findings.push({ check, severity: "warning", path, message });

  if (!isObj(input)) {
    err("schema", "/", "The document is not a JSON object.");
    return assemble(findings, null, 0, 0);
  }

  const version = isStr(input.oags_version) ? input.oags_version : null;
  if (version === null) err("schema", "/oags_version", "Required, and must be a string.");
  else if (version !== OAGS_VERSION)
    warn(
      "schema",
      "/oags_version",
      `Document is OAGS ${version}; this validator implements ${OAGS_VERSION}.`,
    );

  if (!isObj(input.jurisdiction)) {
    err("schema", "/jurisdiction", "Required. Name the country and state the rules apply in.");
  } else {
    if (!isStr(input.jurisdiction.country)) err("schema", "/jurisdiction/country", "Required.");
    if (!isStr(input.jurisdiction.state)) err("schema", "/jurisdiction/state", "Required.");
  }

  const approvals = Array.isArray(input.approvals) ? input.approvals : null;
  const dependencies = Array.isArray(input.dependencies) ? input.dependencies : null;
  if (approvals === null) err("schema", "/approvals", "Required, and must be an array.");
  if (dependencies === null) err("schema", "/dependencies", "Required, and must be an array.");
  if (approvals === null || dependencies === null) {
    return assemble(findings, version, approvals?.length ?? 0, dependencies?.length ?? 0);
  }
  if (approvals.length === 0) err("schema", "/approvals", "At least one approval is required.");

  // ---- approvals -----------------------------------------------------------
  const ids = new Set<string>();
  approvals.forEach((raw, i) => {
    const p = `/approvals/${i}`;
    if (!isObj(raw)) {
      err("schema", p, "Not an object.");
      return;
    }
    if (!isStr(raw.id)) err("schema", `${p}/id`, "Required, and must be a non-empty string.");
    else if (ids.has(raw.id)) err("schema", `${p}/id`, `Duplicate approval id "${raw.id}".`);
    else ids.add(raw.id);

    if (!isStr(raw.name)) err("schema", `${p}/name`, "Required.");
    if (!isStr(raw.department_short)) err("schema", `${p}/department_short`, "Required.");

    const days = raw.statutory_days;
    if (typeof days !== "number" || !Number.isInteger(days) || days < 0)
      err("schema", `${p}/statutory_days`, "Required, and must be a whole number of days, 0 or more.");

    if (raw.confidence !== undefined) {
      const c = raw.confidence;
      if (typeof c !== "number" || c < 0 || c > 1)
        err("schema", `${p}/confidence`, "Must be a number between 0 and 1.");
    }

    citationOf(raw.source, `${p}/source`, isStr(raw.id) ? raw.id : `approvals[${i}]`);

    // A deeming clause is a power of the parent statute. Claiming one without
    // naming the provision that grants it is the single most dangerous thing a
    // publisher can do in this format, so it is an error and not a warning.
    if (raw.deemed_exists === true) {
      if (!isStr(raw.deemed_reference))
        err(
          "citation",
          `${p}/deemed_reference`,
          "deemed_exists is true, so the provision granting the deeming must be named.",
        );
      if (typeof raw.deemed_days !== "number")
        err("citation", `${p}/deemed_days`, "deemed_exists is true, so deemed_days is required.");
    }
  });

  // ---- dependencies --------------------------------------------------------
  const edges: [string, string][] = [];
  dependencies.forEach((raw, i) => {
    const p = `/dependencies/${i}`;
    if (!isObj(raw)) {
      err("schema", p, "Not an object.");
      return;
    }
    const from = raw.from_approval_id;
    const to = raw.to_approval_id;

    if (!isStr(from)) err("schema", `${p}/from_approval_id`, "Required.");
    else if (!ids.has(from))
      err("schema", `${p}/from_approval_id`, `No approval with id "${from}".`);

    if (!isStr(to)) err("schema", `${p}/to_approval_id`, "Required.");
    else if (!ids.has(to)) err("schema", `${p}/to_approval_id`, `No approval with id "${to}".`);

    if (isStr(from) && isStr(to)) {
      if (from === to) err("cycle", p, `"${from}" depends on itself.`);
      else edges.push([from, to]);
    }

    if (!isStr(raw.edge_type) || !EDGE_TYPES.has(raw.edge_type))
      err("schema", `${p}/edge_type`, "Must be statutory, documentary, physical or practice.");

    const c = raw.confidence;
    if (typeof c !== "number" || c < 0 || c > 1)
      err("schema", `${p}/confidence`, "Required, and must be a number between 0 and 1.");

    citationOf(raw.source, `${p}/source`, `dependency ${String(from)} -> ${String(to)}`);

    // An edge that is not in the statute is the one a reader most needs
    // explained, so publishing it bare is worth saying out loud.
    if (raw.edge_type === "practice" && !isStr(raw.rationale))
      warn(
        "citation",
        `${p}/rationale`,
        "A practice edge is not in any act, so it should say why it exists.",
      );
  });

  detectCycle(ids, edges, err);
  detectOrphans(approvals, ids, edges, warn);

  return assemble(findings, version, approvals.length, dependencies.length);

  function citationOf(source: unknown, path: string, subject: string) {
    if (!isObj(source)) {
      err("citation", path, `${subject} carries no source. Document, section and URL are required.`);
      return;
    }
    if (!isStr(source.document_id)) err("citation", `${path}/document_id`, "Required.");
    if (!isStr(source.section)) err("citation", `${path}/section`, "Required.");
    if (!isStr(source.url)) err("citation", `${path}/url`, "Required.");
    else if (!/^https?:\/\//i.test(source.url))
      warn("citation", `${path}/url`, "Should be a resolvable http(s) URL.");
  }
}

/** Depth-first search, reporting the first cycle with the path that closes it. */
function detectCycle(
  ids: Set<string>,
  edges: [string, string][],
  err: (c: Finding["check"], p: string, m: string) => void,
) {
  const out = new Map<string, string[]>();
  for (const [from, to] of edges) out.set(from, [...(out.get(from) ?? []), to]);

  const state = new Map<string, 0 | 1 | 2>(); // unseen / on stack / done
  const stack: string[] = [];

  const walk = (node: string): string[] | null => {
    state.set(node, 1);
    stack.push(node);
    for (const next of out.get(node) ?? []) {
      if (state.get(next) === 1) return [...stack.slice(stack.indexOf(next)), next];
      if (!state.get(next)) {
        const found = walk(next);
        if (found) return found;
      }
    }
    stack.pop();
    state.set(node, 2);
    return null;
  };

  for (const id of ids) {
    if (state.get(id)) continue;
    const cycle = walk(id);
    if (cycle) {
      err("cycle", "/dependencies", `Dependency cycle: ${cycle.join(" -> ")}.`);
      return; // One is enough to reject the file.
    }
  }
}

/**
 * An approval nothing depends on and that depends on nothing is not wrong, but
 * in a graph of thirty it usually means an edge was missed — so it is reported
 * as a warning, and a single-approval file is not flagged at all.
 */
function detectOrphans(
  approvals: unknown[],
  ids: Set<string>,
  edges: [string, string][],
  warn: (c: Finding["check"], p: string, m: string) => void,
) {
  if (ids.size < 2) return;
  const touched = new Set<string>();
  for (const [from, to] of edges) {
    touched.add(from);
    touched.add(to);
  }
  approvals.forEach((raw, i) => {
    if (!isObj(raw) || !isStr(raw.id)) return;
    if (!touched.has(raw.id))
      warn(
        "orphan",
        `/approvals/${i}`,
        `"${raw.id}" has no dependency in either direction. Independent, or an edge that was missed?`,
      );
  });
}

function assemble(
  findings: Finding[],
  version: string | null,
  approvals: number,
  dependencies: number,
): ValidationResult {
  const checks = (Object.keys(CHECK_LABELS) as Finding["check"][]).map((id) => {
    const mine = findings.filter((f) => f.check === id);
    return {
      id,
      label: CHECK_LABELS[id],
      // A warning is a remark, not a rejection. Only errors fail a check.
      passed: !mine.some((f) => f.severity === "error"),
      findings: mine.length,
    };
  });
  return {
    valid: !findings.some((f) => f.severity === "error"),
    oags_version: version,
    counts: { approvals, dependencies },
    checks,
    findings,
  };
}
