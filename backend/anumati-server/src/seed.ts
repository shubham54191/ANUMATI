import type { Pool } from "./db";
import { tx } from "./db";
import { hashPassword } from "./auth/passwords";
import { APPROVALS, DEPENDENCIES } from "./engine/bridge";
import { seedApplications } from "@/lib/matrix/applications";
import { derive } from "@/lib/matrix/engine";
import { appendLedger } from "./ledger/ledger";
import { project } from "./matrix/store";
import type { Config } from "./config";

/**
 * Demo accounts. Each department officer can act only on their own
 * department's desks; the facilitation officer dispatches and packages but
 * never decides a clearance. Seeded only when DEMO_MODE is on.
 */
export const DEMO_USERS: {
  username: string;
  password: string;
  role: "applicant" | "officer" | "committee" | "reviewer" | "admin";
  name: string;
  designation: string;
  office: string;
  department_id?: string;
}[] = [
  { username: "applicant", password: "demo", role: "applicant", name: "Sahyadri Agro Foods Pvt Ltd", designation: "Applicant", office: "MIDC Chakan, Pune" },
  { username: "deccan", password: "demo", role: "applicant", name: "Deccan Cold Storage LLP", designation: "Applicant", office: "MIDC Ranjangaon, Pune" },
  { username: "officer", password: "admin", role: "officer", name: "Demo Officer", designation: "Single-Window Facilitation Officer", office: "District Industries Centre, Pune", department_id: "single-window" },
  { username: "mpcb", password: "demo", role: "officer", name: "MPCB desk (demo)", designation: "Sub-Regional Officer", office: "MPCB, Pune", department_id: "mpcb" },
  { username: "midc", password: "demo", role: "officer", name: "MIDC desk (demo)", designation: "Regional Officer", office: "MIDC, Chakan", department_id: "midc" },
  { username: "fire", password: "demo", role: "officer", name: "Fire desk (demo)", designation: "Fire Officer", office: "Maharashtra Fire Services", department_id: "mfs" },
  { username: "dish", password: "demo", role: "officer", name: "DISH desk (demo)", designation: "Deputy Director", office: "Industrial Safety and Health, Pune", department_id: "dish" },
  { username: "msedcl", password: "demo", role: "officer", name: "MSEDCL desk (demo)", designation: "Executive Engineer", office: "MSEDCL, Pune", department_id: "msedcl" },
  { username: "ceig", password: "demo", role: "officer", name: "CEIG desk (demo)", designation: "Electrical Inspector", office: "CEIG, Pune", department_id: "ceig-mh" },
  { username: "labour", password: "demo", role: "officer", name: "Labour desk (demo)", designation: "Assistant Commissioner", office: "Labour Department, Pune", department_id: "labour-mh" },
  { username: "committee", password: "demo", role: "committee", name: "Empowered Committee (demo)", designation: "Development Commissioner (Industries) — chair", office: "MAITRI Act, 2023 — s. 6" },
  { username: "reviewer", password: "demo", role: "reviewer", name: "Rule reviewer (demo)", designation: "Legal cell", office: "Industries Department" },
];

const APPLICANT_BY_NAME: Record<string, string> = {
  "Sahyadri Agro Foods Pvt Ltd": "applicant",
  "Deccan Cold Storage LLP": "deccan",
};

