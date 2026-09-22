/**
 * Matrix 2.0 — concurrent inter-departmental clearance.
 *
 * The applicant-side roadmap answers "what do I need and in what order".
 * This file models the other half: what happens inside government once a file
 * has been pushed to every stakeholder department at once. Parallel dispatch
 * creates a class of problem sequential filing never had — two departments
 * deciding the opposite thing at the same instant — so the governance rules
 * that break the tie have to be data, not code.
 */

/** Where a single department's review has got to. */
export type ReviewState =
  | "queued"
  | "in_review"
  | "approved"
  | "rejected"
  /**
   * Only where the parent law itself provides a deeming clause — MRTP s. 45(5),
   * CGST r. 9(5), Water Act s. 25(7). The Right to Public Services Act, 2015
   * does NOT deem anything approved: it gives an appeal (s. 9) and a penalty on
   * the officer (s. 10). Deeming is a power of the sectoral statute, never of
   * the service-delivery statute.
   */
  | "deemed_approved"
  /**
   * The default consequence of a missed window under Maharashtra's own single
   * window law: the Nodal Agency transfers the file to the Empowered Committee
   * and the competent authority ceases to have power over it.
   * MAITRI Act, 2023 — s. 5.
   */
  | "transferred_to_committee";

/** What the pre-defined decision matrix says to do when reviews disagree. */
export type MatrixRuleKind = "veto" | "escalation" | "weighted";

export interface MatrixRule {
  id: string;
  kind: MatrixRuleKind;
  label: string;
  /** One line an officer can read out in a hearing. */
  summary: string;
  /** The clause the rule is drawn from — no rule without a citation. */
  authority: string;
  authority_section: string;
  /**
   * Whether the instrument behind this row is actually in force.
   *
   * The rule store behind the applicant roadmap already refuses to hold a rule
   * that cannot say where it comes from. The same discipline has to apply to
   * the rows that decide who wins a conflict — and an honest answer for a
   * pilot is sometimes "drafted for this pilot, not yet notified". Saying so
   * on screen is the difference between a cited system and one that merely
   * looks cited.
   */
  authority_status: "enacted" | "draft";
  /** Shown wherever a draft row is displayed, so nobody mistakes it for law. */
  authority_note?: string;
  /** veto: departments whose rejection hard-blocks the phase. */
  veto_departments?: string[];
  /** escalation: who breaks the tie, and how long they have. */
  tie_breaker?: {
    panel: string;
    chair: string;
    members: string[];
    sla_days: number;
  };
  /** weighted: the score the consolidated average must reach. */
  passing_score?: number;
}

export interface DeptReview {
  dept_id: string;
  dept_name: string;
  dept_short: string;
  officer_name: string;
  officer_designation: string;
  /** The clearance this department is deciding, by roadmap approval id. */
  approval_id: string;
  approval_name: string;
  /** Share of the consolidated score under a weighted rule. */
  weight: number;
  /** True where a rejection is a dealbreaker — Pollution, Fire, Factories. */
  veto: boolean;
  /**
   * Whether the PARENT LAW of this clearance carries its own deeming clause.
   * This is a property of the statute, not a category of department: MRTP has
   * one, the Companies Act does not. Where it is false, a missed window sends
   * the file to the Empowered Committee instead of deeming anything.
   */
  deemed_exists: boolean;
  /** Days after which the parent law's deeming clause bites. */
  deemed_days: number | null;
  /** The clause that does the deeming — never the RTS Act. */
  deemed_reference: string | null;
  sla_days: number;
  /** Where a missed window goes. Default: the Empowered Committee. */
  escalation_tier: string;
  state: ReviewState;
  /** Simulated day (from dispatch) the department decided. */
  decided_on_day: number | null;
  /** Wall-clock stamp — this is what makes a clash simultaneous. */
  decided_at: string | null;
  /** 0–100, only meaningful under a weighted rule. */
  score: number | null;
  remarks: string | null;
  /** Set once the window was missed and the file left the department. */
  escalated_on_day: number | null;
  /** Documents this department is waiting on from the shared data matrix. */
  requires: string[];
}

