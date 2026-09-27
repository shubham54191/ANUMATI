"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { errorLine } from "@/lib/api/explain";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileUp,
  Hourglass,
  Loader2,
  MessageSquareWarning,
  Scale,
  Send,
  ShieldCheck,
} from "lucide-react";
import { api, ApiError, subscribe } from "@/lib/api/client";
import {
  sha256Hex,
  type ApplicationDetail,
  type CommonForm,
  type SubmissionGap,
} from "@/lib/api/applications";
import type { FileView } from "@/store/useMatrixStore";
import type { DeptReview } from "@/types/matrix";
import { REVIEW_META, reviewStatus } from "@/lib/matrix/display";
import { derive, isOpen } from "@/lib/matrix/engine";
import { AppShell } from "@/components/layout/AppShell";
import { LedgerPanel } from "@/components/ledger/LedgerPanel";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { LOCATIONS } from "@/lib/constants/locations";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-db-bg text-db-muted border-db-line",
  submitted: "bg-db-blue-tint text-db-blue border-db-blue/30",
  in_clearance: "bg-db-blue-tint text-db-blue border-db-blue/30",
  returned: "bg-db-amber-tint text-db-amber border-db-amber-line",
  cleared: "bg-db-green-tint text-db-green border-db-green/30",
  completed: "bg-db-green-tint text-db-green border-db-green/30",
};

const errMsg = (e: unknown, fallback: string) => errorLine(e, fallback);

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-db-line bg-surface">
      <div className="flex min-h-[46px] items-center gap-2 border-b border-db-line px-4">
        <h2 className="text-[13.5px] font-semibold text-db-ink">{title}</h2>
        <div className="flex-1" />
        {aside}
      </div>
      <div className="px-4 py-3.5">{children}</div>
    </section>
  );
}

/**
 * The applicant's side of a filed application: one page from draft to
 * decision. Before filing, it runs the same pre-check the server will run at
 * the counter and shows exactly what would be refused. After filing, it shows
 * each department's own clock, answers queries, and raises grievances — and
 * every one of those acts lands on the ledger shown at the bottom.
 */
