import type { Dossier } from "@/types/compliance";

/**
 * What the applicant is holding today.
 *
 * Two deliberate gaps and one deliberate contradiction, because a pre-check
 * that always says "ready" teaches nobody anything. The contradiction is the
 * one that matters: the same water draw written as two different numbers on
 * two departments' forms, which is exactly the clash the officer console then
 * has to resolve on APP-2026-0148. The applicant could have caught it here,
 * three weeks earlier, for nothing.
 */
export const SEED_DOSSIER: Dossier = {
  documents: [
    "Certificate of Incorporation",
    "PAN",
    "DIN",
    "DSC",
    "MoA and AoA",
    "Aadhaar of promoter",
    "MIDC lease particulars",
    "Project report",
    "Earnest money",
    "Address proof",
    "Proof of place of business",
    "Employee roll",
    "Architect drawings",
    "Structural stability certificate",
    "Layout plan",
    "Machinery layout",
    "Water balance chart",
    "Consent fee challan",
    "Land document",
    "Fire fighting layout",
    "GSTIN",
    // Deliberately absent: "ETP design", "Sanctioned building plan".
  ],
  fields: [
    {
      id: "water_draw",
      label: "Water draw declared",
      unit: "KLD",
      declared: { A12: 210, A15: 145 },
      // MPCB refuses a consent whose treatment capacity cannot carry the load.
      blocking_for: ["A15"],
    },
    {
      id: "built_up",
      label: "Built-up area declared",
      unit: "sq m",
      declared: { A10: 4200, A16: 4200, A25: 4200 },
      blocking_for: [],
    },
    {
      id: "connected_load",
      label: "Connected load declared",
      unit: "kVA",
      declared: { A11: 1250, A22: 1600 },
      blocking_for: ["A22"],
    },
  ],
};
