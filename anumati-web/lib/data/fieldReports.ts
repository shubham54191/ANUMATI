import type { FieldReport, ReportKind } from "@/types/report";

/**
 * Illustrative field reports for the district pilot.
 *
 * These are seeded rows, not filed ones, and every screen that uses them says
 * so. They exist to demonstrate the mechanism the closed loop actually needs:
 * an observed day count is never typed into the rule base by hand — it is the
 * median of reports that a reader can open and check one by one. A number
 * nobody can trace back to its rows is exactly the kind of number this project
 * exists to argue against.
 *
 * Replacing this file with filed reports from a real district changes nothing
 * downstream: the aggregation, the second clock and the critical path all read
 * the same shape.
 */

let n = 0;
const r = (
  approval_id: string,
  kind: ReportKind,
  observed_days: number | null,
  detail: string,
  reported_on: string,
  district = "Pune",
): FieldReport => ({
  id: `FR-${String((n += 1)).padStart(3, "0")}`,
  approval_id,
  kind,
  observed_days,
  detail,
  reported_on,
  district,
  origin: "seeded",
  status: "accepted",
});

export const SEEDED_REPORTS: FieldReport[] = [
  // A01 — NA / land-use conversion. Statutory 60. Median of these: 118.
  r("A01", "longer", 96, "Filed in March, order issued in June. Two rounds of queries on the 7/12 extract.", "2026-06-18"),
  r("A01", "longer", 112, "Held at the tahsil for a revenue clearance nobody had mentioned at filing.", "2026-05-04"),
  r("A01", "longer", 124, "Zone certificate had to be re-issued because the first one lapsed while waiting.", "2026-07-22"),
  r("A01", "longer", 141, "Four months. The file moved only after a personal visit to the Collectorate.", "2026-08-09"),

  // A10 — Building plan approval. Statutory 45. Median: 92.
  r("A10", "longer", 74, "Structural stability certificate queried twice on the same point.", "2026-04-27"),
  r("A10", "longer", 88, "Scrutiny fee challan took three weeks to reconcile before scrutiny even began.", "2026-06-02"),
  r("A10", "longer", 96, "Drawings returned for a setback correction that was not in the first query list.", "2026-07-15"),
  r("A10", "longer", 118, "Approval came after the Commencement application was already pending.", "2026-08-30"),
  r("A10", "extra_document", null, "Asked for a fire-safety undertaking that is not in the sanctioned list.", "2026-06-11"),

  // A15 — MPCB Consent to Establish. Statutory 60. Median: 87.
  r("A15", "longer", 71, "Regional office asked for a revised water balance after the site visit.", "2026-05-19"),
  r("A15", "longer", 84, "Consent issued 84 days after filing; two of those weeks were the site visit slot.", "2026-06-28"),
  r("A15", "longer", 90, "Effluent design queried once, then cleared without further change.", "2026-07-30"),
  r("A15", "longer", 103, "Waited on the common effluent facility's capacity letter.", "2026-08-25"),

  // A05 — MIDC plot allotment. Statutory 21. Median: 34.
  r("A05", "longer", 26, "Allotment letter on day 26; lease deed execution took another fortnight.", "2026-04-08"),
  r("A05", "longer", 32, "Earnest money reconciliation delayed the offer letter.", "2026-05-21"),
  r("A05", "longer", 36, "Project report revised once at the regional office's request.", "2026-06-17"),
  r("A05", "longer", 44, "Plot boundary dispute with the adjoining allottee had to be settled first.", "2026-08-02"),

  // A17 — Commencement certificate. Statutory 10. Median: 24.
  r("A17", "longer", 16, "Issued after the plinth check was rescheduled twice.", "2026-05-30"),
  r("A17", "longer", 22, "Waited on the sanctioned plan endorsement to be physically attached.", "2026-06-24"),
  r("A17", "longer", 26, "Development charges receipt had to be produced in original.", "2026-07-19"),
  r("A17", "longer", 33, "Site engineer's inspection slot was a month out.", "2026-08-28"),

  // A25 — Occupancy certificate. Statutory 15. Median: 41.
  r("A25", "longer", 28, "Completion drawings queried on a minor deviation.", "2026-05-12"),
  r("A25", "longer", 38, "Fire NOC final had to be produced again even though it was already on file.", "2026-06-20"),
  r("A25", "longer", 44, "Water connection completion letter was the last item and took three weeks.", "2026-07-26"),
  r("A25", "longer", 52, "Joint inspection could not be scheduled before the monsoon ended.", "2026-09-01"),
  r("A25", "extra_document", null, "Asked for the lift licence although no lift is installed.", "2026-07-26"),

  // A11 — HT power connection. Statutory 15. Median: 47 — large, but off the spine.
  r("A11", "longer", 31, "Feasibility cleared quickly; the estimate took the rest of the month.", "2026-04-30"),
  r("A11", "longer", 44, "Deposit paid on day 12, sanction letter on day 44.", "2026-06-05"),
  r("A11", "longer", 50, "Right-of-way for the line had to be agreed with MIDC first.", "2026-07-11"),
  r("A11", "longer", 63, "Transformer availability was the binding constraint, not the paperwork.", "2026-08-21"),

  // A21 — Factory licence. Statutory 21. Median: 29.
  r("A21", "longer", 24, "Plan approval endorsement was the only hold-up.", "2026-05-27"),
  r("A21", "longer", 28, "Inspector's visit on day 21, licence on day 28.", "2026-06-30"),
  r("A21", "longer", 30, "Employee roll had to be re-submitted in the revised format.", "2026-08-04"),
  r("A21", "longer", 35, "Held pending the contract labour licence, which was not a stated prerequisite.", "2026-08-27"),
  r("A21", "wrong_order", null, "Was told to obtain the contract labour licence first; the list does not say so.", "2026-08-27"),

  // A24 — FSSAI Central Licence. Statutory 45. Median: 38 — faster than the law allows for.
  r("A24", "longer", 33, "Cleared online in five weeks with one query.", "2026-05-08"),
  r("A24", "longer", 36, "No inspection was required; licence issued on documents.", "2026-06-14"),
  r("A24", "longer", 40, "One clarification on the product category, otherwise straightforward.", "2026-07-20"),
  r("A24", "longer", 44, "Inspection scheduled promptly; the certificate followed within a week.", "2026-08-18"),

  // A06 — GST registration. Statutory 7. Median: 6 — the deemed clock is doing its job.
  r("A06", "longer", 5, "Aadhaar authentication cleared it in under a week.", "2026-04-19"),
  r("A06", "longer", 6, "Physical verification waived; GSTIN on day 6.", "2026-05-25"),
  r("A06", "longer", 6, "One query on the rent agreement, resolved same day.", "2026-07-02"),
  r("A06", "longer", 8, "Deemed approval kicked in on day 7; the certificate followed a day later.", "2026-08-12"),

  // A20 — MPCB Consent to Operate. Statutory 45. Median: 61.
  r("A20", "longer", 52, "Trial run report had to be re-submitted with third-party analysis.", "2026-06-09"),
  r("A20", "longer", 58, "Site visit on day 40, consent on day 58.", "2026-07-08"),
  r("A20", "longer", 64, "Hazardous waste authorisation was processed alongside and held it up.", "2026-08-06"),
  r("A20", "longer", 71, "Ambient monitoring data for a full quarter was insisted on.", "2026-09-03"),

  // Reports that carry no timing, but say something about the rule base itself.
  r("A13", "extra_document", null, "Asked for a structural stability certificate at the provisional stage.", "2026-06-15"),
  r("A14", "not_required", null, "MIDC unit — the municipal trade licence was not insisted on at all.", "2026-05-02"),
  r("A29", "wrong_order", null, "Accepted only after the factory licence, contrary to the published order.", "2026-07-24"),
  r("A27", "not_required", null, "Signage permission was never asked for inside the MIDC estate.", "2026-08-15"),
];
