import type { RiskAssessment, RiskBand, RiskFactor } from "@/types/compliance";

/**
 * Risk-based scrutiny.
 *
 * The MAITRI Act allows inspections to be risk-led and randomised rather than
 * universal (s. 16). It does not say how to measure the risk, so this scoring
 * is the district's own and is labelled a pilot parameter wherever it appears.
 *
 * The score decides how hard a file is looked at. It never decides whether a
 * clearance is granted — that stays with the sectoral authority, and no score
 * can raise or lower what an Act requires.
 */

export interface RiskInput {
  hazardous: boolean;
  boiler: boolean;
  heightM: number;
  employees: number;
  /** MPCB category of the activity. */
  pollution: "red" | "orange" | "green" | "white";
  /** Rejections or objections this applicant has collected before. */
  past_rejections: number;
}

const POLLUTION_POINTS: Record<RiskInput["pollution"], number> = {
  red: 100,
  orange: 65,
  green: 30,
  white: 10,
};

export function assessRisk(input: RiskInput): RiskAssessment {
  const factors: RiskFactor[] = [
    {
      id: "pollution",
      label: `Pollution category — ${input.pollution}`,
      points: POLLUTION_POINTS[input.pollution],
      weight: 0.3,
      note: "The category the activity itself carries, before anything about this unit.",
    },
    {
      id: "hazardous",
      label: input.hazardous ? "Hazardous materials on site" : "No hazardous materials",
      points: input.hazardous ? 90 : 10,
      weight: 0.2,
      note: "Storage and handling of hazardous material changes what an inspection is for.",
    },
    {
      id: "boiler",
      label: input.boiler ? "Steam boiler on site" : "No pressure vessel",
      points: input.boiler ? 70 : 5,
      weight: 0.15,
      note: "A pressure vessel is inspected on its own statute, whatever the score says.",
    },
    {
      id: "height",
      label: `Built height ${input.heightM} m`,
      points: input.heightM > 15 ? 80 : input.heightM > 9 ? 40 : 15,
      weight: 0.15,
      note: "Height drives the fire and structural regime, not the pollution one.",
    },
    {
      id: "headcount",
      label: `${input.employees} employees`,
      points: input.employees > 100 ? 70 : input.employees >= 10 ? 40 : 15,
      weight: 0.1,
      note: "Headcount decides whether the Factories Act applies at all.",
    },
    {
      id: "history",
      label:
        input.past_rejections === 0
          ? "No prior objections on record"
          : `${input.past_rejections} prior objection(s) on record`,
      points: Math.min(100, input.past_rejections * 35),
      weight: 0.1,
      note: "History is weighted lightly on purpose: a past objection is not a finding about this file.",
    },
  ];

  const total = factors.reduce((n, f) => n + f.weight, 0);
  const score = Math.round((factors.reduce((n, f) => n + f.points * f.weight, 0) / total) * 10) / 10;
  const band: RiskBand = score >= 70 ? "high" : score >= 35 ? "medium" : "low";

  return {
    score,
    band,
    factors,
    inspection_required: band !== "low",
    scrutiny:
      band === "low"
        ? "Documents only. No routine site visit; the file clears on the record unless it is picked in the random sample."
        : band === "medium"
          ? "Documents, plus one joint site visit covering every department that needs to see the site."
          : "Full scrutiny. A joint inspection is scheduled and each department records its own findings.",
  };
}
