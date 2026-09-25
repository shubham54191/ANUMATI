import type { ApplicationFile, DataRecord, DeptReview, ParameterGroup } from "@/types/matrix";
import { MATRIX_RULES } from "./rules";

/**
 * Three live files, one per row of the decision matrix.
 *
 * Every department here is one that actually clears an industrial unit in
 * Maharashtra, and every clash is one that actually happens: the same physical
 * fact written differently on two departments' forms. No file is reviewed by a
 * department that would never see it.
 *
 * Officers are named by post, not by person. An invented individual on a
 * government screen is a small lie that costs more than it saves.
 *
 * Timestamps are fixed strings, not new Date() — the seed has to render the
 * same on the server and in the browser.
 */

type ReviewSeed = Omit<DeptReview, "decided_on_day" | "decided_at" | "escalated_on_day"> &
  Partial<Pick<DeptReview, "decided_on_day" | "decided_at" | "escalated_on_day">>;

function review(x: ReviewSeed): DeptReview {
  return { decided_on_day: null, decided_at: null, escalated_on_day: null, ...x };
}

/** Where a missed limit sends the file, unless the parent Act deems instead. */
const COMMITTEE = "the Empowered Committee (MAITRI Act, 2023 — s. 6)";

// --- Departments that recur across files -----------------------------------

const MIDC = {
  dept_id: "midc",
  dept_name: "Maharashtra Industrial Development Corporation",
  dept_short: "MIDC",
  officer_name: "Executive Engineer",
  officer_designation: "MIDC Regional Office, Chakan",
  escalation_tier: COMMITTEE,
};

const MPCB = {
  dept_id: "mpcb",
  dept_name: "Maharashtra Pollution Control Board",
  dept_short: "MPCB",
  officer_name: "Regional Officer",
  officer_designation: "MPCB Regional Office, Pune",
  escalation_tier: COMMITTEE,
};

const DISH = {
  dept_id: "dish",
  dept_name: "Directorate of Industrial Safety and Health",
  dept_short: "DISH",
  officer_name: "Deputy Director",
  officer_designation: "DISH Divisional Office, Pune",
  escalation_tier: COMMITTEE,
};

const FIRE = {
  dept_id: "mfs",
  dept_name: "Maharashtra Fire Service",
  dept_short: "FIRE",
  officer_name: "Divisional Fire Officer",
  officer_designation: "Fire Prevention Wing, Pune",
  escalation_tier: COMMITTEE,
};

const MSEDCL = {
  dept_id: "msedcl",
  dept_name: "Maharashtra State Electricity Distribution Co. Ltd.",
  dept_short: "MSEDCL",
  officer_name: "Executive Engineer",
  officer_designation: "HT Section, Chakan Circle",
  escalation_tier: COMMITTEE,
};

const CEIG = {
  dept_id: "ceig-mh",
  dept_name: "Chief Electrical Inspector to Government, Maharashtra",
  dept_short: "CEIG",
  officer_name: "Electrical Inspector",
  officer_designation: "CEIG Circle Office, Pune",
  escalation_tier: COMMITTEE,
};

const LABOUR = {
  dept_id: "labour-mh",
  dept_name: "Labour Department, Maharashtra",
  dept_short: "LABOUR",
  officer_name: "Assistant Commissioner",
  officer_designation: "Office of the Labour Commissioner, Pune",
  escalation_tier: COMMITTEE,
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
      consumers: ["MIDC", "LABOUR"],
    }),
    record({
      id: "DR-LAND",
      label: "MIDC plot allotment and lease particulars",
      source: "MIDC land records",
      source_short: "MIDC LAND",
      endpoint: "GET /land/plot/CHK-D-114-2A",
      latency_ms: 1400,
      replaces: "Certified copy of the lease deed carried to every other department",
      consumers: ["MIDC", "MPCB", "DISH"],
    }),
    record({
      id: "DR-PROMOTER",
      label: "Promoter antecedents and disqualification check",
      source: "Home Department — police verification exchange",
      source_short: "HOME",
      endpoint: "POST /verification/promoter",
      latency_ms: 1800,
      replaces: "Physical police clearance certificate and an affidavit",
      consumers: ["MIDC", "LABOUR"],
    }),
    record({
      id: "DR-EPFO",
      label: "EPFO contribution standing",
      source: "Employees' Provident Fund Organisation",
      source_short: "EPFO",
      endpoint: "GET /establishment/compliance/MHPUN2249081",
      latency_ms: 700,
      replaces: "Chartered accountant's compliance certificate",
      consumers: ["LABOUR", "DISH"],
    }),
  ];
}

