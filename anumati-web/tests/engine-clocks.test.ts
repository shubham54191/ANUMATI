import { describe, expect, it } from "vitest";
import {
  advanceDay,
  answerQuery,
  decide,
  deemedRemaining,
  derive,
  dispatch,
  dispatchWave,
  elapsedDays,
  raiseQuery,
  slaRemaining,
} from "@/lib/matrix/engine";
import { seedApplications } from "@/lib/matrix/applications";
import { buildRoadmap, DEFAULT_REQUEST } from "@/lib/data/engine";
import { prevalidate, prevalidationSummary, submissionGaps } from "@/lib/compliance/prevalidate";
import { SEED_DOSSIER } from "@/lib/data/dossier";
import type { ApplicationFile } from "@/types/matrix";

const veto = (): ApplicationFile => seedApplications().find((a) => a.id === "APP-2026-0148")!;
const desk = (app: ApplicationFile, id: string) => app.reviews.find((r) => r.dept_id === id)!;

describe("a query stops one desk's clock and no other", () => {
  it("pauses only the desk that asked", () => {
    let app = dispatch(veto());
    app = raiseQuery(app, "mpcb", "Send the ETP design basis.");
    app = advanceDay(app, 5);
    expect(desk(app, "mpcb").query_open).toBe(true);
    expect(desk(app, "mpcb").paused_days).toBe(5);
    expect(elapsedDays(desk(app, "mpcb"), app.day)).toBe(0);
    expect(elapsedDays(desk(app, "midc"), app.day)).toBe(5);
  });

  it("resumes where it stopped once the applicant answers", () => {
    let app = dispatch(veto());
    app = advanceDay(app, 3);
    app = raiseQuery(app, "mpcb", "Water balance, please.");
    app = advanceDay(app, 10);
    app = answerQuery(app, "mpcb", "Attached, revised to 145 KLD.");
    const mpcb = desk(app, "mpcb");
    expect(mpcb.query_open).toBe(false);
    expect(slaRemaining(mpcb, app.day)).toBe(mpcb.sla_days - 3);
    app = advanceDay(app, 2);
    expect(slaRemaining(desk(app, "mpcb"), app.day)).toBe(mpcb.sla_days - 5);
  });

  it("records both ends of the query in the thread and the audit trail", () => {
    let app = dispatch(veto());
    app = raiseQuery(app, "mpcb", "ETP basis?");
    app = answerQuery(app, "mpcb", "Here it is.");
    expect(app.thread.some((m) => m.role === "applicant")).toBe(true);
    expect(app.events.filter((e) => e.kind === "query")).toHaveLength(2);
  });

  it("does not let a paused desk lapse into a transfer", () => {
    let app = dispatch(veto());
    app = raiseQuery(app, "labour-mh", "Contractor list?");
    app = advanceDay(app, 30);
    expect(desk(app, "labour-mh").state).toBe("in_review");
  });

  it("closes an open query when the desk decides", () => {
    let app = dispatch(veto());
    app = raiseQuery(app, "mpcb", "Anything else?");
    app = decide(app, [{ dept_id: "mpcb", state: "approved" }]);
    expect(desk(app, "mpcb").query_open).toBe(false);
  });
});

describe("two clocks per desk", () => {
  it("reports the service limit and the deeming period separately", () => {
    const app = advanceDay(dispatch(veto()), 10);
    const midc = desk(app, "midc");
    expect(slaRemaining(midc, app.day)).toBe(midc.sla_days - 10);
    expect(deemedRemaining(midc, app.day)).toBe((midc.deemed_days as number) - 10);
    expect(deemedRemaining(desk(app, "mfs"), app.day)).toBeNull();
  });

  it("transfers at the service limit, then still deems under the parent Act", () => {
    // MIDC: 45-day service limit, MRTP s. 45(5) deems at 60.
    let app = advanceDay(dispatch(veto()), 46);
    expect(desk(app, "midc").state).toBe("transferred_to_committee");
    app = advanceDay(app, 15);
    expect(desk(app, "midc").state).toBe("deemed_approved");
  });
});

