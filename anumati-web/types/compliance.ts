/**
 * The four things the problem statement asks for that a portal does not do:
 * check a file before it is filed, group the inspections it will attract,
 * decide how hard it should be scrutinised, and tell the applicant when it
 * has to be renewed. Plus the one thing the Act gives an applicant when none
 * of that works — a grievance that leaves the department.
 */

// --- Pre-validation ---------------------------------------------------------

export type GapKind = "missing_document" | "prerequisite_pending" | "field_mismatch";

export interface Gap {
  kind: GapKind;
  detail: string;
  /** A blocking gap means the counter will refuse the file, not query it. */
  blocking: boolean;
  /** Where the applicant fixes it. */
  remedy: string;
}

export interface ApprovalReadiness {
  approval_id: string;
  name: string;
  department_short: string;
  /** Earliest day this can be filed, from the dependency graph. */
  filable_on_day: number;
  gaps: Gap[];
  ready: boolean;
}

/** One physical fact, as written on each department's form. */
export interface CrossFormField {
  id: string;
  label: string;
  unit: string;
  /** approval id → the value declared on that department's form. */
  declared: Record<string, number>;
  /** Which approvals are refused outright when the numbers disagree. */
  blocking_for: string[];
}

export interface Dossier {
  /** Documents the applicant actually holds today. */
  documents: string[];
  fields: CrossFormField[];
}

// --- Risk-based scrutiny ----------------------------------------------------

export type RiskBand = "low" | "medium" | "high";

export interface RiskFactor {
  id: string;
  label: string;
  /** 0–100, how much risk this factor carries on its own. */
  points: number;
  weight: number;
  note: string;
}

export interface RiskAssessment {
  score: number;
  band: RiskBand;
  factors: RiskFactor[];
  /** What the band buys the applicant, in plain words. */
  scrutiny: string;
  inspection_required: boolean;
}

// --- Joint inspections ------------------------------------------------------

export interface InspectionNeed {
  approval_id: string;
  name: string;
  department_short: string;
  /** Day the site is ready for this department to visit. */
  ready_day: number;
}

export interface JointVisit {
  id: string;
  /** Inclusive day window the visit is scheduled in. */
  from_day: number;
  to_day: number;
  needs: InspectionNeed[];
  departments: string[];
  /** Visits this replaces — every need beyond the first. */
  visits_saved: number;
}

// --- Renewals ---------------------------------------------------------------

export type RenewalAlert = "none" | "60" | "30" | "7" | "expired";

export interface Renewal {
  approval_id: string;
  name: string;
  department_short: string;
  issued_on: string;
  valid_until: string;
  /** Days before expiry that the renewal window opens. */
  window_days: number;
  source: string;
}

export interface RenewalStatus {
  renewal: Renewal;
  days_left: number;
  window_open: boolean;
  alert: RenewalAlert;
}

// --- Grievance --------------------------------------------------------------

export type GrievanceStatus = "open" | "acknowledged" | "resolved";

export interface Grievance {
  id: string;
  approval_id: string;
  approval_name: string;
  department_short: string;
  applicant: string;
  raised_on: string;
  /** How long the file had been pending when the grievance was raised. */
  days_pending: number;
  reason: string;
  status: GrievanceStatus;
  /** Where the Act sends it. */
  route: string;
  authority: string;
  origin: "seeded" | "filed";
}
