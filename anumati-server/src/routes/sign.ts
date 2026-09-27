import type { FastifyInstance } from "fastify";
import { createHash, createPrivateKey, createPublicKey, hkdfSync, sign as edSign, verify, X509Certificate, type KeyObject } from "node:crypto";
import { z } from "zod";
import type { Ctx } from "../context";
import { departmentOf, need, needRole } from "../auth/guard";
import { tx } from "../db";
import { forbidden, notFound, unprocessable } from "../errors";
import { appendLedger } from "../ledger/ledger";
import { canonicalJson } from "../ledger/ledger";
import { loadFile } from "../matrix/store";
import type { ApplicationFile } from "@/types/matrix";

/**
 * What an officer signs is the decision itself, in canonical form — file,
 * approval, desk, outcome, reasons and time. Its SHA-256 is what the DSC
 * signs; the same bytes can be rebuilt from the file by anyone, later.
 */
function decisionPayload(file: ApplicationFile, deptId: string) {
  const r = file.reviews.find((x) => x.dept_id === deptId);
  if (!r) throw notFound(`Desk ${deptId}`);
  if (!["approved", "rejected"].includes(r.state) || !r.decided_at) {
    throw unprocessable(`${r.dept_short} has not decided ${r.approval_id} yet — there is nothing to sign.`);
  }
  const payload = canonicalJson({
    scheme: "ANUMATI-DECISION-1",
    application_id: file.id,
    approval_id: r.approval_id,
    desk: r.dept_id,
    department: r.dept_short,
    decision: r.state,
    remarks: r.remarks ?? "",
    decided_at: r.decided_at,
  });
  return { payload, sha256: createHash("sha256").update(payload).digest("hex"), review: r };
}

/**
 * The demo signer: an Ed25519 key derived from the server secret, so it is
 * stable across restarts and verifiable. It exists only in DSC_MODE=demo,
 * which configuration refuses in production. It stands in for the officer's
 * DSC so the flow can be shown; it is labelled as such everywhere it appears.
 */
function demoKey(secret: string): { priv: KeyObject; pub: KeyObject; fingerprint: string } {
  const seed = Buffer.from(hkdfSync("sha256", secret, "anumati", "demo-dsc-ed25519", 32));
  const der = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]);
  const priv = createPrivateKey({ key: der, format: "der", type: "pkcs8" });
  const pub = createPublicKey(priv);
  const fingerprint = createHash("sha256").update(pub.export({ format: "der", type: "spki" })).digest("hex").slice(0, 32);
  return { priv, pub, fingerprint };
}