// --- File 1 — technical objection under the parent Act ----------------------

const FILE_VETO: ApplicationFile = {
  id: "APP-2026-0148",
  applicant: "Sahyadri Agro Foods Pvt Ltd",
  project: "Food processing unit, 4,200 sq m, MIDC Chakan",
  sector: "Food processing",
  location: "MIDC Chakan, Pune",
  filed_on: "2026-09-02",
  phase: "Parallel Review Phase 1 — establishment clearances",
  day: 0,
  dispatched: false,
  rule: MATRIX_RULES["MX-VETO-TECH"],
  tie_breaker_open: false,
  resolution: null,
  reviews: [
    review({
      ...MIDC,
      approval_id: "A10",
      approval_name: "Building plan approval (MIDC as Special Planning Authority)",
      weight: 1,
      veto: false,
      // MIDC acts as Special Planning Authority under the MRTP Act, which
      // carries its own deeming clause for building permission.
      deemed_exists: true,
      deemed_days: 60,
      deemed_reference: "MRTP Act, 1966 — s. 45(5)",
      sla_days: 45,
      state: "queued",
      score: null,
      remarks: null,
      requires: ["Architect drawings", "Structural stability certificate", "Lease particulars"],
    }),
    review({
      ...MPCB,
      approval_id: "A15",
      approval_name: "Consent to Establish (water and air)",
      weight: 1,
      veto: true,
      // The Water Act's own four-month clause. Not the RTS Act.
      deemed_exists: true,
      deemed_days: 120,
      deemed_reference: "Water (Prevention and Control of Pollution) Act, 1974 — s. 25(7)",
      sla_days: 60,
      state: "queued",
      score: null,
      remarks: null,
      requires: ["Effluent treatment design", "Water balance", "Consent history"],
    }),
    review({
      ...FIRE,
      approval_id: "A13",
      approval_name: "Fire NOC — provisional",
      weight: 1,
      veto: true,
      deemed_exists: false,
      deemed_days: null,
      deemed_reference: null,
      sla_days: 21,
      state: "queued",
      score: null,
      remarks: null,
      requires: ["Fire-fighting layout", "Means of egress plan"],
    }),
    review({
      ...LABOUR,
      approval_id: "A29",
      approval_name: "Contract labour licence",
      weight: 1,
      veto: false,
      deemed_exists: false,
      deemed_days: null,
      deemed_reference: null,
      sla_days: 10,
      state: "queued",
      score: null,
      remarks: null,
      requires: ["Employee roll", "EPFO standing"],
    }),
  ],
  records: [
    ...baseRecords(),
    record({
      id: "DR-WATER-DRAW",
      label: "Water draw and effluent load, as declared to each department",
      source: "MIDC water application register, cross-read against the MPCB consent form",
      source_short: "MIDC · MPCB",
      endpoint: "GET /crosscheck/water?file=APP-2026-0148",
      latency_ms: 1200,
      replaces: "An officer comparing two paper forms by eye, if anyone thought to",
      consumers: ["MPCB", "MIDC"],
    }),
  ],
  parameters: [
    pg("PG-SITE", "Site and structure", "midc", "MIDC", 0, [
      ["Plot", "PN-CHK-114/2A, notified industrial area"],
      ["Built-up area", "4,200 sq m"],
      ["Setbacks", "As per MIDC development control norms"],
    ]),
    pg("PG-EFFLUENT", "Effluent and water", "mpcb", "MPCB", null, [
      ["Declared water draw", "210 KLD"],
      ["Proposed ETP capacity", "145 KLD"],
      ["Discharge point", "MIDC common conveyance"],
    ]),
    pg("PG-LABOUR", "Contract labour", "labour-mh", "LABOUR", null, [
      ["Contract workers", "34"],
      ["Principal employer registration", "Applied"],
    ]),
    pg("PG-FIRE", "Fire and egress", "mfs", "FIRE", null, [
      ["Exits", "2"],
      ["Staircase width", "1.5 m"],
    ]),
  ],
  thread: [],
  events: [],
  demo: {
    approver_dept: "midc",
    rejecter_dept: "mpcb",
    approver_note:
      "Plot is in the notified industrial area and the plan meets the MIDC development control norms. Building plan cleared.",
    rejection_reason:
      "Effluent treatment capacity proposed is 145 KLD against a declared draw of 210 KLD. Consent to Establish cannot be granted on a design that cannot treat the load it creates.",
  },
};

/**
 * One parameter group. `verifiedOnDay` is the day the owning department cleared
 * it, or null while nobody has — which is what the officer reading another
 * department's file needs to see.
 */