/** The rule base: published version 1 of every seeded approval and edge. */
export async function seedRules(pool: Pool, cfg: Pick<Config, "RULES_VERSION" | "ENGINE_VERSION">) {
  await tx(pool, async (c) => {
    const exists = await c.query("SELECT 1 FROM rule_set LIMIT 1");
    if (exists.rowCount) return;

    const docs = new Map<string, string>();
    for (const a of APPROVALS) {
      docs.set(a.source.document_id, a.source.url);
      for (const v of a.authority_variants ?? []) docs.set(v.source.document_id, v.source.url);
    }
    for (const d of DEPENDENCIES) docs.set(d.source.document_id, d.source.url);
    for (const [id, url] of docs) {
      await c.query(
        "INSERT INTO source_document (id, title, url) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
        [id, id.replace(/-/g, " "), url || "https://maitri.maharashtra.gov.in"],
      );
    }
    await c.query(
      "INSERT INTO rule_set (version, note, is_current) VALUES ($1, 'Seeded from the published rule base', true)",
      [cfg.RULES_VERSION],
    );
    for (const a of APPROVALS) {
      await c.query(
        `INSERT INTO approval_version
          (approval_id, version, name, department_id, statutory_days, deemed_exists, deemed_days,
           deemed_reference, body, source_document_id, section, valid_from, review_status)
         VALUES ($1,1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          a.id, a.name, a.department_id, a.statutory_days, a.deemed_exists, a.deemed_days,
          a.deemed_reference, JSON.stringify(a), a.source.document_id, a.source.section,
          a.source.effective_from, a.review_status === "published" ? "published" : "draft",
        ],
      );
    }
    for (const d of DEPENDENCIES) {
      await c.query(
        `INSERT INTO dependency_version
           (from_approval, to_approval, edge_type, confidence, rationale, body, review_status, valid_from)
         VALUES ($1,$2,$3,$4,$5,$6,'published','2024-04-01')`,
        [d.from_approval_id, d.to_approval_id, d.edge_type, d.confidence, d.rationale, JSON.stringify(d)],
      );
    }
    await appendLedger(c, {
      actor: "seed",
      kind: "rules_published",
      inputs: { source: "anumati-web/lib/data/maharashtraFood.ts" },
      outputs: { approvals: APPROVALS.length, dependencies: DEPENDENCIES.length, version: cfg.RULES_VERSION },
      rules_version: cfg.RULES_VERSION,
      engine_version: cfg.ENGINE_VERSION,
    });
  });
}

export async function seedDemo(pool: Pool, cfg: Pick<Config, "RULES_VERSION" | "ENGINE_VERSION">) {
  const users = new Map<string, string>();
  for (const u of DEMO_USERS) {
    const hash = await hashPassword(u.password);
    const res = await pool.query(
      `INSERT INTO app_user (username, password_hash, role, name, designation, office, department_id, is_demo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true)
       ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
       RETURNING id`,
      [u.username, hash, u.role, u.name, u.designation, u.office, u.department_id ?? null],
    );
    users.set(u.username, res.rows[0].id);
  }

  for (const file of seedApplications()) {
    await tx(pool, async (c) => {
      const exists = await c.query("SELECT 1 FROM application WHERE id = $1", [file.id]);
      if (exists.rowCount) return;
      const owner = users.get(APPLICANT_BY_NAME[file.applicant] ?? "applicant") ?? null;
      await c.query(
        `INSERT INTO application
           (id, owner_id, applicant_name, project, sector, location, status, rules_version, engine_version, filed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          file.id, owner, file.applicant, file.project, file.sector, file.location,
          file.dispatched ? "in_clearance" : "submitted", cfg.RULES_VERSION, cfg.ENGINE_VERSION, file.filed_on,
        ],
      );
      // A file that is already N days into its clearance was dispatched N days ago.
      const dispatchedAt = file.dispatched ? new Date(Date.now() - file.day * 86_400_000) : null;
      await c.query(
        `INSERT INTO matrix_file (application_id, state, version, dispatched_at, settled)
         VALUES ($1,$2,1,$3,$4)`,
        [file.id, JSON.stringify(file), dispatchedAt, derive(file).verdict === "settled"],
      );
      await project(c, null, file, "seed");
      await appendLedger(c, {
        actor: "seed",
        kind: "file_seeded",
        application_id: file.id,
        inputs: { scenario: file.rule.id },
        outputs: { reviews: file.reviews.map((r) => ({ dept: r.dept_short, approval: r.approval_id, state: r.state })) },
        rules_version: cfg.RULES_VERSION,
        engine_version: cfg.ENGINE_VERSION,
      });
    });
  }
  return users;
}