export async function signRoutes(app: FastifyInstance, ctx: Ctx) {
  const Target = z.object({ application_id: z.string(), dept_id: z.string() });

  async function ownDecision(p: ReturnType<typeof need>, applicationId: string, deptId: string) {
    if (p.role !== "admin" && !(p.role === "officer" && departmentOf(deptId) === p.department_id)) {
      throw forbidden("An officer signs only their own department's decision.");
    }
    const f = await loadFile(ctx.pool, applicationId);
    return decisionPayload(f.state, deptId);
  }

  /** What to sign — for the officer's DSC utility in external mode. */
  app.get("/v1/sign/payload", async (req) => {
    const p = needRole(req, "officer");
    const q = Target.parse(req.query);
    const d = await ownDecision(p, q.application_id, q.dept_id);
    return { payload: d.payload, sha256: d.sha256, mode: ctx.cfg.DSC_MODE };
  });

  async function record(
    p: ReturnType<typeof need>,
    q: z.infer<typeof Target>,
    d: Awaited<ReturnType<typeof ownDecision>>,
    sig: { mode: "demo" | "dsc"; algorithm: string; subject: string; serial: string; signature_b64: string; cert_pem: string | null },
  ) {
    return tx(ctx.pool, async (c) => {
      const res = await c.query(
        `INSERT INTO signature (application_id, approval_id, dept_id, document_sha256, officer_id, mode, algorithm,
            cert_subject, cert_serial, signature_b64, cert_pem, signed_payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id, signed_at`,
        [q.application_id, d.review.approval_id, q.dept_id, d.sha256, p.id, sig.mode, sig.algorithm, sig.subject, sig.serial, sig.signature_b64, sig.cert_pem, d.payload],
      );
      const a = await c.query("SELECT rules_version, engine_version FROM application WHERE id = $1", [q.application_id]);
      await appendLedger(c, {
        actor: p.username,
        actor_id: p.id,
        kind: "decision.signed",
        application_id: q.application_id,
        approval_id: d.review.approval_id,
        inputs: { desk: q.dept_id, mode: sig.mode, algorithm: sig.algorithm },
        outputs: { certificate: sig.subject, serial: sig.serial },
        rules_version: a.rows[0].rules_version,
        engine_version: a.rows[0].engine_version,
        document_sha256: d.sha256,
        signature_ref: res.rows[0].id,
      });
      return {
        signature_id: res.rows[0].id as string,
        signed_at: res.rows[0].signed_at,
        document_sha256: d.sha256,
        mode: sig.mode,
        certificate: sig.subject,
        warning:
          sig.mode === "demo"
            ? "Demo signer — this build holds a test key. In deployment the officer's own DSC signs and the server only verifies."
            : null,
      };
    });
  }

  app.post("/v1/sign", async (req, reply) => {
    const p = needRole(req, "officer");
    if (ctx.cfg.DSC_MODE !== "demo") {
      throw unprocessable("This server does not sign. Sign the payload with your DSC and post it to /v1/sign/record.");
    }
    const q = Target.parse(req.body);
    const d = await ownDecision(p, q.application_id, q.dept_id);
    const key = demoKey(ctx.cfg.JWT_SECRET);
    const signature = edSign(null, Buffer.from(d.payload), key.priv).toString("base64");
    reply.status(201);
    return record(p, q, d, {
      mode: "demo",
      algorithm: "Ed25519",
      subject: "CN=ANUMATI DEMO SIGNER (not a DSC)",
      serial: key.fingerprint,
      signature_b64: signature,
      cert_pem: key.pub.export({ format: "pem", type: "spki" }).toString(),
    });
  });

  /**
   * External mode: the officer's DSC utility signed `payload` (SHA-256 with
   * the certificate's key). We check the signature against the certificate
   * and the certificate's validity dates, and record both. Chain validation
   * against the Controller of Certifying Authorities root is the deployment's
   * trust store, configured outside this service.
   */
  app.post("/v1/sign/record", async (req, reply) => {
    const p = needRole(req, "officer");
    const body = Target.extend({
      signature_b64: z.string().min(40).max(20_000),
      certificate_pem: z.string().includes("BEGIN CERTIFICATE").max(20_000),
    }).parse(req.body);
    const d = await ownDecision(p, body.application_id, body.dept_id);
    let cert: X509Certificate;
    try {
      cert = new X509Certificate(body.certificate_pem);
    } catch {
      throw unprocessable("That is not a readable X.509 certificate.");
    }
    const now = Date.now();
    if (now < Date.parse(cert.validFrom) || now > Date.parse(cert.validTo)) {
      throw unprocessable(`The certificate is not valid today (valid ${cert.validFrom} to ${cert.validTo}).`);
    }
    const ok = verify("sha256", Buffer.from(d.payload), cert.publicKey, Buffer.from(body.signature_b64, "base64"));
    if (!ok) throw unprocessable("The signature does not match this decision and certificate.");
    reply.status(201);
    return record(p, body, d, {
      mode: "dsc",
      algorithm: `${cert.publicKey.asymmetricKeyType?.toUpperCase()}-SHA256`,
      subject: cert.subject.replace(/\n/g, ", "),
      serial: cert.serialNumber,
      signature_b64: body.signature_b64,
      cert_pem: body.certificate_pem,
    });
  });

  /** Every signature on a file, re-verified now against its stored key. */
  app.get("/v1/signatures", async (req) => {
    need(req);
    const { application_id } = z.object({ application_id: z.string() }).parse(req.query);
    const { rows } = await ctx.pool.query(
      "SELECT * FROM signature WHERE application_id = $1 ORDER BY signed_at DESC",
      [application_id],
    );
    return {
      data: rows.map((s) => {
        let valid = false;
        try {
          const key = s.mode === "demo" ? createPublicKey(s.cert_pem) : new X509Certificate(s.cert_pem).publicKey;
          valid = verify(s.mode === "demo" ? null : "sha256", Buffer.from(s.signed_payload), key, Buffer.from(s.signature_b64, "base64"));
        } catch {
          valid = false;
        }
        return {
          id: s.id,
          approval_id: s.approval_id,
          dept_id: s.dept_id,
          mode: s.mode,
          algorithm: s.algorithm,
          certificate: s.cert_subject,
          serial: s.cert_serial,
          document_sha256: s.document_sha256,
          signed_at: s.signed_at,
          valid,
        };
      }),
    };
  });
}