function pg(
  id: string,
  label: string,
  owner_dept: string,
  owner_short: string,
  verifiedOnDay: number | null,
  fields: [string, string][],
): ParameterGroup {
  return {
    id,
    label,
    fields: fields.map(([name, value]) => ({ name, value })),
    owner_dept,
    owner_short,
    verified_by_dept: verifiedOnDay === null ? null : owner_dept,
    verified_on_day: verifiedOnDay,
    // Mocked. A deployment carries the reference to the signature the issuing
    // system already holds against that approval; this product signs nothing.
    signature_ref: verifiedOnDay === null ? null : `sig:${owner_short.toLowerCase()}:${id}`,
  };
}

// --- File 2 — equal authority, Empowered Committee decides ------------------

const FILE_ESCALATION: ApplicationFile = {
  id: "APP-2026-0151",
  applicant: "Deccan Cold Storage LLP",
  project: "Cold storage block and 2× capacity expansion, Ranjangaon",
  sector: "Food processing",
  location: "MIDC Ranjangaon, Pune",
  filed_on: "2026-08-28",
  phase: "Parallel Review Phase 1 — plan approvals",
  day: 5,
  dispatched: true,
  rule: MATRIX_RULES["MX-ESCALATE-EQUAL"],
  tie_breaker_open: false,
  resolution: null,
  reviews: [
    review({
      ...DISH,
      approval_id: "A16",
      approval_name: "Factory plan approval",
      weight: 1,
      veto: false,
      // Factories Act's own deeming clause: three months, no communication.
      deemed_exists: true,
      deemed_days: 90,
      deemed_reference: "Factories Act, 1948 — s. 6(2)",
      sla_days: 15,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Factory layout", "Machinery list", "Means of egress plan"],
    }),
    review({
      ...FIRE,
      approval_id: "A13",
      approval_name: "Fire NOC — provisional",
      weight: 1,
      veto: false,
      deemed_exists: false,
      deemed_days: null,
      deemed_reference: null,
      sla_days: 21,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Fire-fighting layout", "Means of egress plan"],
    }),
    review({
      ...MIDC,
      approval_id: "A12",
      approval_name: "Industrial water connection — enhanced draw",
      weight: 1,
      veto: false,
      deemed_exists: false,
      deemed_days: null,
      deemed_reference: null,
      sla_days: 10,
      state: "approved",
      decided_on_day: 4,
      decided_at: "2026-09-01T11:04:12.000Z",
      score: null,
      remarks: "Enhanced draw of 210 KLD available on the Ranjangaon header. No objection.",
      requires: ["Lease particulars", "Water balance"],
    }),
    review({
      ...LABOUR,
      approval_id: "A29",
      approval_name: "Contract labour licence — revised strength",
      weight: 1,
      veto: false,
      deemed_exists: false,
      deemed_days: null,
      deemed_reference: null,
      sla_days: 10,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Employee roll"],
    }),
  ],
  records: [
    ...baseRecords(),
    record({
      id: "DR-EGRESS",
      label: "Means of egress: staircase width and exit count, on both plan sets",
      source: "DISH factory plan set, cross-read against the Fire Service plan set",
      source_short: "DISH · FIRE",
      endpoint: "GET /crosscheck/egress?file=APP-2026-0151",
      latency_ms: 1300,
      replaces: "Two departments each marking up their own copy of the same drawing",
      consumers: ["DISH", "FIRE"],
    }),
  ],
  thread: [],
  events: [
    {
      id: "EV-SEED-1",
      kind: "dispatch",
      day: 0,
      at: "2026-08-28T09:30:00.000Z",
      actor: "Matrix 2.0",
      body: "File pushed concurrently to 4 departments — DISH, FIRE, MIDC, LABOUR. All time limits started together.",
      authority: "MAITRI Act, 2023 — s. 4",
    },
    {
      id: "EV-SEED-2",
      kind: "decision",
      day: 4,
      at: "2026-09-01T11:04:12.000Z",
      actor: "MIDC · Executive Engineer",
      body: "A12 approved — enhanced draw of 210 KLD available on the Ranjangaon header.",
    },
  ],
  parameters: [
    pg("PG-PLAN", "Factory plan and layout", "dish", "DISH", 0, [
      ["Built-up area", "6,800 sq m"],
      ["Machinery layout", "Approved set, rev C"],
      ["Working head count", "210"],
    ]),
    pg("PG-EGRESS", "Exits and egress", "mfs", "FIRE", null, [
      ["Staircase width, DISH set", "1.5 m"],
      ["Staircase width, Fire set", "2.0 m"],
      ["Exit count", "2 on the DISH plan, 3 required"],
    ]),
  ],
  demo: {
    approver_dept: "dish",
    rejecter_dept: "mfs",
    approver_note:
      "Layout, machinery spacing and headroom meet the Factories Rules. Plan approved as submitted.",
    rejection_reason:
      "The plan set shows one staircase of 1.0 m serving the first floor. Two exits with a minimum 1.5 m staircase are required for this occupancy and height. Provisional NOC refused on the drawing as submitted.",
  },
};

