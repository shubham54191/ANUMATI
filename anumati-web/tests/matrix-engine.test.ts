import { describe, expect, it } from "vitest";
import {
  advanceDay,
  decide,
  derive,
  dispatch,
  finalise,
  reEvaluate,
  sendForRevision,
  tieBreakerDecision,
} from "@/lib/matrix/engine";
import { seedApplications } from "@/lib/matrix/applications";
import { MATRIX_RULES, RULE_LIST } from "@/lib/matrix/rules";
import type { ApplicationFile } from "@/types/matrix";

const file = (id: string): ApplicationFile => seedApplications().find((a) => a.id === id)!;
const veto = () => file("APP-2026-0148");
const escalation = () => file("APP-2026-0151");
const risk = () => file("APP-2026-0155");

/** Commit the file's scripted clash: both decisions, one timestamp. */
function clash(app: ApplicationFile): ApplicationFile {
  return decide(app, [
    { dept_id: app.demo.approver_dept, state: "approved", remarks: app.demo.approver_note, score: app.demo.approver_score },
    { dept_id: app.demo.rejecter_dept, state: "rejected", remarks: app.demo.rejection_reason, score: app.demo.rejecter_score },
  ]);
}

describe("decision matrix rows", () => {
  it("cites an instrument and a clause for every row", () => {
    for (const r of RULE_LIST) {
      expect(r.authority, r.id).toBeTruthy();
      expect(r.authority_section, r.id).toBeTruthy();
    }
  });

  it("says of every row whether it is in force or drafted for the pilot", () => {
    for (const r of RULE_LIST) {
      expect(["enacted", "draft"], r.id).toContain(r.authority_status);
    }
  });

  it("explains itself wherever a row is only a draft", () => {
    for (const r of RULE_LIST) {
      if (r.authority_status === "draft") expect(r.authority_note, r.id).toBeTruthy();
    }
  });

  it("sends an equal-authority deadlock to the Empowered Committee under the Act", () => {
    const rule = MATRIX_RULES["MX-ESCALATE-EQUAL"];
    expect(rule.authority).toMatch(/Facilitation Act, 2023/);
    expect(rule.tie_breaker?.chair).toMatch(/Development Commissioner/);
  });
});

describe("parallel dispatch", () => {
  it("starts every department at once, not one behind another", () => {
    const app = dispatch(veto());
    expect(app.reviews.every((r) => r.state === "in_review")).toBe(true);
    expect(app.day).toBe(0);
  });
});

describe("conflict detection", () => {
  it("sees no conflict while one desk has merely approved", () => {
    const app = decide(dispatch(veto()), [{ dept_id: "midc", state: "approved" }]);
    expect(derive(app).conflict).toBe(false);
  });

  it("detects a conflict the moment an approval and a rejection coexist", () => {
    const d = derive(clash(dispatch(veto())));
    expect(d.conflict).toBe(true);
    expect(d.rejected.map((r) => r.dept_short)).toContain("MPCB");
  });

  it("marks decisions committed on one timestamp as simultaneous", () => {
    expect(derive(clash(dispatch(veto()))).simultaneous).toBe(true);
  });

  it("does not call a clash simultaneous when the decisions were days apart", () => {
    let app = decide(dispatch(veto()), [{ dept_id: "midc", state: "approved" }]);
    app = advanceDay(app, 3);
    app = decide(app, [{ dept_id: "mpcb", state: "rejected", remarks: "…" }]);
    const d = derive(app);
    expect(d.conflict).toBe(true);
    expect(d.simultaneous).toBe(false);
  });

  it("never enables the master action while a rejection is open", () => {
    expect(derive(clash(dispatch(veto()))).canFinalise).toBe(false);
  });

  it("clears the conflict when the objecting department withdraws its own refusal", () => {
    const app = reEvaluate(clash(dispatch(veto())), "mpcb", "Revised ETP design accepted.");
    const d = derive(app);
    expect(d.conflict).toBe(false);
    expect(app.reviews.find((r) => r.dept_id === "mpcb")?.state).toBe("in_review");
  });
});

describe("what the matrix does on its own", () => {
  it("routes an equal-authority deadlock to the Committee with nobody pressing anything", () => {
    const app = clash(escalation());
    expect(app.tie_breaker_open).toBe(true);
    expect(derive(app).verdict).toBe("awaiting_tie_breaker");
  });

  it("does not route a veto-rule conflict to a panel — it halts instead", () => {
    const app = clash(dispatch(veto()));
    expect(app.tie_breaker_open).toBe(false);
    expect(derive(app).verdict).toBe("conflict_halted");
  });

  it("fails a scored phase by itself once every desk has reported under the threshold", () => {
    let app = clash(risk());
    expect(app.resolution).toBeNull();
    app = decide(app, [
      { dept_id: "dish", state: "approved", score: 70 },
      { dept_id: "mpcb", state: "approved", score: 60 },
    ]);
    expect(app.resolution?.kind).toBe("failed_score");
  });

  it("leaves a scored phase alone when the consolidated score clears the bar", () => {
    let app = decide(risk(), [
      { dept_id: "msedcl", state: "approved", score: 90 },
      { dept_id: "ceig-mh", state: "approved", score: 85 },
    ]);
    app = decide(app, [
      { dept_id: "dish", state: "approved", score: 80 },
      { dept_id: "mpcb", state: "approved", score: 80 },
    ]);
    expect(app.resolution).toBeNull();
    expect(derive(app).weighted?.pass).toBe(true);
  });
});

