import { describe, expect, it } from "vitest";
import { buildRoadmap, DEFAULT_REQUEST } from "@/lib/data/engine";
import { prevalidate, prevalidationSummary, readinessFor } from "@/lib/compliance/prevalidate";
import { assessRisk } from "@/lib/compliance/risk";
import { inspectionNeeds, inspectionSummary, planJointVisits } from "@/lib/compliance/inspections";
import { renewalBoard, renewalStatus } from "@/lib/compliance/renewals";
import { SEED_DOSSIER } from "@/lib/data/dossier";
import { SEED_RENEWALS } from "@/lib/data/renewals";

const roadmap = buildRoadmap(DEFAULT_REQUEST);

describe("pre-validation", () => {
  it("refuses to pass a file whose required document is not in the dossier", () => {
    // A15 asks for an ETP design, which the dossier does not hold.
    const r = readinessFor(roadmap, SEED_DOSSIER, "A15");
    expect(r.ready).toBe(false);
    expect(r.gaps.some((g) => g.kind === "missing_document" && g.blocking)).toBe(true);
  });

  it("catches one physical fact written two different ways on two forms", () => {
    const r = readinessFor(roadmap, SEED_DOSSIER, "A15");
    const mismatch = r.gaps.find((g) => g.kind === "field_mismatch");
    expect(mismatch).toBeTruthy();
    expect(mismatch!.detail).toMatch(/210/);
    expect(mismatch!.detail).toMatch(/145/);
  });

  it("blocks on a statutory prerequisite but only advises on a practice one", () => {
    const rows = prevalidate(roadmap, SEED_DOSSIER);
    const gaps = rows.flatMap((r) => r.gaps).filter((g) => g.kind === "prerequisite_pending");
    expect(gaps.some((g) => g.blocking)).toBe(true);
    expect(gaps.some((g) => !g.blocking)).toBe(true);
  });

  it("accepts either side of an 'A or B' document requirement", () => {
    // A10 asks for "NA order or MIDC lease particulars"; the dossier has the lease.
    const r = readinessFor(roadmap, SEED_DOSSIER, "A10");
    expect(r.gaps.some((g) => g.kind === "missing_document" && /lease/i.test(g.detail))).toBe(false);
  });

  it("passes a file that has everything it needs", () => {
    const r = readinessFor(roadmap, SEED_DOSSIER, "A04"); // Udyam: Aadhaar + PAN
    expect(r.ready).toBe(true);
    expect(r.gaps).toHaveLength(0);
  });

  it("counts what the applicant would have been turned away for", () => {
    const summary = prevalidationSummary(prevalidate(roadmap, SEED_DOSSIER));
    expect(summary.total).toBe(roadmap.approvals.length);
    expect(summary.blocked).toBeGreaterThan(0);
    expect(summary.ready + summary.blocked).toBe(summary.total);
  });
});

describe("risk-based scrutiny", () => {
  it("puts a red-category hazardous unit in the high band", () => {
    const r = assessRisk({
      hazardous: true, boiler: true, heightM: 18, employees: 140,
      pollution: "red", past_rejections: 2,
    });
    expect(r.band).toBe("high");
    expect(r.inspection_required).toBe(true);
  });

  it("clears a small white-category unit on documents alone", () => {
    const r = assessRisk({
      hazardous: false, boiler: false, heightM: 6, employees: 8,
      pollution: "white", past_rejections: 0,
    });
    expect(r.band).toBe("low");
    expect(r.inspection_required).toBe(false);
    expect(r.scrutiny).toMatch(/Documents only/);
  });

  it("keeps the score inside its own scale", () => {
    const r = assessRisk({
      hazardous: true, boiler: true, heightM: 40, employees: 5000,
      pollution: "red", past_rejections: 99,
    });
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });

  it("weights history lightly — a past objection is not a finding about this file", () => {
    const base = { hazardous: false, boiler: false, heightM: 6, employees: 8, pollution: "white" } as const;
    const clean = assessRisk({ ...base, past_rejections: 0 });
    const marked = assessRisk({ ...base, past_rejections: 3 });
    expect(marked.score - clean.score).toBeLessThan(12);
  });
});

describe("joint inspections", () => {
  it("only plans visits for clearances that involve seeing the site", () => {
    const needs = inspectionNeeds(roadmap);
    expect(needs.length).toBeGreaterThan(0);
    expect(needs.every((n) => roadmap.approvals.some((a) => a.id === n.approval_id))).toBe(true);
    expect(needs.map((n) => n.approval_id)).not.toContain("A03"); // PAN is not a site visit
  });

  it("merges departments that become ready inside the same window", () => {
    const visits = planJointVisits(roadmap, 7);
    expect(visits.length).toBeLessThan(inspectionNeeds(roadmap).length);
    expect(visits.some((v) => v.departments.length > 1)).toBe(true);
  });

  it("keeps every inspection — merging a visit never drops one", () => {
    const needs = inspectionNeeds(roadmap);
    const planned = planJointVisits(roadmap).flatMap((v) => v.needs);
    expect(planned).toHaveLength(needs.length);
  });

  it("merges more aggressively as the window widens, never less", () => {
    const tight = planJointVisits(roadmap, 3).length;
    const loose = planJointVisits(roadmap, 30).length;
    expect(loose).toBeLessThanOrEqual(tight);
  });

  it("reports the saving as trips avoided", () => {
    const s = inspectionSummary(planJointVisits(roadmap, 7));
    expect(s.visits_saved).toBe(s.separate_visits - s.joint_visits);
    expect(s.visits_saved).toBeGreaterThan(0);
  });
});

describe("renewals", () => {
  const today = new Date("2026-09-22T00:00:00Z");

  it("flags a licence that has already lapsed", () => {
    const trade = SEED_RENEWALS.find((r) => r.approval_id === "A14")!;
    const s = renewalStatus(trade, today);
    expect(s.days_left).toBeLessThan(0);
    expect(s.alert).toBe("expired");
  });

  it("raises the seven-day alarm before it raises the thirty-day one", () => {
    const fire = renewalStatus(SEED_RENEWALS.find((r) => r.approval_id === "A23")!, today);
    const fssai = renewalStatus(SEED_RENEWALS.find((r) => r.approval_id === "A24")!, today);
    expect(fire.alert).toBe("7");
    expect(fssai.alert).toBe("30");
  });

  it("opens the renewal window only inside the published period", () => {
    const cto = renewalStatus(SEED_RENEWALS.find((r) => r.approval_id === "A20")!, today);
    expect(cto.window_open).toBe(false); // valid to 2031
    expect(cto.alert).toBe("none");
  });

  it("sorts the board by urgency, worst first", () => {
    const board = renewalBoard(SEED_RENEWALS, today);
    for (let i = 1; i < board.length; i += 1) {
      expect(board[i].days_left).toBeGreaterThanOrEqual(board[i - 1].days_left);
    }
  });

  it("names the instrument each validity period comes from", () => {
    for (const r of SEED_RENEWALS) expect(r.source, r.approval_id).toBeTruthy();
  });
});

describe("pre-validation does not double-count", () => {
  it("reports a document another approval issues as a prerequisite, not a missing file", () => {
    // A15 needs a sanctioned building plan, which A10 produces. The applicant
    // is not supposed to go and find one; they are supposed to file A10 first.
    const r = readinessFor(roadmap, SEED_DOSSIER, "A15");
    const doc = r.gaps.filter((g) => /building plan/i.test(g.detail));
    expect(doc.some((g) => g.kind === "prerequisite_pending")).toBe(true);
    expect(doc.some((g) => g.kind === "missing_document")).toBe(false);
  });
});
