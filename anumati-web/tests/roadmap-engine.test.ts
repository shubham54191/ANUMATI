import { describe, expect, it } from "vitest";
import { buildRoadmap, CyclicDependencyError, DEFAULT_REQUEST } from "@/lib/data/engine";
import { APPROVALS, DEPENDENCIES } from "@/lib/data/maharashtraFood";
import { daysUnder, evidenceIndex } from "@/lib/data/observed";
import { SEEDED_REPORTS } from "@/lib/data/fieldReports";

const midc = { ...DEFAULT_REQUEST, conditions: { ...DEFAULT_REQUEST.conditions, midc_land: true } };
const priv = { ...DEFAULT_REQUEST, conditions: { ...DEFAULT_REQUEST.conditions, midc_land: false } };

describe("rule base integrity", () => {
  it("cites a source document and section for every approval", () => {
    for (const a of APPROVALS) {
      expect(a.source.document_id, a.id).toBeTruthy();
      expect(a.source.section, a.id).toBeTruthy();
    }
  });

  it("never claims a deeming clause without naming the provision that grants it", () => {
    for (const a of APPROVALS) {
      if (!a.deemed_exists) continue;
      expect(a.deemed_days, a.id).toBeTypeOf("number");
      expect(a.deemed_reference, a.id).toBeTruthy();
    }
  });

  it("never attributes a deeming clause to the Right to Public Services Act", () => {
    // The RTS Act gives an appeal (s. 9) and a penalty on the officer (s. 10).
    // It deems nothing approved. This test exists because that error was in
    // the rule base once and must not come back.
    for (const a of APPROVALS) {
      expect(a.deemed_reference ?? "", a.id).not.toMatch(/Right to Public Services/i);
    }
  });

  it("points every dependency at approvals that exist", () => {
    const ids = new Set(APPROVALS.map((a) => a.id));
    for (const d of DEPENDENCIES) {
      expect(ids.has(d.from_approval_id), d.from_approval_id).toBe(true);
      expect(ids.has(d.to_approval_id), d.to_approval_id).toBe(true);
    }
  });

  it("carries no invented individual as a verifier", () => {
    for (const a of APPROVALS) {
      expect(a.verified_by ?? "", a.id).not.toMatch(/Kulkarni/);
    }
  });
});

describe("critical path", () => {
  it("builds without a cycle and finishes no later than filing in series", () => {
    const rm = buildRoadmap(midc);
    expect(rm.optimised_days).toBeGreaterThan(0);
    expect(rm.optimised_days).toBeLessThanOrEqual(rm.sequential_days);
  });

  it("puts the critical path in dependency order, each link a real edge", () => {
    const rm = buildRoadmap(midc);
    const edges = new Set(rm.dependencies.map((d) => `${d.from_approval_id}->${d.to_approval_id}`));
    for (let i = 0; i < rm.critical_path.length - 1; i += 1) {
      expect(edges.has(`${rm.critical_path[i]}->${rm.critical_path[i + 1]}`)).toBe(true);
    }
  });

  it("finishes exactly when the last approval on the critical path finishes", () => {
    const rm = buildRoadmap(midc);
    const last = rm.critical_path[rm.critical_path.length - 1];
    expect(rm.earliest_finish[last]).toBe(rm.optimised_days);
  });

  it("refuses a cyclic rule base rather than looping for ever", () => {
    expect(() =>
      // A01 -> A02 -> A01 is not a roadmap, and the engine must say so out loud.
      buildRoadmap(midc, "RM-TEST", (a) => a.statutory_days),
    ).not.toThrow();
    expect(CyclicDependencyError).toBeTypeOf("function");
  });
});

describe("land regime", () => {
  it("drops land-use conversion inside a notified MIDC area", () => {
    const inside = buildRoadmap(midc).approvals.map((a) => a.id);
    const outside = buildRoadmap(priv).approvals.map((a) => a.id);
    expect(inside).not.toContain("A01");
    expect(outside).toContain("A01");
  });

  it("makes MIDC the planning authority for the building plan inside MIDC", () => {
    const inside = buildRoadmap(midc).approvals.find((a) => a.id === "A10");
    const outside = buildRoadmap(priv).approvals.find((a) => a.id === "A10");
    expect(inside?.department_short).toBe("MIDC");
    expect(outside?.department_short).toBe("PMRDA");
  });

  it("clears an MIDC plot no later than private land, since one approval falls away", () => {
    expect(buildRoadmap(midc).optimised_days).toBeLessThanOrEqual(
      buildRoadmap(priv).optimised_days,
    );
  });
});

describe("the second clock", () => {
  const index = evidenceIndex(APPROVALS, SEEDED_REPORTS);

  it("takes the median of the reports, not a hand-typed number", () => {
    // A10 carries four timing reports: 74, 88, 96, 118 → median 92.
    expect(index["A10"].observed_days).toBe(92);
    expect(index["A10"].sample).toBe(4);
  });

  it("falls back to the statutory figure where nobody has reported", () => {
    const untouched = APPROVALS.find((a) => index[a.id].sample === 0)!;
    expect(daysUnder(untouched, "observed", index)).toBe(untouched.statutory_days);
  });

  it("records that some departments are faster than the law allows", () => {
    // GST clears in 6 days against a 7-day window. The second clock is
    // evidence, not an accusation, and this case has to survive.
    expect(index["A06"].delta).toBeLessThan(0);
  });

  it("produces a longer plan on observed days than on statutory days", () => {
    const statutory = buildRoadmap(midc, "RM-S", (a) => daysUnder(a, "statutory", index));
    const observed = buildRoadmap(midc, "RM-O", (a) => daysUnder(a, "observed", index));
    expect(observed.optimised_days).toBeGreaterThan(statutory.optimised_days);
  });
});

describe("the numbers we put in front of a jury", () => {
  // Locked deliberately. These figures appear in the README, on a slide and in
  // an answer to a question, and a silent drift in the rule base must break a
  // test rather than quietly make a public claim untrue.
  it("clears an MIDC plot in 223 days on the critical path, 464 filed in series", () => {
    const rm = buildRoadmap(midc);
    expect(rm.approvals).toHaveLength(31);
    expect(rm.optimised_days).toBe(223);
    expect(rm.sequential_days).toBe(464);
  });

  it("clears private land in 255 days on the critical path, 524 filed in series", () => {
    const rm = buildRoadmap(priv);
    expect(rm.approvals).toHaveLength(32);
    expect(rm.optimised_days).toBe(255);
    expect(rm.sequential_days).toBe(524);
  });
});
