import type { ApplicationFile, DataRecord, DeptReview } from "@/types/matrix";
import { MATRIX_RULES } from "./rules";

/**
 * Three live files, one per row of the decision matrix, so every branch of the
 * conflict protocol can be walked in a demo without editing anything.
 *
 * Timestamps are fixed strings, not new Date() — the seed has to render the
 * same on the server and in the browser.
 */

const FILED = "2026-09-02";

type ReviewSeed = Omit<DeptReview, "decided_on_day" | "decided_at" | "escalated_on_day"> &
  Partial<Pick<DeptReview, "decided_on_day" | "decided_at" | "escalated_on_day">>;

function review(x: ReviewSeed): DeptReview {
  return { decided_on_day: null, decided_at: null, escalated_on_day: null, ...x };
}

// --- Departments that recur across files -----------------------------------

const FINANCE = {
  dept_id: "finance-mh",
  dept_name: "Finance Department, Maharashtra",
  dept_short: "FINANCE",
  officer_name: "S. Deshpande",
  officer_designation: "Deputy Secretary (Expenditure)",
  escalation_tier: "Principal Secretary (Finance)",
};

const IT = {
  dept_id: "dit-mh",
  dept_name: "Directorate of Information Technology, Maharashtra",
  dept_short: "IT",
  officer_name: "A. Nair",
  officer_designation: "Joint Director (Infrastructure)",
  escalation_tier: "Principal Secretary (IT)",
};

// --- Shared data matrix records --------------------------------------------

const record = (x: Omit<DataRecord, "state" | "value" | "fetched_at">): DataRecord => ({
  state: "idle",
  value: null,
  fetched_at: null,
  ...x,
});

function baseRecords(): DataRecord[] {
  return [
    record({
      id: "DR-PAN-GST",
      label: "PAN, GSTIN and filing status",
      source: "Central Board of Direct Taxes / GSTN",
      source_short: "CBDT · GSTN",
      endpoint: "GET /taxpayer/status?gstin=27AABCT1332L1ZQ",
      latency_ms: 900,
      replaces: "Attested PAN copy and a GST clearance letter carried to each counter",
      consumers: ["FINANCE", "GST DEPT"],
    }),
    record({
      id: "DR-LAND",
      label: "7/12 extract and NA order",
      source: "Revenue Department — MahaBhumi land registry",
      source_short: "REVENUE",
      endpoint: "GET /land/parcel/PN-CHK-114-2A",
      latency_ms: 1400,
      replaces: "Certified 7/12 extract from the tahsil office (5–7 days by post)",
      consumers: ["MIDC", "PMRDA", "COLLECTOR"],
    }),
    record({
      id: "DR-PROMOTER",
      label: "Promoter antecedents and disqualification check",
      source: "Home Department — police verification exchange",
      source_short: "HOME",
      endpoint: "POST /verification/promoter",
      latency_ms: 1800,
      replaces: "Physical police clearance certificate and an affidavit",
      consumers: ["FINANCE", "COLLECTOR"],
    }),
    record({
      id: "DR-EPFO",
      label: "EPFO contribution standing",
      source: "Employees' Provident Fund Organisation",
      source_short: "EPFO",
      endpoint: "GET /establishment/compliance/MHPUN2249081",
      latency_ms: 700,
      replaces: "Chartered accountant's compliance certificate",
      consumers: ["LABOUR", "FINANCE"],
    }),
  ];
}

// --- File 1 — veto / hard block --------------------------------------------

