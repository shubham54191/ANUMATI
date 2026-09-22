import type { MatrixRule } from "@/types/matrix";

/**
 * The Pre-Defined Decision Matrix.
 *
 * These are the rows the conflict screen reads from when two departments
 * disagree. They are data — a state that wants a different tie-break edits a
 * row, it does not edit the console.
 *
 * Maharashtra already has a single window statute, so most of this matrix is
 * not invented: the MAITRI Act, 2023 creates a Nodal Agency, an Empowered
 * Committee chaired by the Development Commissioner (Industries), and a
 * Supervisory Committee above it, and it makes their decisions binding. What
 * the Act does NOT contain is a clause headed "two departments disagree" — it
 * routes files to the Committee on delay (s. 5) and on grievance (s. 8). So
 * the honest description of these rows is "the closest enacted route", and
 * the escalation row says exactly that rather than claiming a mandate.
 *
 * One thing the Act is emphatic about, and this console obeys it: even the
 * Empowered Committee disposes of a transferred application *under the
 * relevant law* (s. 5(3)). Nothing here lets an administrative body grant a
 * clearance the sectoral statute would have refused.
 */

export const MATRIX_RULES: Record<string, MatrixRule> = {
  "MX-VETO-TECH": {
    id: "MX-VETO-TECH",
    kind: "veto",
    label: "Technical objection under the parent Act",
    summary:
      "A refusal by the authority that the sectoral Act names — pollution, fire, factories, electrical — stands on that Act, not on this system. No other department's approval can override it, and the rejection must state its reasons. The file goes back to the applicant for correction.",
    authority:
      "The parent Act of the rejecting authority (Water Act 1974, Maharashtra Fire Act 2006, Factories Act 1948), read with the MAITRI Act, 2023",
    authority_section: "MAITRI Act s. 4(3) — reasons to be recorded; s. 5(3) — disposal only under the relevant law",
    authority_status: "enacted",
    authority_note:
      "Verified against the MAITRI Act, 2023 (Mah. Act XXXIV of 2023). The veto is the sectoral Act's, not this system's — the single window can route a technical refusal but can never overrule one.",
    veto_departments: ["mpcb", "mfs", "dish", "ceig-mh", "legal-mh"],
  },

  "MX-ESCALATE-EQUAL": {
    id: "MX-ESCALATE-EQUAL",
    kind: "escalation",
    label: "Equal authority — Empowered Committee decides",
    summary:
      "Where two competent authorities of equal standing disagree and neither may override the other, the file goes to the Empowered Committee. Its decisions bind both the applicant and the authorities, and it disposes of the application under the same relevant law the department would have applied.",
    authority: "Maharashtra Industry, Trade and Investment Facilitation Act, 2023",
    authority_section: "s. 6 — Empowered Committee; s. 8 — powers to call for reasons and inquire; s. 9 — decisions binding",
    authority_status: "enacted",
    authority_note:
      "Closest enacted route, stated honestly: the Act sends files to the Committee on delay (s. 5) and on grievance (s. 8), and does not contain a clause headed “two departments disagree”. The Committee, its chair and the binding effect of its decisions are all enacted; applying that route to a deadlock is this pilot's reading.",
    tie_breaker: {
      panel: "Empowered Committee (MAITRI Act, 2023 — s. 6)",
      chair: "Development Commissioner (Industries), Government of Maharashtra",
      members: [
        "Development Commissioner (Industries) — chairperson",
        "Members as prescribed by rules under the Act",
        "Officers or experts invited for the case (s. 8)",
      ],
      // The Act leaves the limit to rules made under s. 18; 7 days is the
      // pilot's working value and is labelled as such on screen.
      sla_days: 7,
    },
  },

  "MX-RISK-SCRUTINY": {
    id: "MX-RISK-SCRUTINY",
    kind: "weighted",
    label: "Risk-based scrutiny score",
    summary:
      "Departments score the risk a proposal carries rather than voting it up or down. The consolidated weighted score decides the depth of scrutiny: below the threshold the file clears on documents alone, above it a full joint inspection is scheduled. The score never grants or refuses a clearance — it only decides how hard the file is looked at.",
    authority: "Risk-based scrutiny framework (pilot)",
    authority_section: "Pilot parameter — threshold and weights set by the district",
    authority_status: "draft",
    authority_note:
      "Drafted for the district pilot. The MAITRI Act supports risk-led and random inspection (s. 16) but sets no scoring formula; the weights and the passing score here are the district's own and are not notified.",
    passing_score: 75,
  },
};

export const RULE_LIST = Object.values(MATRIX_RULES);

/** Human label for what each rule does when reviews disagree. */
export const RULE_OUTCOME_LABEL: Record<MatrixRule["kind"], string> = {
  veto: "Phase halts · file returns to applicant for correction",
  escalation: "File transfers · Empowered Committee decides, and binds",
  weighted: "Scrutiny depth set · documents only, or joint inspection",
};