describe("waves", () => {
  it("starts a released desk's clock on the day it is released", () => {
    let app = advanceDay(dispatch(veto()), 20);
    const template = desk(app, "mfs");
    app = dispatchWave(app, [
      { ...template, dept_id: "mfs-final", approval_id: "A13F", approval_name: "Fire NOC — final", state: "queued" },
    ]);
    const fresh = desk(app, "mfs-final");
    expect(fresh.dispatched_on_day).toBe(20);
    expect(slaRemaining(fresh, app.day)).toBe(fresh.sla_days);
    expect(derive(app).breachedSla.map((r) => r.dept_id)).not.toContain("mfs-final");
  });

  it("never releases the same approval twice", () => {
    let app = dispatch(veto());
    const again = dispatchWave(app, [desk(app, "mpcb")]);
    expect(again.reviews).toHaveLength(app.reviews.length);
  });
});

describe("submission is judged on the wave being filed now", () => {
  const roadmap = buildRoadmap(DEFAULT_REQUEST);
  const rows = prevalidate(roadmap, SEED_DOSSIER);

  it("treats a later approval waiting for its prerequisite as sequencing, not a defect", () => {
    const later = rows.filter((r) => !r.in_current_wave);
    expect(later.length).toBeGreaterThan(0);
    for (const r of later) {
      expect(r.gaps.some((g) => g.kind === "prerequisite_pending" && g.blocking)).toBe(true);
    }
  });

  it("lets the file in once every current-wave approval is clean", () => {
    const clean = { ...SEED_DOSSIER, fields: [] };
    const fixed = prevalidate(roadmap, {
      ...clean,
      documents: Array.from(
        new Set([...clean.documents, ...roadmap.approvals.flatMap((a) => a.required_documents)]),
      ),
    });
    const s = prevalidationSummary(fixed);
    expect(s.submittable).toBe(true);
    expect(submissionGaps(fixed)).toHaveLength(0);
  });

  it("names exactly what stops the file today", () => {
    const s = prevalidationSummary(rows);
    const gaps = submissionGaps(rows);
    expect(s.submittable).toBe(gaps.length === 0);
    for (const g of gaps) expect(g.blocking).toBe(true);
  });
});

describe("the two ways a file comes back", () => {
  it("lets the Committee dispose of a transferred desk, citing s. 5(3)", async () => {
    const { committeeDecide } = await import("@/lib/matrix/engine");
    let app = advanceDay(dispatch(veto()), 22); // FIRE lapses at 21
    const fire = desk(app, "mfs");
    expect(fire.state).toBe("transferred_to_committee");
    app = committeeDecide(app, "mfs", "approved", "Empowered Committee", "Exit widths verified on the revised plan.");
    expect(desk(app, "mfs").state).toBe("approved");
    expect(app.events.at(-1)?.authority).toMatch(/s\. 5\(3\)/);
  });

  it("ignores a Committee decision on a desk it does not hold", async () => {
    const { committeeDecide } = await import("@/lib/matrix/engine");
    const app = dispatch(veto());
    expect(committeeDecide(app, "mpcb", "approved", "EC", "x")).toBe(app);
  });

  it("re-opens only the rejecting desks on resubmission, with fresh clocks", async () => {
    const { resubmit, sendForRevision } = await import("@/lib/matrix/engine");
    let app = dispatch(veto());
    app = advanceDay(app, 10);
    app = decide(app, [
      { dept_id: "midc", state: "approved" },
      { dept_id: "mpcb", state: "rejected", remarks: "ETP undersized" },
    ]);
    app = sendForRevision(app);
    app = advanceDay(app, 5); // settled: clock does not move
    app = resubmit(app, "ETP raised to 220 KLD.");
    expect(app.resolution).toBeNull();
    expect(desk(app, "midc").state).toBe("approved");
    const mpcb = desk(app, "mpcb");
    expect(mpcb.state).toBe("in_review");
    expect(mpcb.dispatched_on_day).toBe(app.day);
    expect(slaRemaining(mpcb, app.day)).toBe(mpcb.sla_days);
  });
});
