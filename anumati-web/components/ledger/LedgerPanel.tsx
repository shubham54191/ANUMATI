"use client";
import { useCallback, useEffect, useState } from "react";
import { FileSignature, Link2, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ApplicationFile } from "@/types/matrix";
import { api, ApiError } from "@/lib/api/client";
import type { LedgerRow, SignatureRow, SignResult, VerifyResult } from "@/lib/api/types";
import { useServerMeta } from "@/components/layout/ModeBadge";
import { useAuthStore } from "@/store/useAuthStore";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const short = (h: string | null | undefined, n = 10) => (h ? `${h.slice(0, n)}…` : "—");
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * The server's hash-chained record of a file, with the two checks anyone
 * should be able to run: does the chain still add up, and does each signature
 * still match the decision it signed.
 *
 * Signing is offered only to the officer whose department decided, and only
 * once per decision. In DSC_MODE=demo the server signs with a labelled test
 * key; in external mode the officer's DSC utility signs the payload and the
 * signature is pasted back for the server to verify.
 */
export function LedgerPanel({
  app,
  applicationId,
  compact = false,
  actions,
}: {
  /** Extra controls under the chain check — the Committee's anchor button. */
  actions?: React.ReactNode;
  app?: ApplicationFile;
  /** For an application with no clearance file yet (a draft). */
  applicationId?: string;
  compact?: boolean;
}) {
  const session = useAuthStore((s) => s.session);
  const meta = useServerMeta();
  const [rows, setRows] = useState<LedgerRow[] | null>(null);
  const [sigs, setSigs] = useState<SignatureRow[]>([]);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [external, setExternal] = useState<{ dept_id: string; payload: string; sha256: string } | null>(null);
  const [extSig, setExtSig] = useState("");
  const [extCert, setExtCert] = useState("");

  const id = app?.id ?? applicationId;
  // The whole ledger is for the Committee and the facilitation desk; everyone
  // else reads it one file at a time.
  const wholeLedger = session?.role === "committee" || session?.role === "admin" || session?.department_id === "single-window";
  const load = useCallback(async () => {
    if (!id && !wholeLedger) {
      setRows([]);
      return;
    }
    try {
      const q = id ? `?application_id=${encodeURIComponent(id)}&limit=100` : "?limit=100";
      const [l, s] = await Promise.all([
        api<{ data: LedgerRow[] }>(`/v1/ledger${q}`),
        id ? api<{ data: SignatureRow[] }>(`/v1/signatures?application_id=${encodeURIComponent(id)}`) : Promise.resolve({ data: [] }),
      ]);
      setRows(l.data);
      setSigs(s.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not read the ledger.");
      setRows([]);
    }
  }, [id, wholeLedger]);

  // Reload whenever the file changes — a new event means a new ledger row.
  const eventCount = app?.events.length ?? 0;
  useEffect(() => {
    void load();
  }, [load, eventCount]);

  const runVerify = async () => {
    setChecking(true);
    setError(null);
    try {
      setVerify(await api<VerifyResult>("/v1/ledger/verify"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Verification failed to run.");
    } finally {
      setChecking(false);
    }
  };

  const isOfficer = session?.role === "officer" || session?.role === "admin";
  const signable =
    app && isOfficer
      ? app.reviews.filter(
          (r) =>
            (r.state === "approved" || r.state === "rejected") &&
            (session?.role === "admin" || r.dept_id.split(":")[0] === session?.department_id) &&
            !sigs.some((s) => s.dept_id === r.dept_id && s.valid),
        )
      : [];

  const sign = async (deptId: string) => {
    if (!app) return;
    setSigning(deptId);
    setError(null);
    setNotice(null);
    try {
      if (meta?.dsc_mode === "demo") {
        const r = await api<SignResult>("/v1/sign", { method: "POST", body: { application_id: app.id, dept_id: deptId } });
        setNotice(r.warning ?? `Signed · ${short(r.document_sha256, 16)}`);
        await load();
      } else {
        const p = await api<{ payload: string; sha256: string }>(
          `/v1/sign/payload?application_id=${encodeURIComponent(app.id)}&dept_id=${encodeURIComponent(deptId)}`,
        );
        setExternal({ dept_id: deptId, ...p });
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Signing failed.");
    } finally {
      setSigning(null);
    }
  };

  const submitExternal = async () => {
    if (!app || !external) return;
    setSigning(external.dept_id);
    setError(null);
    try {
      await api<SignResult>("/v1/sign/record", {
        method: "POST",
        body: { application_id: app.id, dept_id: external.dept_id, signature_b64: extSig.trim(), certificate_pem: extCert.trim() },
      });
      setExternal(null);
      setExtSig("");
      setExtCert("");
      setNotice("Signature verified against the certificate and recorded.");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "The signature was not accepted.");
    } finally {
      setSigning(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Chain check */}
      <div className="rounded-xl border border-db-line bg-db-bg px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Link2 className="h-3.5 w-3.5 text-db-blue" strokeWidth={1.8} />
          <span className="text-[12px] font-semibold text-db-ink">Decision ledger</span>
          <div className="flex-1" />
          <button
            onClick={runVerify}
            disabled={checking}
            className="flex h-7 items-center gap-1.5 rounded-lg border border-db-line bg-surface px-2.5 text-[11.5px] font-medium text-db-ink hover:border-db-blue/50 disabled:opacity-50"
          >
            {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" strokeWidth={1.8} />}
            Verify chain
          </button>
        </div>
        {verify ? (
          <p
            className={cn(
              "mt-2 flex items-start gap-1.5 text-[11.5px] leading-snug",
              verify.ok ? "text-db-green" : "text-db-red",
            )}
          >
            {verify.ok ? <ShieldCheck className="mt-px h-3.5 w-3.5 flex-none" /> : <ShieldAlert className="mt-px h-3.5 w-3.5 flex-none" />}
            {verify.ok
              ? `Intact — ${verify.checked} rows recomputed, head #${verify.head?.seq ?? 0} ${short(verify.head?.hash)}${
                  verify.anchors.length ? `, ${verify.anchors.length} daily anchor(s) match` : ""
                }.`
              : verify.first_break
                ? `Broken at row #${verify.first_break.seq} (${verify.first_break.reason.replace(/_/g, " ")}). Everything after it is untrusted.`
                : `Chain intact but an anchor no longer matches: ${verify.anchors.filter((a) => !a.ok).map((a) => a.day).join(", ")}.`}
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] leading-snug text-db-muted">
            Every row carries the hash of the one before it. Verifying recomputes the whole chain on the server.
          </p>
        )}
        {actions}
      </div>

      {/* Signing */}
      {app && (signable.length > 0 || sigs.length > 0) ? (
        <div className="rounded-xl border border-db-line px-3 py-2.5">
          <div className="mb-1.5 flex items-center gap-2">
            <FileSignature className="h-3.5 w-3.5 text-db-blue" strokeWidth={1.8} />
            <Label>Signatures</Label>
            {meta?.dsc_mode === "demo" ? (
              <span className="rounded bg-db-amber-tint px-1.5 text-[9.5px] font-semibold text-db-amber">DEMO KEY · NOT A DSC</span>
            ) : null}
          </div>
          {sigs.map((s) => (
            <div key={s.id} className="flex items-center gap-2 py-1 text-[11.5px]">
              <span className={cn("h-1.5 w-1.5 flex-none rounded-full", s.valid ? "bg-db-green" : "bg-db-red")} />
              <span className="font-mono text-[10.5px] text-db-ink">{s.approval_id}</span>
              <span className="truncate text-db-muted">{s.certificate}</span>
              <div className="flex-1" />
              <span className={cn("text-[10.5px] font-semibold", s.valid ? "text-db-green" : "text-db-red")}>
                {s.valid ? "verifies" : "DOES NOT VERIFY"}
              </span>
            </div>
          ))}
          {signable.map((r) => (
            <button
              key={r.dept_id}
              onClick={() => sign(r.dept_id)}
              disabled={signing !== null}
              className="mt-1.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-db-blue text-[12px] font-semibold text-white hover:brightness-95 disabled:opacity-50"
            >
              {signing === r.dept_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSignature className="h-3.5 w-3.5" strokeWidth={1.8} />}
              Sign {r.dept_short}&apos;s {r.state} decision on {r.approval_id}
            </button>
          ))}
          {external ? (
            <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-db-line bg-db-bg p-2">
              <p className="text-[11px] leading-snug text-db-muted">
                Sign this payload with your DSC utility (SHA-256), then paste the signature and your certificate. SHA-256 of
                the payload: <span className="font-mono text-db-ink">{short(external.sha256, 24)}</span>
              </p>
              <textarea
                readOnly
                value={external.payload}
                rows={2}
                aria-label="Payload to sign"
                className="rounded border border-db-line bg-surface p-1.5 font-mono text-[10px] text-db-ink"
              />
              <textarea
                value={extSig}
                onChange={(e) => setExtSig(e.target.value)}
                rows={2}
                placeholder="Signature (base64)"
                aria-label="Signature in base64"
                className="rounded border border-db-line bg-surface p-1.5 font-mono text-[10px]"
              />
              <textarea
                value={extCert}
                onChange={(e) => setExtCert(e.target.value)}
                rows={3}
                placeholder="-----BEGIN CERTIFICATE-----"
                aria-label="Certificate PEM"
                className="rounded border border-db-line bg-surface p-1.5 font-mono text-[10px]"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={submitExternal}
                  disabled={!extSig.trim() || !extCert.trim() || signing !== null}
                  className="h-7 flex-1 rounded-lg bg-db-blue text-[11.5px] font-semibold text-white disabled:opacity-50"
                >
                  Verify and record
                </button>
                <button onClick={() => setExternal(null)} className="h-7 rounded-lg border border-db-line px-2.5 text-[11.5px]">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {notice ? <p className="text-[11.5px] leading-snug text-db-amber">{notice}</p> : null}
      {error ? <p className="text-[11.5px] leading-snug text-db-red">{error}</p> : null}

      {/* Rows */}
      {!compact ? (
        <div className="flex max-h-[560px] flex-col overflow-y-auto">
          {rows === null ? (
            <span className="flex items-center gap-1.5 text-[11.5px] text-db-muted">
              <Loader2 className="h-3 w-3 animate-spin" /> Reading the ledger…
            </span>
          ) : rows.length === 0 ? (
            <p className="text-[11.5px] text-db-muted">No ledger rows yet.</p>
          ) : (
            rows.map((r) => (
              <div key={r.seq} className="border-b border-db-line py-1.5 last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-db-faint">#{r.seq}</span>
                  <span className="text-[11.5px] font-medium text-db-ink">{r.kind}</span>
                  {r.approval_id ? <span className="font-mono text-[10px] text-db-muted">{r.approval_id}</span> : null}
                  <div className="flex-1" />
                  <span className="text-[10.5px] text-db-faint">{when(r.at)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-db-muted">
                  <span>{r.actor}</span>
                  {!id && r.application_id ? <span className="font-mono">{r.application_id}</span> : null}
                  <div className="flex-1" />
                  <span className="font-mono text-db-faint" title={r.row_hash}>
                    {short(r.row_hash, 12)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
