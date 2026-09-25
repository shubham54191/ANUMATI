import { describe, expect, it } from "vitest";
import { validateOags } from "@/lib/oags/validate";
import { oagsDocument, inForce } from "@/lib/oags/document";
import { OAGS_SCHEMA, OAGS_VERSION } from "@/lib/oags/schema";
import { APPROVALS } from "@/lib/data/maharashtraFood";

const doc = oagsDocument();
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

describe("the schema we publish", () => {
  it("declares the version the validator implements", () => {
    expect(OAGS_SCHEMA.properties.oags_version.const).toBe(OAGS_VERSION);
  });

  it("requires a citation on every approval and every edge", () => {
    expect(OAGS_SCHEMA.properties.approvals.items.required).toContain("source");
    expect(OAGS_SCHEMA.properties.dependencies.items.required).toContain("source");
  });

  it("names the four edge types and nothing else", () => {
    expect(OAGS_SCHEMA.properties.dependencies.items.properties.edge_type.enum).toEqual([
      "statutory",
      "documentary",
      "physical",
      "practice",
    ]);
  });
});

describe("our own export", () => {
  // If we publish a standard and our own file fails it, nothing else in this
  // file matters. This is the test that has to stay green.
  it("passes our own validator with no errors", () => {
    const r = validateOags(doc);
    expect(r.findings.filter((f) => f.severity === "error")).toEqual([]);
    expect(r.valid).toBe(true);
  });

  it("passes all four named checks", () => {
    for (const c of validateOags(doc).checks) expect(c.passed, c.label).toBe(true);
  });

  it("carries every approval in the rule base", () => {
    expect(doc.approvals).toHaveLength(APPROVALS.length);
    expect(doc.oags_version).toBe(OAGS_VERSION);
    expect(doc.licence).toBe("CC-BY-4.0");
  });

  it("drops an edge when a date filter drops either approval it joins", () => {
    // Nothing may point at an approval the document no longer contains.
    const dated = oagsDocument("2020-01-01");
    const ids = new Set(dated.approvals.map((a) => (a as { id: string }).id));
    for (const d of dated.dependencies as { from_approval_id: string; to_approval_id: string }[]) {
      expect(ids.has(d.from_approval_id)).toBe(true);
      expect(ids.has(d.to_approval_id)).toBe(true);
    }
  });

  it("leaves out a rule that had not come into force on the date asked for", () => {
    const withDate = APPROVALS.find((a) => a.source.effective_from)!;
    const dayBefore = new Date(new Date(withDate.source.effective_from).getTime() - 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(inForce(withDate, dayBefore)).toBe(false);
  });
});

describe("the validator rejects what it should", () => {
  it("refuses something that is not an object at all", () => {
    for (const bad of [null, 42, "{}", [1, 2]]) {
      expect(validateOags(bad).valid, String(bad)).toBe(false);
    }
  });

  it("refuses a file with no version, jurisdiction or arrays", () => {
    const r = validateOags({});
    expect(r.valid).toBe(false);
    for (const path of ["/oags_version", "/jurisdiction", "/approvals", "/dependencies"]) {
      expect(r.findings.some((f) => f.path === path), path).toBe(true);
    }
  });

  it("catches an approval that claims a deeming clause without naming one", () => {
    const bad = clone(doc);
    (bad.approvals[0] as Record<string, unknown>).deemed_exists = true;
    (bad.approvals[0] as Record<string, unknown>).deemed_reference = null;
    const r = validateOags(bad);
    expect(r.valid).toBe(false);
    expect(r.findings.some((f) => f.check === "citation" && /deemed_reference/.test(f.path))).toBe(true);
  });

  it("catches a rule published with no source", () => {
    const bad = clone(doc);
    delete (bad.approvals[0] as Record<string, unknown>).source;
    const r = validateOags(bad);
    expect(r.checks.find((c) => c.id === "citation")!.passed).toBe(false);
  });

  it("catches an edge pointing at an approval that does not exist", () => {
    const bad = clone(doc);
    (bad.dependencies[0] as Record<string, unknown>).to_approval_id = "A99-NOT-REAL";
    const r = validateOags(bad);
    expect(r.valid).toBe(false);
    expect(r.findings.some((f) => /A99-NOT-REAL/.test(f.message))).toBe(true);
  });

  it("catches a cycle and names the approvals in it", () => {
    const bad = clone(doc);
    const [a, b] = (bad.approvals as { id: string }[]).slice(0, 2).map((x) => x.id);
    const edge = clone(bad.dependencies[0]) as Record<string, unknown>;
    bad.dependencies = [
      { ...edge, from_approval_id: a, to_approval_id: b },
      { ...edge, from_approval_id: b, to_approval_id: a },
    ];
    const r = validateOags(bad);
    expect(r.checks.find((c) => c.id === "cycle")!.passed).toBe(false);
    const cycle = r.findings.find((f) => f.check === "cycle")!;
    expect(cycle.message).toContain(a);
    expect(cycle.message).toContain(b);
  });

  it("catches an approval that depends on itself", () => {
    const bad = clone(doc);
    const id = (bad.approvals[0] as { id: string }).id;
    (bad.dependencies[0] as Record<string, unknown>).from_approval_id = id;
    (bad.dependencies[0] as Record<string, unknown>).to_approval_id = id;
    expect(validateOags(bad).valid).toBe(false);
  });

  it("catches an edge type it does not recognise", () => {
    const bad = clone(doc);
    (bad.dependencies[0] as Record<string, unknown>).edge_type = "vibes";
    expect(validateOags(bad).valid).toBe(false);
  });

  it("catches a confidence outside 0 to 1", () => {
    const bad = clone(doc);
    (bad.dependencies[0] as Record<string, unknown>).confidence = 1.4;
    expect(validateOags(bad).valid).toBe(false);
  });

  it("catches two approvals sharing an id", () => {
    const bad = clone(doc);
    bad.approvals = [bad.approvals[0], clone(bad.approvals[0])];
    bad.dependencies = [];
    expect(validateOags(bad).findings.some((f) => /Duplicate approval id/.test(f.message))).toBe(true);
  });
});

describe("the validator is a reviewer, not a gatekeeper", () => {
  it("passes a file whose only fault is an orphan, but says so", () => {
    const bad = clone(doc);
    const orphan = clone(bad.approvals[0]) as Record<string, unknown>;
    orphan.id = "A-ORPHAN";
    bad.approvals = [...bad.approvals, orphan];
    const r = validateOags(bad);
    expect(r.valid).toBe(true); // a warning must not fail the file
    expect(r.findings.some((f) => f.check === "orphan" && f.severity === "warning")).toBe(true);
  });

  it("does not call a single-approval file an orphan", () => {
    const one = { ...clone(doc), approvals: [clone(doc.approvals[0])], dependencies: [] };
    expect(validateOags(one).findings.some((f) => f.check === "orphan")).toBe(false);
  });

  it("warns, rather than fails, on a newer document version", () => {
    const newer = { ...clone(doc), oags_version: "9.9" };
    const r = validateOags(newer);
    expect(r.valid).toBe(true);
    expect(r.findings.some((f) => f.severity === "warning" && f.path === "/oags_version")).toBe(true);
  });

  it("reports every check every time, so the tick list is always complete", () => {
    for (const input of [doc, {}, null]) {
      expect(validateOags(input).checks.map((c) => c.id)).toEqual([
        "schema",
        "citation",
        "cycle",
        "orphan",
      ]);
    }
  });
});