// --- File 3 — risk-based scrutiny score -------------------------------------

const FILE_RISK: ApplicationFile = {
  id: "APP-2026-0155",
  applicant: "Sahyadri Agro Foods Pvt Ltd",
  project: "HT power connection and electrical installation, MIDC Chakan",
  sector: "Food processing",
  location: "MIDC Chakan, Pune",
  filed_on: "2026-09-04",
  phase: "Parallel Review Phase 2 — power and installation",
  day: 6,
  dispatched: true,
  rule: MATRIX_RULES["MX-RISK-SCRUTINY"],
  tie_breaker_open: false,
  resolution: null,
  reviews: [
    review({
      ...MSEDCL,
      approval_id: "A11",
      approval_name: "HT load sanction",
      weight: 1,
      veto: false,
      deemed_exists: false,
      deemed_days: null,
      deemed_reference: null,
      sla_days: 15,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Load application", "Single-line diagram"],
    }),
    review({
      ...CEIG,
      approval_id: "A22",
      approval_name: "Electrical installation approval",
      weight: 1,
      veto: true,
      deemed_exists: false,
      deemed_days: null,
      deemed_reference: null,
      sla_days: 15,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Single-line diagram", "Earthing layout", "Contractor licence"],
    }),
    review({
      ...DISH,
      approval_id: "A16",
      approval_name: "Machinery and safety clearance",
      weight: 1,
      veto: false,
      deemed_exists: true,
      deemed_days: 90,
      deemed_reference: "Factories Act, 1948 — s. 6(2)",
      sla_days: 15,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["Machinery list"],
    }),
    review({
      ...MPCB,
      approval_id: "A28",
      approval_name: "DG set and stack height clearance",
      weight: 1,
      veto: false,
      deemed_exists: false,
      deemed_days: null,
      deemed_reference: null,
      sla_days: 15,
      state: "in_review",
      score: null,
      remarks: null,
      requires: ["DG set specification", "Stack height calculation"],
    }),
  ],
  records: [
    ...baseRecords(),
    record({
      id: "DR-TRANSFORMER",
      label: "Transformer rating, as stated on the load application and on the diagram",
      source: "MSEDCL load application, cross-read against the CEIG single-line diagram",
      source_short: "MSEDCL · CEIG",
      endpoint: "GET /crosscheck/transformer?file=APP-2026-0155",
      latency_ms: 1100,
      replaces: "Nobody noticing until the inspection, six weeks later",
      consumers: ["MSEDCL", "CEIG"],
    }),
  ],
  thread: [],
  events: [
    {
      id: "EV-SEED-3",
      kind: "dispatch",
      day: 0,
      at: "2026-09-04T10:00:00.000Z",
      actor: "Matrix 2.0",
      body: "File pushed concurrently to 4 departments. Risk scores are due together, not in sequence.",
      authority: "MAITRI Act, 2023 — s. 16 (risk-led and random inspection)",
    },
  ],
  parameters: [
    pg("PG-LOAD", "Sanctioned load", "msedcl", "MSEDCL", 0, [
      ["Contract demand", "1,250 kVA"],
      ["Supply voltage", "22 kV HT"],
    ]),
    pg("PG-INSTALL", "Electrical installation", "ceig-mh", "CEIG", null, [
      ["Transformer rating, load application", "1,250 kVA"],
      ["Transformer rating, single-line diagram", "1,600 kVA"],
      ["Earthing scheme", "Submitted"],
    ]),
  ],
  demo: {
    approver_dept: "msedcl",
    rejecter_dept: "ceig-mh",
    approver_note:
      "Sanctioned load of 1,250 kVA is available on the Chakan feeder. Low risk on the distribution side.",
    rejection_reason:
      "The single-line diagram shows a 1,600 kVA transformer against a load application for 1,250 kVA. Until the two agree, the installation cannot be scored as low risk and a full inspection is required.",
    approver_score: 88,
    rejecter_score: 42,
  },
};

export const SEED_APPLICATIONS: ApplicationFile[] = [
  FILE_VETO,
  FILE_ESCALATION,
  FILE_RISK,
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