describe("the clock, and what a missed limit actually does", () => {
  it("transfers a file to the Empowered Committee where the parent Act has no deeming clause", () => {
    // FIRE has a 21-day limit and no deeming clause in its own Act.
    const app = advanceDay(dispatch(veto()), 22);
    const fire = app.reviews.find((r) => r.dept_id === "mfs")!;
    expect(fire.state).toBe("transferred_to_committee");
    expect(fire.escalated_on_day).toBe(22);
    expect(app.events.some((e) => (e.authority ?? "").includes("s. 5"))).toBe(true);
  });

  it("deems a clearance granted only where the parent Act itself says so", () => {
    // MIDC building plan: MRTP s. 45(5), 60 days.
    const app = advanceDay(dispatch(veto()), 61);
    const plan = app.reviews.find((r) => r.dept_id === "midc")!;
    expect(plan.state).toBe("deemed_approved");
    expect(plan.remarks).toMatch(/MRTP/);
  });

  it("never attributes a deeming to the Right to Public Services Act", () => {
    const app = advanceDay(dispatch(veto()), 130);
    for (const e of app.events) {
      expect(e.authority ?? "").not.toMatch(/Right to Public Services/i);
    }
  });

  it("keeps a transferred lane open, because the Committee still has to decide it", () => {
    const app = advanceDay(dispatch(veto()), 22);
    const d = derive(app);
    expect(d.transferred.length).toBeGreaterThan(0);
    expect(d.pending.map((r) => r.dept_id)).toContain("mfs");
    expect(d.canFinalise).toBe(false);
  });

  it("stops the clock once the phase is settled", () => {
    const settled = sendForRevision(clash(dispatch(veto())));
    const later = advanceDay(settled, 30);
    expect(later.day).toBe(settled.day);
  });

  it("warns two days before a limit lapses", () => {
    const app = advanceDay(dispatch(veto()), 8); // LABOUR: 10-day limit
    expect(app.events.some((e) => e.kind === "sla_warning")).toBe(true);
  });
});

describe("resolution paths", () => {
  it("carries granted clearances forward when the file goes back for revision", () => {
    const app = sendForRevision(clash(dispatch(veto())));
    expect(app.resolution?.kind).toBe("sent_for_revision");
    if (app.resolution?.kind !== "sent_for_revision") throw new Error("unreachable");
    expect(app.resolution.packet.carried_forward.join(" ")).toMatch(/MIDC/);
    expect(app.resolution.packet.objections[0].dept_short).toBe("MPCB");
  });

  it("clears the phase when the Committee overrules the refusal", () => {
    const app = tieBreakerDecision(clash(escalation()), "overrule", "Empowered Committee", "Conditions imposed.");
    expect(app.resolution?.kind).toBe("overruled");
    expect(derive(app).rejected).toHaveLength(0);
  });

  it("returns the file when the Committee sustains the refusal", () => {
    const app = tieBreakerDecision(clash(escalation()), "sustain", "Empowered Committee", "Objection upheld.");
    expect(app.resolution?.kind).toBe("sustained");
  });

  it("refuses to finalise a phase that still has an open desk", () => {
    expect(finalise(dispatch(veto())).resolution).toBeNull();
  });

  it("finalises once every desk has cleared", () => {
    let app = dispatch(veto());
    for (const r of app.reviews) app = decide(app, [{ dept_id: r.dept_id, state: "approved" }]);
    app = finalise(app);
    expect(app.resolution?.kind).toBe("cleared");
  });
});

describe("the record", () => {
  it("writes every step to the audit trail", () => {
    const app = sendForRevision(clash(dispatch(veto())));
    const kinds = app.events.map((e) => e.kind);
    expect(kinds).toContain("dispatch");
    expect(kinds).toContain("decision");
    expect(kinds).toContain("conflict");
    expect(kinds).toContain("resolution");
  });

  it("never stores a verdict — derive recomputes it from the current facts", () => {
    const app = clash(dispatch(veto()));
    expect(derive(app)).toEqual(derive(app));
    expect(Object.keys(app)).not.toContain("verdict");
  });
});
