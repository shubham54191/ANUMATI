import type { RegistryAnswer } from "./index";

/**
 * Recorded answers for the demo. Same shape as a live answer, including the
 * case that matters most — a record that contradicts the file. Values are
 * illustrative and belong to no real taxpayer.
 */
export const FIXTURE_REGISTRY: Record<string, RegistryAnswer> = {
  "REG-PAN": { state: "verified", value: "PAN AABCS0000X · company · active · name matches the application" },
  "REG-CIN": { state: "verified", value: "CIN U15400PN2025PTC000000 · active · 2 directors, no disqualification" },
  "REG-GSTIN": { state: "verified", value: "GSTIN 27AABCS0000X1Z0 · active · returns filed to the last period" },
  "REG-UDYAM": {
    state: "mismatch",
    value: "Udyam UDYAM-MH-26-0000000 lists investment in plant below the figure on the application form",
  },
  // The seeded matrix files' own records.
  "DR-PAN-GST": { state: "verified", value: "GSTIN active · returns filed to Aug 2026 · no demand outstanding" },
  "DR-LAND": { state: "verified", value: "Parcel PN-CHK-114/2A · MIDC lease registered · no encumbrance" },
  "DR-PROMOTER": { state: "verified", value: "2 promoters · no adverse record · no disqualification under s. 164" },
  "DR-EPFO": { state: "verified", value: "Establishment code active · contributions current · no default" },
  "DR-EGRESS": {
    state: "mismatch",
    value: "DISH plan set: 2 exits, staircase 1.2 m. Fire Service plan set: 3 exits, staircase 1.5 m.",
  },
  "DR-TRANSFORMER": {
    state: "mismatch",
    value: "MSEDCL load application: 1250 kVA transformer. CEIG single-line diagram: 1600 kVA.",
  },
  "DR-WATER-DRAW": {
    state: "mismatch",
    value: "MIDC water application: 210 KLD. MPCB consent form: ETP sized for 145 KLD.",
  },
};
