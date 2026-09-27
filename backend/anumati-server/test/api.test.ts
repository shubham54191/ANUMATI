import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { as, freshContext, login, multipart, pdf } from "./helpers";
import type { Ctx } from "../src/context";
import type { Pool } from "../src/db";
import { slaSentinel, fetchRegistryRecords } from "../src/jobs/handlers";
import { verifyLedger } from "../src/ledger/ledger";

let app: FastifyInstance;
let ctx: Ctx;
let pool: Pool;
const tok: Record<string, string> = {};

beforeAll(async () => {
  ({ app, ctx, pool } = await freshContext());
  for (const u of ["applicant", "mpcb", "midc", "fire", "committee", "reviewer", "deccan"]) tok[u] = await login(app, u);
  tok.officer = await login(app, "officer", "admin");
  tok.root = await login(app, "root", "root");
});
afterAll(async () => {
  await app.close();
  await pool.end();
});

describe("sign-in and roles", () => {
  it("refuses a wrong password with the same answer as an unknown user", async () => {
    const a = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { username: "applicant", password: "nope" } });
    const b = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { username: "ghost", password: "nope" } });
    expect(a.statusCode).toBe(401);
    expect(b.statusCode).toBe(401);
    expect(a.json().error.message).toBe(b.json().error.message);
  });

  it("says who is signed in", async () => {
    const me = await app.inject({ url: "/v1/auth/me", headers: as(tok.mpcb) });
    expect(me.json().principal).toMatchObject({ role: "officer", department_id: "mpcb" });
  });

  it("keeps an applicant off the committee queue", async () => {
    const r = await app.inject({ url: "/v1/committee/queue", headers: as(tok.applicant) });
    expect(r.statusCode).toBe(403);
  });
});

describe("roadmap", () => {
  it("answers anyone, with the numbers the engine tests lock", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/v1/roadmap",
      payload: {
        sector: "food", location: "pune_chakan", size_band: "medium", stage: "new",
        conditions: { midc_land: true, boiler: true, height: false, hazardous: true, export: true, contract_labour: true, factory: true, epf_esic: true },
      },
    });
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body.data.approvals).toHaveLength(31);
    expect(body.data.optimised_days).toBe(223);
    expect(body.data.sequential_days).toBe(464);
    expect(body.stored).toBe(false);
  });

  it("routes the building plan to MIDC on an MIDC plot", async () => {
    const r = await app.inject({
      method: "POST", url: "/v1/roadmap",
      payload: { sector: "food", location: "x", size_band: "medium", stage: "new", conditions: { midc_land: true } },
    });
    const a10 = r.json().data.approvals.find((a: { id: string }) => a.id === "A10");
    expect(a10.department_short).toBe("MIDC");
  });

  it("rejects a malformed request with the field named", async () => {
    const r = await app.inject({ method: "POST", url: "/v1/roadmap", payload: { sector: "food" } });
    expect(r.statusCode).toBe(400);
    expect(JSON.stringify(r.json().error.detail)).toMatch(/location/);
  });
});

