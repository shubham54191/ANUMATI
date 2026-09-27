import { CONDITIONS, LAND_REGIMES, SECTORS, SIZE_BANDS, STAGES } from "@/lib/constants/sectors";
import { LOCATIONS } from "@/lib/constants/locations";

/**
 * The wizard's answers, and their one encoding in the URL. The same functions
 * write the "Generate roadmap" link, read it on the roadmap, and write it back
 * for "Change answers" — so an answer can no longer be dropped on the way.
 */
export interface SetupAnswers {
  sector: string;
  location: string;
  land: "midc" | "private";
  size: string;
  stage: string;
  /** Condition chips, every one explicit: off is an answer too. */
  on: Record<string, boolean>;
}

export const EMPLOYEES_BY_BAND: Record<string, number> = { micro: 6, small: 30, medium: 72, large: 130 };

export const bandForEmployees = (n: number) => (n < 10 ? "micro" : n <= 50 ? "small" : n <= 100 ? "medium" : "large");

export const DEFAULT_ANSWERS: SetupAnswers = {
  sector: "food",
  location: "pune_chakan",
  land: "midc",
  size: "medium",
  stage: "new",
  // Matches the roadmap's starting conditions, so the default answers give the
  // published headline numbers.
  on: { boiler: true, height: false, hazardous: true, export: true, contract_labour: true },
};

const covered = (opts: readonly { id: string; covered?: boolean }[], id: string | null, fallback: string) => {
  const hit = opts.find((o) => o.id === id);
  return hit && hit.covered !== false ? hit.id : fallback;
};

export function encodeAnswers(a: SetupAnswers): URLSearchParams {
  const p = new URLSearchParams({
    sector: a.sector,
    location: a.location,
    stage: a.stage,
    size: a.size,
    employees: String(EMPLOYEES_BY_BAND[a.size] ?? 72),
    midc_land: a.land === "midc" ? "1" : "0",
  });
  // heightM drives conditions.height (> 15 m) on the roadmap.
  p.set("heightM", a.on.height ? "20" : "11");
  for (const c of CONDITIONS) if (c.id !== "height") p.set(c.id, a.on[c.id] ? "1" : "0");
  return p;
}

/** Reads answers back; anything missing or not covered falls back to the default. */
export function decodeAnswers(p: URLSearchParams): SetupAnswers {
  const employees = p.get("employees");
  const size = SIZE_BANDS.some((b) => b.id === p.get("size"))
    ? (p.get("size") as string)
    : employees
      ? bandForEmployees(Number(employees))
      : DEFAULT_ANSWERS.size;
  const on: Record<string, boolean> = { ...DEFAULT_ANSWERS.on };
  for (const c of CONDITIONS) {
    if (c.id === "height") {
      const h = p.get("heightM");
      if (h !== null) on.height = Number(h) > 15;
    } else if (p.get(c.id) === "1" || p.get(c.id) === "0") {
      on[c.id] = p.get(c.id) === "1";
    }
  }
  const land = p.get("midc_land");
  return {
    sector: covered(SECTORS, p.get("sector"), DEFAULT_ANSWERS.sector),
    location: covered(LOCATIONS, p.get("location"), DEFAULT_ANSWERS.location),
    stage: covered(STAGES, p.get("stage"), DEFAULT_ANSWERS.stage),
    land: land === "0" ? "private" : land === "1" ? "midc" : LAND_REGIMES[0].id,
    size,
    on,
  };
}