const FILE_VETO: ApplicationFile = {
  id: "APP-2026-0148",
  applicant: "Sahyadri Agro Foods Pvt Ltd",
  project: "Cold-chain and traceability platform, Chakan Food Park",
  sector: "Food processing",
  location: "MIDC Chakan, Pune",
  filed_on: FILED,
  phase: "Parallel Review Phase 2 — infrastructure and funding",
  day: 0,
  dispatched: false,
  rule: MATRIX_RULES["MX-VETO-TECH"],
  tie_breaker_open: false,
  resolution: null,
  reviews: [
    review({
      ...FINANCE,
      approval_id: "A05",
      approval_name: "MIDC plot allotment & capital subsidy sanction",
      weight: 1,
      veto: false,
      statutory: false,
      sla_days: 14,
      state: "queued",
      score: null,
      remarks: null,
      requires: ["Project report", "PAN", "EPFO standing"],
    }),
    review({
      ...IT,
      approval_id: "A11",
      approval_name: "IT infrastructure and cloud allocation clearance",
      weight: 1,
      veto: true,
      statutory: true,
      sla_days: 10,
      state: "queued",
      score: null,
      remarks: null,
      requires: ["Server sizing note", "MahaGov Cloud capacity record"],
    }),
    review({
      dept_id: "mpcb",
      dept_name: "Maharashtra Pollution Control Board",
      dept_short: "MPCB",
      officer_name: "V. Pawar",
      officer_designation: "Regional Officer, Pune",
      escalation_tier: "Member Secretary, MPCB",
      approval_id: "A15",
      approval_name: "Consent to Establish",
      weight: 1,
      veto: true,
      statutory: true,
      sla_days: 21,
      state: "queued",
      score: null,
      remarks: null,
      requires: ["Effluent plan", "Consent history"],
    }),
    review({
      dept_id: "labour-mh",
      dept_name: "Labour Department, Maharashtra",
      dept_short: "LABOUR",
      officer_name: "K. Jadhav",
      officer_designation: "Assistant Commissioner",
      escalation_tier: "Joint Commissioner (Labour)",
      approval_id: "A29",
      approval_name: "Contract labour licence",
      weight: 1,
      veto: false,
      statutory: false,
      sla_days: 7,
      state: "queued",
      score: null,
      remarks: null,
      requires: ["Employee roll", "EPFO standing"],
    }),
  ],
  records: [
    ...baseRecords(),
    record({
      id: "DR-CLOUD",
      label: "MahaGov Cloud capacity allocation",
      source: "Directorate of Information Technology — capacity register",
      source_short: "DIT",
      endpoint: "GET /cloud/allocation/pune-cluster",
      latency_ms: 1200,
      replaces: "An email trail with the state data centre, typically 10 days",
      consumers: ["IT", "FINANCE"],
    }),
  ],
  thread: [],
  events: [],
  demo: {
    approver_dept: "finance-mh",
    rejecter_dept: "dit-mh",
    approver_note:
      "Capital outlay of ₹4.2 cr is within the sanctioned head and the subsidy ceiling. Cleared on the funding side.",
    rejection_reason:
      "Server infrastructure budget exceeds cloud allocation guidelines — 18 on-premise racks proposed where MahaGov Cloud capacity is already allotted to this cluster.",
  },
};

// --- File 2 — escalation to a tie-breaker -----------------------------------

const FILE_ESCALATION: ApplicationFile = {
  id: "APP-2026-0151",
  applicant: "Deccan Cold Storage LLP",
  project: "Effluent line and 2× capacity expansion, Ranjangaon",
  sector: "Food processing",
  location: "MIDC Ranjangaon, Pune",
  filed_on: "2026-08-28",
  phase: "Parallel Review Phase 1 — establishment clearances",
  day: 5,
  dispatched: true,
  rule: MATRIX_RULES["MX-ESCALATE-EQUAL"],
  tie_breaker_open: false,
  resolution: null,
  reviews: [
    review({
      ...FINANCE,
      approval_id: "A05",
      approval_name: "Expansion incentive sanction",
      weight: 1,
      veto: false,
      statutory: false,
      sla_days: 14,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Audited accounts", "PAN"],
    }),
    review({
      dept_id: "mpcb",
      dept_name: "Maharashtra Pollution Control Board",
      dept_short: "MPCB",
      officer_name: "V. Pawar",
      officer_designation: "Regional Officer, Pune",
      escalation_tier: "Member Secretary, MPCB",
      approval_id: "A20",
      approval_name: "Consent to Operate — amended",
      weight: 1,
      veto: false,
      statutory: true,
      sla_days: 21,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Effluent plan", "Consent history"],
    }),
    review({
      dept_id: "midc",
      dept_name: "Maharashtra Industrial Development Corporation",
      dept_short: "MIDC",
      officer_name: "P. Shirke",
      officer_designation: "Executive Engineer",
      escalation_tier: "Regional Officer, MIDC",
      approval_id: "A12",
      approval_name: "Industrial water connection — enhanced draw",
      weight: 1,
      veto: false,
      statutory: false,
      sla_days: 10,
      state: "approved",
      decided_on_day: 4,
      decided_at: "2026-09-01T11:04:12.000Z",
      score: null,
      remarks: "Enhanced draw of 210 KLD available on the Ranjangaon header. No objection.",
      requires: ["Lease deed", "Water balance"],
    }),
    review({
      dept_id: "labour-mh",
      dept_name: "Labour Department, Maharashtra",
      dept_short: "LABOUR",
      officer_name: "K. Jadhav",
      officer_designation: "Assistant Commissioner",
      escalation_tier: "Joint Commissioner (Labour)",
      approval_id: "A29",
      approval_name: "Contract labour licence — revised strength",
      weight: 1,
      veto: false,
      statutory: false,
      sla_days: 7,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Employee roll"],
    }),
  ],
  records: baseRecords(),
  thread: [],
  events: [
    {
      id: "EV-SEED-1",
      kind: "dispatch",
      day: 0,
      at: "2026-08-28T09:30:00.000Z",
      actor: "Matrix 2.0",
      body: "File pushed concurrently to 4 departments — FINANCE, MPCB, MIDC, LABOUR. All SLA clocks started together.",
      authority: "Maharashtra Single Window Clearance Rules — r. 9(1)",
    },
    {
      id: "EV-SEED-2",
      kind: "decision",
      day: 4,
      at: "2026-09-01T11:04:12.000Z",
      actor: "MIDC · P. Shirke",
      body: "A12 approved — enhanced draw of 210 KLD available on the Ranjangaon header.",
    },
  ],
  demo: {
    approver_dept: "finance-mh",
    rejecter_dept: "mpcb",
    approver_note:
      "Expansion incentive of ₹1.8 cr is within the district ceiling and the unit is compliant on past disbursals.",
    rejection_reason:
      "Effluent load at 2× capacity crosses the consented discharge for the Ranjangaon common facility. Consent to Operate cannot be amended on the present design.",
  },
};