/** A record the system fetches itself instead of asking for a certificate. */
export type DataRecordState =
  | "idle"
  | "fetching"
  | "verified"
  | "mismatch"
  | "unavailable";

export interface DataRecord {
  id: string;
  label: string;
  /** The ministry or authority of record. */
  source: string;
  source_short: string;
  /** The endpoint the matrix calls. */
  endpoint: string;
  state: DataRecordState;
  value: string | null;
  fetched_at: string | null;
  latency_ms: number;
  /** What the applicant used to have to carry to the counter. */
  replaces: string;
  /** Which departments consume this record. */
  consumers: string[];
}

export type ThreadAuthorRole = "department" | "officer" | "system";

export interface ThreadMessage {
  id: string;
  author: string;
  author_short: string;
  role: ThreadAuthorRole;
  /** Which department the author speaks for, if any. */
  dept_id: string | null;
  body: string;
  at: string;
  day: number;
}

export type EventKind =
  | "dispatch"
  | "decision"
  | "conflict"
  | "sla_warning"
  | "escalation"
  | "deemed"
  | "resolution"
  | "data"
  | "message";

export interface TimelineEvent {
  id: string;
  kind: EventKind;
  day: number;
  at: string;
  actor: string;
  body: string;
  /** Citation where the event was driven by a rule rather than a person. */
  authority?: string;
}

/** What the file's parallel phase has been settled as, once it is settled. */
export type Resolution =
  | { kind: "cleared"; day: number; note: string }
  | { kind: "sent_for_revision"; day: number; note: string; packet: RevisionPacket }
  | { kind: "escalated"; day: number; note: string }
  | { kind: "overruled"; day: number; note: string; by: string }
  | { kind: "sustained"; day: number; note: string; by: string }
  | { kind: "failed_score"; day: number; note: string; score: number };

export interface RevisionPacket {
  id: string;
  raised_by: string[];
  carried_forward: string[];
  objections: { dept_short: string; body: string }[];
  reply_days: number;
}

/**
 * The scripted clash behind the console's one-click demo control. Kept as data
 * on the file rather than logic in the button, so the same control works on
 * every application without knowing anything about it.
 */
export interface DemoScript {
  approver_dept: string;
  rejecter_dept: string;
  approver_note: string;
  rejection_reason: string;
  approver_score?: number;
  rejecter_score?: number;
}

export interface ApplicationFile {
  id: string;
  applicant: string;
  project: string;
  sector: string;
  location: string;
  filed_on: string;
  phase: string;
  /** Simulated days since the file was pushed to every department at once. */
  day: number;
  dispatched: boolean;
  rule: MatrixRule;
  reviews: DeptReview[];
  records: DataRecord[];
  thread: ThreadMessage[];
  events: TimelineEvent[];
  resolution: Resolution | null;
  /** True once a tie-breaker node has been added to the track. */
  tie_breaker_open: boolean;
  demo: DemoScript;
}

/** Everything the UI needs, derived — never stored, so it cannot go stale. */
export interface DerivedMatrixState {
  approved: DeptReview[];
  rejected: DeptReview[];
  pending: DeptReview[];
  deemed: DeptReview[];
  escalated: DeptReview[];
  /** Lanes the Empowered Committee now holds, under MAITRI Act s. 5. */
  transferred: DeptReview[];
  /** A conflict is an approval and a rejection inside the same parallel phase. */
  conflict: boolean;
  /** Set when the clash happened within the same clock second. */
  simultaneous: boolean;
  vetoedBy: DeptReview | null;
  weighted: {
    score: number;
    threshold: number;
    pass: boolean;
    complete: boolean;
    contributions: { dept_short: string; score: number; weight: number; share: number }[];
  } | null;
  verdict:
    | "awaiting_dispatch"
    | "in_progress"
    | "conflict_halted"
    | "conflict_escalation"
    | "conflict_scored"
    | "awaiting_tie_breaker"
    | "cleared"
    | "settled";
  /** Drives the overarching progress bar's colour. */
  tone: "neutral" | "active" | "orange" | "red" | "green";
  progress: number;
  canFinalise: boolean;
  breachedSla: DeptReview[];
}