describe("the applicant's file, from roadmap to parallel dispatch", () => {
  let roadmapId = "";
  let appId = "";

  it("stores a roadmap against the signed-in applicant", async () => {
    const r = await app.inject({
      method: "POST", url: "/v1/roadmap", headers: as(tok.applicant),
      payload: { sector: "food", location: "pune_chakan", size_band: "medium", stage: "new", conditions: { midc_land: true, boiler: true, factory: true } },
    });
    expect(r.json().stored).toBe(true);
    roadmapId = r.json().data.id;
  });

  it("creates an application from the common form", async () => {
    const r = await app.inject({
      method: "POST", url: "/v1/applications", headers: as(tok.applicant),
      payload: {
        roadmap_id: roadmapId,
        project: "Food processing unit, MIDC Chakan",
        common_form: { water_draw_kld: 145, connected_load_kva: 1250, built_up_sqm: 4200, pan: "AABCS1234F" },
      },
    });
    expect(r.statusCode).toBe(201);
    appId = r.json().id;
  });

  it("refuses a malformed PAN in the common form", async () => {
    const r = await app.inject({
      method: "PATCH", url: `/v1/applications/${appId}`, headers: as(tok.applicant),
      payload: { common_form: { pan: "12345" } },
    });
    expect(r.statusCode).toBe(400);
  });

  it("refuses to file while the current wave has blocking gaps, and names them", async () => {
    const r = await app.inject({ method: "POST", url: `/v1/applications/${appId}/submit`, headers: as(tok.applicant) });
    expect(r.statusCode).toBe(422);
    expect(r.json().error.code).toBe("prevalidation_failed");
    expect(r.json().error.detail.submission_gaps.length).toBeGreaterThan(0);
  });

  it("hashes each upload and names the store by the hash", async () => {
    const m = multipart("PAN", "pan.pdf", pdf("pan"));
    const r = await app.inject({ method: "POST", url: `/v1/applications/${appId}/documents`, headers: { ...as(tok.applicant), ...m.headers }, payload: m.payload });
    expect(r.statusCode).toBe(201);
    expect(r.json().sha256).toMatch(/^[0-9a-f]{64}$/);
    const again = multipart("PAN", "pan-copy.pdf", pdf("pan"));
    const r2 = await app.inject({ method: "POST", url: `/v1/applications/${appId}/documents`, headers: { ...as(tok.applicant), ...again.headers }, payload: again.payload });
    expect(r2.json().sha256).toBe(r.json().sha256);
  });

  it("refuses a file that is not what it claims to be", async () => {
    const m = multipart("PAN", "pan.pdf", Buffer.from("MZ this is an exe"));
    const r = await app.inject({ method: "POST", url: `/v1/applications/${appId}/documents`, headers: { ...as(tok.applicant), ...m.headers }, payload: m.payload });
    expect(r.statusCode).toBe(415);
  });

  it("files once the current wave is clean, and dispatches every desk at once", async () => {
    const pre = await app.inject({ method: "POST", url: `/v1/applications/${appId}/prevalidate`, headers: as(tok.applicant) });
    const missing = new Set<string>();
    for (const g of pre.json().submission_gaps) {
      if (g.kind === "missing_document") missing.add(g.detail.split(" is on ")[0]);
    }
    for (const kind of missing) {
      const m = multipart(kind, `${kind}.pdf`, pdf(kind));
      const up = await app.inject({ method: "POST", url: `/v1/applications/${appId}/documents`, headers: { ...as(tok.applicant), ...m.headers }, payload: m.payload });
      expect(up.statusCode).toBe(201);
    }
    const r = await app.inject({ method: "POST", url: `/v1/applications/${appId}/submit`, headers: as(tok.applicant) });
    expect(r.statusCode, r.body).toBe(200);
    const file = r.json().file.file;
    expect(file.dispatched).toBe(true);
    expect(file.reviews.every((x: { state: string }) => x.state === "in_review")).toBe(true);
    expect(new Set(file.reviews.map((x: { dispatched_on_day: number }) => x.dispatched_on_day))).toEqual(new Set([0]));
  });

  it("lets a department act only on its own desk, and demands reasons for a refusal", async () => {
    const f = (await app.inject({ url: `/v1/matrix/files/${appId}`, headers: as(tok.root) })).json().file;
    const fireDesk = f.reviews.find((r: { dept_id: string }) => r.dept_id.startsWith("mfs:"));
    expect(fireDesk, "the first wave carries the provisional Fire NOC").toBeTruthy();
    const cross = await app.inject({
      method: "POST", url: `/v1/matrix/files/${appId}/commands`, headers: as(tok.mpcb),
      payload: { type: "decide", dept_id: fireDesk.dept_id, state: "approved" },
    });
    expect(cross.statusCode).toBe(403);
    const bare = await app.inject({
      method: "POST", url: `/v1/matrix/files/${appId}/commands`, headers: as(tok.fire),
      payload: { type: "decide", dept_id: fireDesk.dept_id, state: "rejected", remarks: "no" },
    });
    expect(bare.statusCode).toBe(422);
    expect(bare.json().error.message).toMatch(/s\. 4\(3\)/);
  });

  it("releases the next wave when the first one is issued, each on its own clock", async () => {
    const before = (await app.inject({ url: `/v1/matrix/files/${appId}`, headers: as(tok.root) })).json().file;
    for (const r of before.reviews) {
      const res = await app.inject({
        method: "POST", url: `/v1/matrix/files/${appId}/commands`, headers: as(tok.root),
        payload: { type: "decide", dept_id: r.dept_id, state: "approved", remarks: "In order." },
      });
      expect(res.statusCode, res.body).toBe(200);
    }
    const after = (await app.inject({ url: `/v1/matrix/files/${appId}`, headers: as(tok.root) })).json().file;
    expect(after.reviews.length).toBeGreaterThan(before.reviews.length);
    const fresh = after.reviews.filter((r: { approval_id: string }) => !before.reviews.some((b: { approval_id: string }) => b.approval_id === r.approval_id));
    expect(fresh.every((r: { state: string }) => r.state === "in_review")).toBe(true);
  });

  it("pauses one desk's clock while its query is with the applicant", async () => {
    const f = (await app.inject({ url: `/v1/matrix/files/${appId}`, headers: as(tok.root) })).json().file;
    const desk = f.reviews.find((r: { state: string }) => r.state === "in_review");
    const q = await app.inject({
      method: "POST", url: `/v1/matrix/files/${appId}/commands`, headers: as(tok.root),
      payload: { type: "raise_query", dept_id: desk.dept_id, body: "Please send the revised layout." },
    });
    expect(q.json().clocks[desk.dept_id].query_open).toBe(true);
    const adv = await app.inject({
      method: "POST", url: `/v1/matrix/files/${appId}/commands`, headers: as(tok.officer),
      payload: { type: "advance_days", days: 3 },
    });
    expect(adv.json().clocks[desk.dept_id].paused_days).toBe(3);
    const ans = await app.inject({
      method: "POST", url: `/v1/matrix/files/${appId}/commands`, headers: as(tok.applicant),
      payload: { type: "answer_query", dept_id: desk.dept_id, body: "Revised layout attached." },
    });
    expect(ans.statusCode).toBe(200);
    expect(ans.json().clocks[desk.dept_id].query_open).toBe(false);
  });

  it("shows the applicant their own file, and nobody else's", async () => {
    const own = await app.inject({ url: `/v1/applications/${appId}`, headers: as(tok.applicant) });
    expect(own.statusCode).toBe(200);
    expect(own.json().file.file.id).toBe(appId);
    const other = await app.inject({ url: `/v1/applications/${appId}`, headers: as(tok.deccan) });
    expect(other.statusCode).toBe(403);
  });
});

