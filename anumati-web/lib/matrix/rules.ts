import type { MatrixRule } from "@/types/matrix";

/**
 * The Pre-Defined Decision Matrix.
 *
 * These are the rows the conflict screen reads from when two departments
 * disagree. They are data — a state that wants a different tie-break edits a
 * row, it does not edit the console. Every row cites the instrument it comes
 * from, on the same principle as the rule store behind the roadmap: a rule
 * that cannot say where it comes from cannot be applied to a citizen.
 */

export const MATRIX_RULES: Record<string, MatrixRule> = {
  "MX-VETO-TECH": {
    id: "MX-VETO-TECH",
    kind: "veto",
    label: "Technical veto — hard block",
    summary:
      "A rejection by a designated technical or statutory authority blocks the phase outright. No other department's approval can override it; the file goes back to the applicant for correction.",
    authority: "Maharashtra Single Window Clearance Rules",
    authority_section: "r. 14(2) — technical objections",
    veto_departments: ["dit-mh", "legal-mh", "mpcb", "mfs", "dish", "ceig-mh"],
  },
  "MX-ESCALATE-EQUAL": {
    id: "MX-ESCALATE-EQUAL",
    kind: "escalation",
    label: "Equal weight — escalate to tie-breaker",
    summary:
      "Where both departments carry equal weight and neither may override the other, the file is routed to a standing tie-breaker panel, which may either overrule the rejection or sustain it.",
    authority: "GR IND-2024/CR-118/INDUSTRIES-2",
    authority_section: "para 6 — inter-departmental disagreement",
    tie_breaker: {
      panel: "District Steering Committee",
      chair: "Cabinet Secretary (Industries)",
      members: [
        "Cabinet Secretary (Industries) — chair",
        "District Collector, Pune",
        "Member Secretary, MPCB",
        "Joint Commissioner, Labour",
      ],
      sla_days: 7,
    },
  },
  "MX-WEIGHTED-PROC": {
    id: "MX-WEIGHTED-PROC",
    kind: "weighted",
    label: "Weighted score — consolidated threshold",
    summary:
      "Departments score the proposal instead of voting yes or no. The consolidated weighted average must reach the passing score for the phase to clear; below it the phase fails and the project manager is notified.",
    authority: "Maharashtra Public Procurement Policy, 2023",
    authority_section: "cl. 22 — multi-department technical evaluation",
    passing_score: 75,
  },
};

export const RULE_LIST = Object.values(MATRIX_RULES);

/** Human label for what each rule does when reviews disagree. */
export const RULE_OUTCOME_LABEL: Record<MatrixRule["kind"], string> = {
  veto: "Phase halts · file returns to applicant",
  escalation: "Phase suspends · tie-breaker panel decides",
  weighted: "Phase scored · threshold decides",
};