// --- File 3 — weighted score ------------------------------------------------

const FILE_WEIGHTED: ApplicationFile = {
  id: "APP-2026-0155",
  applicant: "Tender PUN/2026/CS-11 — four bidders",
  project: "Managed cold-storage and IT services, Pune cluster",
  sector: "Procurement",
  location: "Pune district",
  filed_on: "2026-09-04",
  phase: "Parallel Review Phase 3 — technical evaluation",
  day: 6,
  dispatched: true,
  rule: MATRIX_RULES["MX-WEIGHTED-PROC"],
  tie_breaker_open: false,
  resolution: null,
  reviews: [
    review({
      ...FINANCE,
      approval_id: "T01",
      approval_name: "Financial capacity and rate reasonability",
      weight: 1,
      veto: false,
      statutory: false,
      sla_days: 12,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Audited accounts", "Rate analysis"],
    }),
    review({
      ...IT,
      approval_id: "T02",
      approval_name: "Technical architecture and security posture",
      weight: 1,
      veto: false,
      statutory: false,
      sla_days: 12,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Architecture note", "Security audit"],
    }),
    review({
      dept_id: "mpcb",
      dept_name: "Maharashtra Pollution Control Board",
      dept_short: "MPCB",
      officer_name: "V. Pawar",
      officer_designation: "Regional Officer, Pune",
      escalation_tier: "Member Secretary, MPCB",
      approval_id: "T03",
      approval_name: "Refrigerant and emissions compliance",
      weight: 1,
      veto: false,
      statutory: false,
      sla_days: 12,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Refrigerant declaration"],
    }),
    review({
      dept_id: "pwd-mh",
      dept_name: "Public Works Department, Maharashtra",
      dept_short: "PWD",
      officer_name: "R. Gaikwad",
      officer_designation: "Superintending Engineer",
      escalation_tier: "Chief Engineer (PWD)",
      approval_id: "T04",
      approval_name: "Civil works and structural adequacy",
      weight: 1,
      veto: false,
      statutory: false,
      sla_days: 12,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Structural drawings"],
    }),
  ],
  records: baseRecords(),
  thread: [],
  events: [
    {
      id: "EV-SEED-3",
      kind: "dispatch",
      day: 0,
      at: "2026-09-04T10:00:00.000Z",
      actor: "Matrix 2.0",
      body: "Tender pushed concurrently to 4 evaluating departments. Scores are due together, not in sequence.",
      authority: "Maharashtra Public Procurement Policy, 2023 — cl. 22",
    },
  ],
  demo: {
    approver_dept: "finance-mh",
    rejecter_dept: "dit-mh",
    approver_note: "Rates are 6% under the estimate and the bidder's financial standing is sound.",
    rejection_reason:
      "Single-region hosting with no disaster-recovery site and an expired security audit. Architecture does not meet the state IT policy baseline.",
    approver_score: 95,
    rejecter_score: 40,
  },
};

export const SEED_APPLICATIONS: ApplicationFile[] = [
  FILE_VETO,
  FILE_ESCALATION,
  FILE_WEIGHTED,
];

/** Deep enough copy that resetting a file cannot leak state between demos. */
export function seedApplications(): ApplicationFile[] {
  return SEED_APPLICATIONS.map((a) => ({
    ...a,
    reviews: a.reviews.map((r) => ({ ...r })),
    records: a.records.map((r) => ({ ...r })),
    thread: a.thread.map((t) => ({ ...t })),
    events: a.events.map((e) => ({ ...e })),
  }));
}