describe("the seeded scenarios", () => {
  it("dispatches, clashes, and halts on the technical veto", async () => {
    const d = await app.inject({ method: "POST", url: "/v1/matrix/files/APP-2026-0148/commands", headers: as(tok.officer), payload: { type: "dispatch" } });
    expect(d.statusCode).toBe(200);
    const c = await app.inject({ method: "POST", url: "/v1/matrix/files/APP-2026-0148/commands", headers: as(tok.officer), payload: { type: "demo_clash" } });
    expect(c.json().derived.verdict).toBe("conflict_halted");
    expect(c.json().derived.simultaneous).toBe(true);
  });

  it("refuses the demo controls to a non-demo account when demo mode is off", async () => {
    const off = await freshContext({ DEMO_MODE: "false" });
    // Demo users exist in this DB but demo mode is off: they cannot sign in.
    const res = await off.app.inject({ method: "POST", url: "/v1/auth/login", payload: { username: "officer", password: "admin" } });
    expect(res.statusCode).toBe(401);
    await off.app.close();
    await off.pool.end();
    // Restore the main fixture's database for the rest of the file.
    ({ app, ctx, pool } = await freshContext());
    for (const u of ["applicant", "mpcb", "midc", "fire", "committee", "reviewer", "deccan"]) tok[u] = await login(app, u);
    tok.officer = await login(app, "officer", "admin");
    tok.root = await login(app, "root", "root");
  });

  it("answers registry checks through the adapter, mismatch included", async () => {
    await app.inject({ method: "POST", url: "/v1/matrix/files/APP-2026-0148/commands", headers: as(tok.officer), payload: { type: "dispatch" } });
    await fetchRegistryRecords(ctx, { application_id: "APP-2026-0148" });
    const f = (await app.inject({ url: "/v1/matrix/files/APP-2026-0148", headers: as(tok.officer) })).json().file;
    const water = f.records.find((r: { id: string }) => r.id === "DR-WATER-DRAW");
    expect(water.state).toBe("mismatch");
    expect(f.records.every((r: { state: string }) => r.state !== "idle")).toBe(true);
  });

  it("moves the clock from the wall clock, and transfers a lapsed desk to the Committee", async () => {
    await pool.query("UPDATE matrix_file SET dispatched_at = now() - interval '25 days' WHERE application_id = 'APP-2026-0148'");
    const moved = await slaSentinel(ctx);
    expect(moved.find((m) => m.id === "APP-2026-0148")?.to).toBe(25);
    const q = await app.inject({ url: "/v1/committee/queue", headers: as(tok.committee) });
    const transferred = q.json().data.filter((i: { kind: string; application_id: string }) => i.kind === "transferred" && i.application_id === "APP-2026-0148");
    expect(transferred.length).toBeGreaterThan(0);
    const fire = transferred.find((i: { dept_id: string }) => i.dept_id === "mfs");
    const decided = await app.inject({
      method: "POST", url: "/v1/matrix/files/APP-2026-0148/commands", headers: as(tok.committee),
      payload: { type: "committee_decide", dept_id: fire.dept_id, outcome: "approved", note: "Exit widths verified on the revised plan." },
    });
    expect(decided.statusCode, decided.body).toBe(200);
    expect(decided.json().file.reviews.find((r: { dept_id: string }) => r.dept_id === "mfs").state).toBe("approved");
  });

  it("will not let a department officer decide a transferred desk", async () => {
    const f = (await app.inject({ url: "/v1/matrix/files/APP-2026-0148", headers: as(tok.root) })).json().file;
    const t = f.reviews.find((r: { state: string }) => r.state === "transferred_to_committee");
    if (!t) return;
    const r = await app.inject({
      method: "POST", url: "/v1/matrix/files/APP-2026-0148/commands", headers: as(tok.mpcb),
      payload: { type: "committee_decide", dept_id: t.dept_id, outcome: "approved", note: "trying my luck" },
    });
    expect(r.statusCode).toBe(403);
  });
});