export function ApplicationView({ id }: { id: string }) {
  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api<ApplicationDetail>(`/v1/applications/${encodeURIComponent(id)}`));
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 403)) setNotFound(true);
      setError(errMsg(e, "Could not load the application."));
    }
  }, [id]);

  useEffect(() => {
    void load();
    return subscribe((fileId) => {
      if (fileId === id) void load();
    }, id);
  }, [id, load]);

  if (!data) {
    return (
      <AppShell active="applications">
        <div className="flex flex-1 items-center justify-center bg-db-bg">
          {error ? (
            <div className="flex max-w-[420px] flex-col items-center gap-3 text-center">
              <AlertTriangle className="h-7 w-7 text-db-red" strokeWidth={1.6} />
              <p className="text-[14px] text-db-ink">{notFound ? "This application is not yours, or does not exist." : error}</p>
              <Link href="/applications" className="text-[13px] text-db-blue">
                Back to my applications
              </Link>
            </div>
          ) : (
            <span className="flex items-center gap-2 text-[13px] text-db-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading {id}…
            </span>
          )}
        </div>
      </AppShell>
    );
  }

  const a = data.application;
  const draft = a.status === "draft";

  return (
    <AppShell active="applications">
      <main className="flex-1 overflow-y-auto bg-db-bg">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-4 py-6 sm:px-6">
          <Link href="/applications" className="flex w-fit items-center gap-1.5 text-[12.5px] text-db-muted no-underline hover:text-db-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> My applications
          </Link>

          <header className="flex flex-wrap items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-[12px] font-semibold text-db-ink">{a.id}</span>
                <span className={cn("rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]", STATUS_TONE[a.status] ?? STATUS_TONE.draft)}>
                  {a.status.replace(/_/g, " ")}
                </span>
                <span className="text-[12px] text-db-muted">
                  Rules {a.rules_version} · engine {a.engine_version}
                </span>
              </div>
              <h1 className="mt-1.5 text-[24px] font-semibold leading-tight tracking-[-0.01em] text-db-ink">{a.project}</h1>
              <p className="mt-1 text-[13px] text-db-muted">
                {a.applicant_name} · {LOCATIONS.find((l) => l.id === a.location)?.label ?? a.location}
                {a.filed_at ? ` · filed ${new Date(a.filed_at).toLocaleDateString("en-IN")}` : ""}
              </p>
            </div>
          </header>

          {error ? <p className="rounded-lg border border-db-red-line bg-db-red-tint px-3 py-2 text-[12.5px] text-db-red">{error}</p> : null}

          {draft ? (
            <DraftStage data={data} reload={load} />
          ) : data.file ? (
            <>
              <FiledStage data={data} view={data.file} reload={load} />
              {/* On revision the applicant may add what the objecting desks asked for. */}
              {a.status === "returned" ? <DocumentsPanel data={data} reload={load} /> : null}
            </>
          ) : null}

          <Section title="Record of this application">
            <LedgerPanel app={data.file?.file} applicationId={a.id} />
          </Section>
        </div>
      </main>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Before filing

function DraftStage({ data, reload }: { data: ApplicationDetail; reload: () => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [refused, setRefused] = useState<SubmissionGap[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const s = data.summary;
  const gaps = refused ?? data.submission_gaps;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    setRefused(null);
    try {
      await api(`/v1/applications/${data.application.id}/submit`, { method: "POST" });
      await reload();
    } catch (e) {
      if (e instanceof ApiError && e.code === "prevalidation_failed") {
        setRefused((e.detail as { submission_gaps?: SubmissionGap[] })?.submission_gaps ?? []);
      }
      setError(errMsg(e, "The file was not accepted."));
    } finally {
      setSubmitting(false);
    }
  };

  const wave = data.readiness.filter((r) => r.in_current_wave);
  const later = data.readiness.filter((r) => !r.in_current_wave);

  return (
    <>
      <Section
        title="Pre-check — what the counter would say today"
        aside={
          <span className={cn("text-[12px] font-semibold", s.submittable ? "text-db-green" : "text-db-red")}>
            {s.submittable ? "Ready to file" : `${s.current_wave_blocked} of ${s.current_wave} would be refused`}
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["File now", s.current_wave, "text-db-ink"],
            ["Blocked now", s.current_wave_blocked, s.current_wave_blocked ? "text-db-red" : "text-db-ink"],
            ["Later waves", s.total - s.current_wave, "text-db-muted"],
            ["Advisory notes", s.advisory_gaps, "text-db-muted"],
          ].map(([k, v, tone]) => (
            <div key={k as string} className="rounded-lg border border-db-line bg-db-bg px-3 py-2">
              <div className="text-[11px] text-db-muted">{k}</div>
              <div className={cn("font-num text-[20px] font-semibold", tone as string)}>{v}</div>
            </div>
          ))}
        </div>

        {gaps.length > 0 ? (
          <ol className="mt-4 flex flex-col gap-2">
            {gaps.map((g, i) => (
              <li key={i} className="flex gap-2.5 rounded-lg border border-db-red-line bg-db-red-tint/40 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none text-db-red" />
                <div className="min-w-0">
                  <p className="text-[12.5px] text-db-ink">
                    <span className="font-mono text-[11px] font-semibold">{g.approval_id}</span> · {g.department_short} — {g.detail}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-db-muted">{g.remedy}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-[12.5px] text-db-green">
            <CheckCircle2 className="h-4 w-4" /> Nothing in the current wave would be refused.
          </p>
        )}

        <p className="mt-3 text-[11.5px] leading-relaxed text-db-muted">
          Only the approvals you can file today are judged. The {later.length} later ones wait for certificates that do
          not exist yet — that is the order the law sets, not a gap in your file. The server runs this check again when
          you file; this page cannot skip it.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={submit}
            disabled={submitting || !s.submittable}
            className="flex h-10 items-center gap-2 rounded-xl bg-db-blue px-4 text-[13px] font-semibold text-white hover:brightness-95 disabled:opacity-45"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={1.8} />}
            {submitting ? "Filing…" : `File ${wave.length} approval${wave.length === 1 ? "" : "s"} now`}
          </button>
          {error ? (
            <span className="text-[12px] text-db-red">{error}</span>
          ) : !s.submittable ? (
            <span className="text-[12px] text-db-muted">
              {s.current_wave === 0
                ? "Nothing can be filed today — every approval waits on another."
                : `Not yet — ${s.current_wave_blocked} approval${s.current_wave_blocked === 1 ? "" : "s"} in today's wave would be refused. Fix the gaps above.`}
            </span>
          ) : null}
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <CommonFormPanel data={data} reload={reload} />
        <DocumentsPanel data={data} reload={reload} />
      </div>
    </>
  );
}

const FORM_FIELDS: { key: keyof CommonForm; label: string; unit?: string; numeric: boolean; hint?: string }[] = [
  { key: "plot_number", label: "Plot number", numeric: false },
  { key: "built_up_sqm", label: "Built-up area", unit: "sq m", numeric: true },
  { key: "connected_load_kva", label: "Connected load", unit: "kVA", numeric: true },
  { key: "water_draw_kld", label: "Water draw", unit: "KLD", numeric: true },
  { key: "employees", label: "Employees", numeric: true },
  { key: "investment_lakh", label: "Investment", unit: "₹ lakh", numeric: true },
  { key: "pan", label: "PAN", numeric: false, hint: "ABCDE1234F" },
  { key: "gstin", label: "GSTIN", numeric: false, hint: "27ABCDE1234F1Z5" },
];

function CommonFormPanel({ data, reload }: { data: ApplicationDetail; reload: () => Promise<void> }) {
  const initial = useMemo(() => {
    const out: Record<string, string> = {};
    for (const f of FORM_FIELDS) {
      const v = data.application.common_form[f.key];
      out[f.key] = v === undefined || v === null ? "" : String(v);
    }
    return out;
  }, [data.application.common_form]);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => setForm(initial), [initial]);

  const dirty = FORM_FIELDS.some((f) => form[f.key] !== initial[f.key]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const body: Record<string, string | number> = {};
    for (const f of FORM_FIELDS) {
      const raw = form[f.key].trim();
      if (!raw) continue;
      if (f.numeric) {
        const n = Number(raw);
        if (!Number.isFinite(n)) {
          setMsg({ ok: false, text: `${f.label} must be a number.` });
          setSaving(false);
          return;
        }
        body[f.key] = n;
      } else body[f.key] = f.key === "pan" || f.key === "gstin" ? raw.toUpperCase() : raw;
    }
    try {
      await api(`/v1/applications/${data.application.id}`, { method: "PATCH", body: { common_form: body } });
      setMsg({ ok: true, text: "Saved. Every department's form now reads these figures." });
      await reload();
    } catch (e) {
      setMsg({ ok: false, text: errMsg(e, "Not saved.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Common application form" aside={<span className="text-[11.5px] text-db-muted">Filled once, read by every desk</span>}>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {FORM_FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span className="text-[11.5px] text-db-muted">
              {f.label}
              {f.unit ? ` (${f.unit})` : ""}
            </span>
            <input
              value={form[f.key]}
              inputMode={f.numeric ? "decimal" : "text"}
              placeholder={f.hint}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value.slice(0, 60) }))}
              className="h-9 rounded-lg border border-db-line bg-surface px-2.5 font-mono text-[12.5px] text-db-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="flex h-9 items-center gap-2 rounded-lg border border-db-line bg-surface px-3.5 text-[12.5px] font-medium text-db-ink hover:border-db-blue/50 disabled:opacity-45"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {saving ? "Saving…" : "Save form"}
        </button>
        {msg ? <span className={cn("text-[12px]", msg.ok ? "text-db-green" : "text-db-red")}>{msg.text}</span> : null}
      </div>
    </Section>
  );
}

function DocumentsPanel({ data, reload }: { data: ApplicationDetail; reload: () => Promise<void> }) {
  const missing = useMemo(
    () =>
      Array.from(
        new Set(
          data.readiness
            .filter((r) => r.in_current_wave)
            .flatMap((r) => r.gaps.filter((g) => g.kind === "missing_document" && g.document).map((g) => g.document as string)),
        ),
      ),
    [data.readiness],
  );
  const [kind, setKind] = useState(missing[0] ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (!kind && missing[0]) setKind(missing[0]);
  }, [missing, kind]);

  const upload = async () => {
    if (!file || kind.trim().length < 2) return;
    setBusy(true);
    setMsg(null);
    try {
      const local = await sha256Hex(file);
      const fd = new FormData();
      fd.append("kind", kind.trim());
      fd.append("file", file);
      const r = await api<{ sha256: string; bytes: number; mime: string }>(`/v1/applications/${data.application.id}/documents`, {
        method: "POST",
        body: fd,
      });
      if (local && local !== r.sha256) {
        setMsg({ ok: false, text: "The server received different bytes from the ones you chose. Upload it again." });
      } else {
        setMsg({ ok: true, text: `Received · SHA-256 ${r.sha256.slice(0, 16)}… matches your copy.` });
      }
      setFile(null);
      await reload();
    } catch (e) {
      setMsg({ ok: false, text: errMsg(e, "Upload failed.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Documents" aside={<span className="text-[11.5px] text-db-muted">PDF, PNG or JPEG</span>}>
      {missing.length > 0 ? (
        <p className="mb-2 text-[12px] text-db-muted">
          Still needed for this wave: <span className="text-db-ink">{missing.join(" · ")}</span>
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <input
          list="doc-kinds"
          value={kind}
          onChange={(e) => setKind(e.target.value.slice(0, 120))}
          placeholder="Which document is this?"
          aria-label="Document name"
          className="h-9 rounded-lg border border-db-line bg-surface px-2.5 text-[12.5px] text-db-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <datalist id="doc-kinds">
          {missing.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          aria-label="Choose file"
          className="text-[12px] text-db-muted file:mr-3 file:h-8 file:rounded-lg file:border file:border-db-line file:bg-surface file:px-3 file:text-[12px] file:text-db-ink"
        />
        <button
          onClick={upload}
          disabled={!file || kind.trim().length < 2 || busy}
          className="flex h-9 w-fit items-center gap-2 rounded-lg bg-db-blue px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-45"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
          {busy ? "Uploading…" : "Upload"}
        </button>
        {msg ? <p className={cn("text-[12px]", msg.ok ? "text-db-green" : "text-db-red")}>{msg.text}</p> : null}
      </div>

      <div className="mt-4 border-t border-db-line pt-3">
        <Label>In the dossier ({data.application.dossier.documents.length})</Label>
        <ul className="mt-2 flex flex-col gap-1.5">
          {data.application.dossier.documents.map((d) => {
            const stored = data.documents.find((x) => x.kind === d);
            return (
              <li key={d} className="flex items-center gap-2 text-[12px]">
                <CheckCircle2 className="h-3.5 w-3.5 flex-none text-db-green" />
                <span className="min-w-0 flex-1 truncate text-db-ink">{d}</span>
                <span className="font-mono text-[10.5px] text-db-faint" title={stored?.sha256}>
                  {stored ? `${stored.sha256.slice(0, 10)}…` : "sample"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// After filing

function FiledStage({ data, view, reload }: { data: ApplicationDetail; view: FileView; reload: () => Promise<void> }) {
  const file = view.file;
  const d = derive(file);
  const revision = file.resolution?.kind === "sent_for_revision" ? file.resolution : null;
  const [resubNote, setResubNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const command = async (body: Record<string, unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await api(`/v1/matrix/files/${file.id}/commands`, { method: "POST", body });
      await reload();
      return true;
    } catch (e) {
      setErr(errMsg(e, "Not accepted."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const verdictText: Record<string, string> = {
    awaiting_dispatch: "Waiting to be sent to the departments.",
    in_progress: `${d.pending.length} of ${file.reviews.length} desks still deciding.`,
    conflict_halted: "Two departments disagree. The file is held until they settle it or the Committee decides.",
  };

  // The one answer an applicant opens this page for: is anything waiting on me?
  const queried = file.reviews.filter((r) => r.query_open);
  const decided = file.reviews.filter((r) => ["approved", "rejected", "deemed_approved"].includes(r.state)).length;
  const next: { text: string; you: boolean } = revision
    ? { text: `Correct the file and resubmit — ${revision.packet.reply_days} days to reply`, you: true }
    : queried.length > 0
      ? { text: `Answer ${queried.map((r) => r.dept_short).join(" and ")}'s ${queried.length === 1 ? "query" : "queries"} — ${queried.length === 1 ? "its clock is" : "their clocks are"} paused until you do`, you: true }
      : file.resolution
        ? { text: file.resolution.kind === "cleared" ? "Nothing — this phase is cleared" : "Nothing right now — see the outcome below", you: false }
        : d.conflict
          ? { text: "Nothing — two departments are settling a disagreement", you: false }
          : { text: "Nothing — the departments are deciding", you: false };

  return (
    <>
      <section aria-label="Summary" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-db-line bg-db-line sm:grid-cols-4">
        <div className="bg-surface px-4 py-3">
          <div className="text-[11px] font-semibold tracking-[0.06em] text-db-muted">STATUS</div>
          <div className="mt-0.5 text-[14px] font-semibold text-db-ink">{data.application.status.replace(/_/g, " ").toUpperCase()}</div>
        </div>
        <div className="bg-surface px-4 py-3">
          <div className="text-[11px] font-semibold tracking-[0.06em] text-db-muted">DAY</div>
          <div className="mt-0.5 font-num text-[14px] font-semibold text-db-ink">{file.day}</div>
        </div>
        <div className="bg-surface px-4 py-3">
          <div className="text-[11px] font-semibold tracking-[0.06em] text-db-muted">DESKS DECIDED</div>
          <div className="mt-0.5 font-num text-[14px] font-semibold text-db-ink">
            {decided} / {file.reviews.length}
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-db-bg" aria-hidden>
            <div className="h-full rounded-full bg-db-green" style={{ width: `${(decided / Math.max(1, file.reviews.length)) * 100}%` }} />
          </div>
        </div>
        <div className={cn("col-span-2 px-4 py-3 sm:col-span-1", next.you ? "bg-db-amber-tint" : "bg-surface")}>
          <div className={cn("text-[11px] font-semibold tracking-[0.06em]", next.you ? "text-db-amber" : "text-db-muted")}>
            {next.you ? "YOUR NEXT ACTION" : "NEXT ACTION"}
          </div>
          <div className="mt-0.5 text-[12.5px] font-medium leading-snug text-db-ink">{next.text}</div>
        </div>
      </section>

      <Section
        title="Where your file is"
        aside={<span className="font-num text-[12px] text-db-muted">Day {file.day}</span>}
      >
        <p className="mb-3 text-[13px] text-db-ink">{file.resolution ? file.resolution.note : verdictText[d.verdict] ?? d.verdict.replace(/_/g, " ")}</p>

        {revision ? (
          <div className="mb-4 rounded-lg border border-db-amber-line bg-db-amber-tint/50 px-3 py-3">
            <p className="text-[13px] font-semibold text-db-ink">Returned for revision · packet {revision.packet.id}</p>
            <ul className="mt-1.5 list-disc pl-5 text-[12.5px] text-db-ink">
              {revision.packet.objections.map((o, i) => (
                <li key={i}>
                  <span className="font-semibold">{o.dept_short}:</span> {o.body}
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[11.5px] text-db-muted">
              Approvals already granted are carried forward: {revision.packet.carried_forward.join(", ") || "none"}. Reply within{" "}
              {revision.packet.reply_days} days.
            </p>
            <textarea
              value={resubNote}
              onChange={(e) => setResubNote(e.target.value.slice(0, 2000))}
              rows={2}
              placeholder="What you changed"
              aria-label="Resubmission note"
              className="mt-2 w-full rounded-lg border border-db-line bg-surface px-2.5 py-2 text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              onClick={async () => {
                if (await command({ type: "resubmit", note: resubNote.trim() })) setResubNote("");
              }}
              disabled={busy || resubNote.trim().length < 3}
              className="mt-2 flex h-9 items-center gap-2 rounded-lg bg-db-blue px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-45"
            >
              <Send className="h-3.5 w-3.5" /> {busy ? "Sending…" : "Resubmit to the objecting desks"}
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {/* Desks waiting on the applicant first, then the open ones, then the decided. */}
          {[...file.reviews]
            .sort((a, b) => deskRank(a) - deskRank(b))
            .map((r) => (
            <DeskRow
              key={r.dept_id}
              review={r}
              clock={view.clocks[r.dept_id]}
              appId={file.id}
              busy={busy}
              command={command}
              grievance={data.grievances.find((g) => g.approval_id === r.approval_id && g.status !== "resolved")}
              onRaised={reload}
              thread={file.thread}
            />
          ))}
        </div>
        {err ? <p className="mt-3 text-[12px] text-db-red">{err}</p> : null}
      </Section>

      <ThreadPanel file={file} busy={busy} command={command} />

      {data.grievances.length > 0 ? (
        <Section title="Grievances">
          <ul className="flex flex-col gap-2">
            {data.grievances.map((g) => (
              <li key={g.id} className="rounded-lg border border-db-line px-3 py-2">
                <div className="flex items-center gap-2 text-[12px]">
                  <Scale className="h-3.5 w-3.5 text-db-blue" />
                  <span className="font-mono text-[11px] font-semibold text-db-ink">{g.id}</span>
                  <span className="text-db-muted">
                    {g.approval_id} · {g.dept_short}
                  </span>
                  <div className="flex-1" />
                  <span className={cn("text-[10.5px] font-semibold uppercase", g.status === "resolved" ? "text-db-green" : "text-db-amber")}>
                    {g.status}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-db-ink">{g.reason}</p>
                {g.resolution ? <p className="mt-1 text-[12px] text-db-green">Committee: {g.resolution}</p> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}

function DeskRow({
  review: r,
  clock,
  appId,
  busy,
  command,
  grievance,
  onRaised,
  thread,
}: {
  thread: FileView["file"]["thread"];
  review: DeptReview;
  clock: FileView["clocks"][string] | undefined;
  appId: string;
  busy: boolean;
  command: (body: Record<string, unknown>) => Promise<boolean>;
  grievance: ApplicationDetail["grievances"][number] | undefined;
  onRaised: () => Promise<void>;
}) {
  const meta = REVIEW_META[r.state];
  const [answer, setAnswer] = useState("");
  const [griefOpen, setGriefOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [gErr, setGErr] = useState<string | null>(null);
  const [gBusy, setGBusy] = useState(false);

  const queryText = r.query_open ? latestQuery(r, thread) : null;

  const raise = async () => {
    setGBusy(true);
    setGErr(null);
    try {
      await api("/v1/grievances", { method: "POST", body: { application_id: appId, approval_id: r.approval_id, reason: reason.trim() } });
      setGriefOpen(false);
      setReason("");
      await onRaised();
    } catch (e) {
      setGErr(errMsg(e, "Not raised."));
    } finally {
      setGBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-db-line px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] font-semibold text-db-ink">{r.dept_short}</span>
        <span className="font-mono text-[10.5px] text-db-faint">{r.approval_id}</span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-db-ink">{r.approval_name}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", reviewStatus(r).text)}>{reviewStatus(r).label}</span>
      </div>

      {clock && isOpen(r) ? (
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-db-muted">
          {r.state === "in_review" && clock.sla_left !== null ? (
            <span className={cn("flex items-center gap-1", clock.sla_left < 0 && !clock.query_open && "font-semibold text-db-amber")}>
              <Clock className="h-3 w-3" />
              {clock.query_open
                ? `Clock paused — waiting on you (${clock.sla_left} d left when it resumes)`
                : clock.sla_left < 0
                  ? `Overdue by ${-clock.sla_left} d — the Committee can take it over`
                  : `${clock.sla_left} d left in the service limit`}
            </span>
          ) : null}
          {clock.deemed_left !== null ? (
            <span className="flex items-center gap-1">
              <Hourglass className="h-3 w-3" />
              {clock.deemed_left <= 0 ? "Deemed period reached" : `Deemed approved in ${clock.deemed_left} d under its own Act`}
            </span>
          ) : r.state !== "queued" ? (
            <span className="flex items-center gap-1">
              <Hourglass className="h-3 w-3" /> No deeming clause — lapse goes to the Committee
            </span>
          ) : null}
          {clock.paused_days > 0 ? <span>{clock.paused_days} d paused on queries</span> : null}
          {r.state === "queued" ? <span>Starts when the approvals it needs are issued</span> : null}
        </div>
      ) : r.remarks ? (
        <p className="mt-1 text-[12px] text-db-muted">{r.remarks}</p>
      ) : null}

      {r.query_open ? (
        <div className="mt-2 rounded-lg border border-db-amber-line bg-db-amber-tint/40 px-2.5 py-2">
          <p className="flex items-start gap-1.5 text-[12.5px] text-db-ink">
            <MessageSquareWarning className="mt-0.5 h-3.5 w-3.5 flex-none text-db-amber" />
            {queryText ?? `${r.dept_short} has asked you a question.`}
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value.slice(0, 2000))}
              placeholder="Your answer"
              aria-label={`Answer ${r.dept_short}'s query`}
              className="h-9 flex-1 rounded-lg border border-db-line bg-surface px-2.5 text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              onClick={async () => {
                if (await command({ type: "answer_query", dept_id: r.dept_id, body: answer.trim() })) setAnswer("");
              }}
              disabled={busy || answer.trim().length < 3}
              className="h-9 rounded-lg bg-db-blue px-3 text-[12.5px] font-semibold text-white disabled:opacity-45"
            >
              {busy ? "Sending…" : "Answer · restart clock"}
            </button>
          </div>
        </div>
      ) : null}

      {isOpen(r) && r.state !== "queued" ? (
        grievance ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-db-blue">
            <ShieldCheck className="h-3.5 w-3.5" /> Grievance {grievance.id} is with the Empowered Committee.
          </p>
        ) : griefOpen ? (
          <div className="mt-2 flex flex-col gap-1.5">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 2000))}
              rows={2}
              placeholder="What is stuck, and since when (at least 10 characters)"
              aria-label="Grievance reason"
              className="rounded-lg border border-db-line bg-surface px-2.5 py-2 text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={raise}
                disabled={gBusy || reason.trim().length < 10}
                className="h-8 rounded-lg bg-db-navy px-3 text-[12px] font-semibold text-white disabled:opacity-45"
              >
                {gBusy ? "Sending…" : "Send to the Empowered Committee"}
              </button>
              <button onClick={() => setGriefOpen(false)} className="h-8 rounded-lg border border-db-line px-3 text-[12px]">
                Cancel
              </button>
              {reason.trim().length < 10 ? (
                <span className="font-mono text-[10.5px] text-db-faint">{reason.trim().length}/10</span>
              ) : null}
              {gErr ? <span className="text-[11.5px] text-db-red">{gErr}</span> : null}
            </div>
            <p className="text-[11px] text-db-muted">MAITRI Act, 2023 — s. 8(1)(g). It goes to the Committee, not back to {r.dept_short}.</p>
          </div>
        ) : (
          <button onClick={() => setGriefOpen(true)} className="mt-2 text-[11.5px] font-medium text-db-blue hover:underline">
            Raise a grievance on {r.approval_id}
          </button>
        )
      ) : null}
    </div>
  );
}

const deskRank = (r: DeptReview) =>
  r.query_open ? 0 : r.state === "in_review" ? 1 : r.state === "transferred_to_committee" ? 2 : r.state === "queued" ? 3 : 4;

/** The desk's own words, from the thread — a query is posted there when raised. */
function latestQuery(r: DeptReview, thread: FileView["file"]["thread"]): string | null {
  for (let i = thread.length - 1; i >= 0; i -= 1) {
    const m = thread[i];
    if (m.dept_id === r.dept_id && m.body.startsWith("Query: ")) return `${r.dept_short} asks: ${m.body.slice(7)}`;
  }
  return null;
}

function ThreadPanel({
  file,
  busy,
  command,
}: {
  file: FileView["file"];
  busy: boolean;
  command: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");
  const recent = file.thread.slice(-8);
  return (
    <Section title="Messages on this file" aside={<span className="text-[11.5px] text-db-muted">{file.thread.length} in total</span>}>
      {recent.length === 0 ? <p className="text-[12.5px] text-db-muted">No messages yet.</p> : null}
      <ul className="flex flex-col gap-2">
        {recent.map((m) => (
          <li key={m.id} className={cn("rounded-lg px-3 py-2", m.role === "applicant" ? "ml-8 bg-db-blue-tint" : "mr-8 bg-db-bg")}>
            <div className="text-[10.5px] font-semibold tracking-[0.04em] text-db-muted">{m.author_short}</div>
            <p className="text-[12.5px] leading-relaxed text-db-ink">{m.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
          placeholder="Write to the departments on this file"
          aria-label="Message"
          className="h-9 flex-1 rounded-lg border border-db-line bg-surface px-2.5 text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <button
          onClick={async () => {
            if (await command({ type: "post_message", body: draft.trim() })) setDraft("");
          }}
          disabled={busy || draft.trim().length < 3}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-db-line px-3 text-[12.5px] disabled:opacity-45"
        >
          <Send className="h-3.5 w-3.5" /> Send
        </button>
      </div>
    </Section>
  );
}