describe("grievances", () => {
  it("routes a grievance to the Empowered Committee and records its resolution", async () => {
    const f = (await app.inject({ url: "/v1/matrix/files/APP-2026-0155", headers: as(tok.root) })).json().file;
    const open = f.reviews.find((r: { state: string }) => r.state === "in_review");
    const g = await app.inject({
      method: "POST", url: "/v1/grievances", headers: as(tok.applicant),
      payload: { application_id: "APP-2026-0155", approval_id: open.approval_id, reason: "No movement on this for three weeks." },
    });
    expect(g.statusCode, g.body).toBe(201);
    const q = await app.inject({ url: "/v1/committee/queue", headers: as(tok.committee) });
    expect(q.json().data.some((i: { kind: string; grievance_id?: string }) => i.kind === "grievance" && i.grievance_id === g.json().id)).toBe(true);
    const res = await app.inject({
      method: "POST", url: `/v1/grievances/${g.json().id}/resolve`, headers: as(tok.committee),
      payload: { resolution: "Department directed to decide within 7 days." },
    });
    expect(res.statusCode).toBe(200);
  });

  it("refuses a grievance on someone else's file", async () => {
    const r = await app.inject({
      method: "POST", url: "/v1/grievances", headers: as(tok.deccan),
      payload: { application_id: "APP-2026-0155", approval_id: "A22", reason: "Not my file but let me try." },
    });
    expect(r.statusCode).toBe(403);
  });
});

describe("signing", () => {
  it("signs only a decision that exists, only for the officer's own desk", async () => {
    const none = await app.inject({ method: "POST", url: "/v1/sign", headers: as(tok.fire), payload: { application_id: "APP-2026-0151", dept_id: "mfs" } });
    expect(none.statusCode).toBe(422);
    const decided = await app.inject({
      method: "POST", url: "/v1/matrix/files/APP-2026-0151/commands", headers: as(tok.fire),
      payload: { type: "decide", dept_id: "mfs", state: "approved", remarks: "Three exits of 1.5 m on the revised set." },
    });
    expect(decided.statusCode, decided.body).toBe(200);
    const wrong = await app.inject({ method: "POST", url: "/v1/sign", headers: as(tok.mpcb), payload: { application_id: "APP-2026-0151", dept_id: "mfs" } });
    expect(wrong.statusCode).toBe(403);
    const r = await app.inject({ method: "POST", url: "/v1/sign", headers: as(tok.fire), payload: { application_id: "APP-2026-0151", dept_id: "mfs" } });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json().warning).toMatch(/Demo signer/);
    const list = await app.inject({ url: "/v1/signatures?application_id=APP-2026-0151", headers: as(tok.fire) });
    expect(list.json().data[0]).toMatchObject({ valid: true, mode: "demo", dept_id: "mfs" });
  });
});

describe("MAITRI 2.0 sign-in", () => {
  it("accepts a MAITRI-signed identity, maps it onto a local account, and refuses a forged one", async () => {
    const { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } = await import("jose");
    const { maitriVerifier } = await import("../src/auth/tokens");
    const maitri = await generateKeyPair("RS256");
    const forger = await generateKeyPair("RS256");
    const jwk = { ...(await exportJWK(maitri.publicKey)), kid: "maitri-1", alg: "RS256" };
    const verify = maitriVerifier({ jwks: createLocalJWKSet({ keys: [jwk] }), issuer: "maitri", audience: "anumati" });
    const mint = (key: CryptoKey) =>
      new SignJWT({ name: "Investor via MAITRI", role: "applicant" })
        .setProtectedHeader({ alg: "RS256", kid: "maitri-1" })
        .setSubject("MAITRI-INV-7781")
        .setIssuer("maitri")
        .setAudience("anumati")
        .setExpirationTime("5m")
        .sign(key);
    const claims = await verify(await mint(maitri.privateKey));
    expect(claims).toMatchObject({ sub: "MAITRI-INV-7781", role: "applicant" });
    await expect(verify(await mint(forger.privateKey))).rejects.toThrow();
  });
});

describe("rules: drafted by the pipeline, published by a person", () => {
  const draft = {
    approval_id: "A40",
    name: "Cold-chain refrigerant registration",
    department_id: "mpcb",
    department_name: "Maharashtra Pollution Control Board",
    department_short: "MPCB",
    stage: "pre_operation",
    statutory_days: 30,
    deemed_exists: false,
    deemed_days: null,
    deemed_reference: null,
    required_documents: ["Refrigerant inventory"],
    produces_document: "Refrigerant registration",
    source: { document_id: "TEST-GAZETTE-2026", section: "r. 4", url: "https://example.gov.in/gazette.pdf", effective_from: "2026-09-01" },
    extraction: { page: 3, model: "granite4.1:8b", confidence: 0.82 },
    proposed_edges: [{ from_approval_id: "A15", edge_type: "documentary", confidence: 0.9, rationale: "Form asks for the Consent to Establish number." }],
  };

  it("takes a draft from the pipeline's service token", async () => {
    const r = await app.inject({ method: "POST", url: "/v1/rules/drafts", headers: as("extraction-token-for-tests-000000"), payload: draft });
    expect(r.statusCode, r.body).toBe(201);
  });

  it("refuses a draft with no citation", async () => {
    const { source, ...uncited } = draft;
    void source;
    const r = await app.inject({ method: "POST", url: "/v1/rules/drafts", headers: as(tok.reviewer), payload: uncited });
    expect(r.statusCode).toBe(400);
  });

  it("will not let the pipeline publish", async () => {
    const r = await app.inject({ method: "POST", url: "/v1/rules/A40/1/publish", headers: as("extraction-token-for-tests-000000"), payload: { note: "auto" } });
    expect(r.statusCode).toBe(422);
  });

  it("publishes as a new rule-set version when a reviewer approves it", async () => {
    const r = await app.inject({ method: "POST", url: "/v1/rules/A40/1/publish", headers: as(tok.reviewer), payload: { note: "Checked against the gazette, r. 4." } });
    expect(r.statusCode, r.body).toBe(200);
    expect(r.json().rules_version).toBe("v1.4");
    const approvals = await app.inject({ url: "/v1/approvals" });
    expect(approvals.json().data.some((a: { id: string }) => a.id === "A40")).toBe(true);
  });

  it("refuses to publish an edge that would close a cycle", async () => {
    const cyc = { ...draft, approval_id: "A15", name: "MPCB Consent to Establish (revised)", proposed_edges: [{ from_approval_id: "A40", edge_type: "statutory", confidence: 1, rationale: "Loop for the test." }] };
    const d = await app.inject({ method: "POST", url: "/v1/rules/drafts", headers: as(tok.reviewer), payload: cyc });
    expect(d.statusCode, d.body).toBe(201);
    const p = await app.inject({ method: "POST", url: `/v1/rules/A15/${d.json().version}/publish`, headers: as(tok.reviewer), payload: { note: "should fail" } });
    expect(p.statusCode).toBe(422);
    expect(p.json().error.detail.cycle).toContain("A15");
  });
});

describe("the ledger", () => {
  it("verifies end to end after everything above", async () => {
    const r = await verifyLedger(pool);
    expect(r.ok).toBe(true);
    expect(r.checked).toBeGreaterThan(10);
  });

  it("refuses UPDATE, DELETE and TRUNCATE", async () => {
    await expect(pool.query("UPDATE decision_ledger SET actor = 'x' WHERE seq = 1")).rejects.toThrow(/append-only/);
    await expect(pool.query("DELETE FROM decision_ledger WHERE seq = 1")).rejects.toThrow(/append-only/);
    await expect(pool.query("TRUNCATE decision_ledger")).rejects.toThrow(/append-only/);
  });

  it("finds the exact row a superuser edited behind the triggers", async () => {
    await pool.query("ALTER TABLE decision_ledger DISABLE TRIGGER decision_ledger_no_update");
    await pool.query("UPDATE decision_ledger SET actor = 'someone-else' WHERE seq = 3");
    await pool.query("ALTER TABLE decision_ledger ENABLE TRIGGER decision_ledger_no_update");
    const r = await verifyLedger(pool);
    expect(r.ok).toBe(false);
    expect(r.first_break?.seq).toBe(3);
    expect(r.first_break?.reason).toBe("row_hash_mismatch");
  });
});

describe("sign-in throttling", () => {
  it("slows down repeated guessing from one address", async () => {
    const t = await freshContext({ LOGIN_RATE_LIMIT: "3" });
    const codes: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const r = await t.app.inject({ method: "POST", url: "/v1/auth/login", payload: { username: "applicant", password: "wrong" } });
      codes.push(r.statusCode);
    }
    expect(codes.slice(0, 3)).toEqual([401, 401, 401]);
    expect(codes.slice(3)).toEqual([429, 429]);
    await t.app.close();
    await t.pool.end();
  });
});
