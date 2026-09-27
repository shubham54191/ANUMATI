"use client";
import { useCallback, useEffect, useState } from "react";
import { errorLine } from "@/lib/api/explain";
import { BookCheck, ExternalLink, FileSearch, Inbox, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import { DeskShell } from "@/components/layout/DeskShell";
import { cn } from "@/lib/utils";

interface RuleRow {
  approval_id: string;
  version: number;
  name: string;
  department_id: string;
  statutory_days: number;
  deemed_exists: boolean;
  deemed_days: number | null;
  deemed_reference: string | null;
  source_document_id: string;
  section: string;
  valid_from: string | null;
  valid_to: string | null;
  review_status: "draft" | "published" | "superseded" | "rejected";
  extraction: { page?: number | null; excerpt?: string | null; model?: string | null; confidence?: number | null; flags?: string[] | null } | null;
  body: {
    required_documents?: string[];
    source?: { url?: string; title?: string };
    proposed_edges?: { from_approval_id: string; edge_type: string; confidence: number; rationale: string }[];
  };
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
}

const TABS = [
  { id: "draft", label: "Awaiting review" },
  { id: "published", label: "Published" },
  { id: "rejected", label: "Rejected" },
] as const;

const errMsg = (e: unknown, f: string) => errorLine(e, f);

/**
 * Where an extracted rule becomes law in the engine — or does not. The
 * pipeline only ever drafts; a named person publishes, with a note, and the
 * server refuses anything that would make the dependency graph circular.
 */
export function RuleReviewDesk() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("draft");
  const [rows, setRows] = useState<RuleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    try {
      const r = await api<{ data: RuleRow[] }>(`/v1/rules?status=${tab}`);
      setRows(r.data);
      setError(null);
    } catch (e) {
      setError(errMsg(e, "Could not load the rules."));
      setRows([]);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DeskShell active="rules">
      <div className="mx-auto w-full max-w-[1080px] px-4 py-6 sm:px-6">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-db-ink">Rule review</h1>
        <p className="mt-1 max-w-[680px] text-[13px] text-db-muted">
          Drafts come from the extraction pipeline or a reviewer. None reaches an applicant until someone here checks it
          against the source and publishes it. Publishing creates a new rule-set version; earlier roadmaps keep the version
          they were built on.
        </p>

        <div role="tablist" className="mt-5 flex gap-1 border-b border-db-line">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "h-10 px-3 text-[13px] transition-colors",
                tab === t.id ? "font-semibold text-db-blue shadow-[inset_0_-2px_0_var(--db-blue)]" : "text-db-muted hover:text-db-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? <p className="mt-3 text-[12.5px] text-db-red">{error}</p> : null}

        <div className="mt-4 flex flex-col gap-3">
          {rows === null ? (
            [0, 1].map((i) => <div key={i} className="h-[140px] animate-pulse rounded-xl border border-db-line bg-surface" />)
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-db-line bg-surface px-6 py-14 text-center">
              <Inbox className="h-7 w-7 text-db-faint" strokeWidth={1.5} />
              <p className="text-[14px] font-semibold text-db-ink">{tab === "draft" ? "No drafts waiting" : "Nothing here"}</p>
              {tab === "draft" ? (
                <p className="max-w-[420px] text-[12.5px] text-db-muted">
                  Run the extraction pipeline against a notified document, or post a draft to /v1/rules/drafts.
                </p>
              ) : null}
            </div>
          ) : (
            rows.map((r) => <RuleCard key={`${r.approval_id}-${r.version}`} rule={r} onDone={load} />)
          )}
        </div>
      </div>
    </DeskShell>
  );
}

function RuleCard({ rule: r, onDone }: { rule: RuleRow; onDone: () => Promise<void> }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<null | "publish" | "reject">(null);
  const [err, setErr] = useState<string | null>(null);
  const x = r.extraction ?? {};
  const flags = x.flags ?? [];
  const url = r.body.source?.url;

  const act = async (what: "publish" | "reject") => {
    setBusy(what);
    setErr(null);
    try {
      await api(`/v1/rules/${encodeURIComponent(r.approval_id)}/${r.version}/${what}`, { method: "POST", body: { note: note.trim() } });
      await onDone();
    } catch (e) {
      const cycle = e instanceof ApiError ? (e.detail as { cycle?: string[] } | undefined)?.cycle : undefined;
      setErr(
        cycle
          ? `${(e as ApiError).message} ${cycle.join(" → ")}. Nothing was published — reject this draft or fix the edge that closes the loop.`
          : errMsg(e, "Not accepted."),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className="rounded-xl border border-db-line bg-surface px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[12px] font-semibold text-db-ink">
          {r.approval_id} v{r.version}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-db-ink">{r.name}</span>
        {typeof x.confidence === "number" ? (
          <span className={cn("text-[11px] font-semibold", x.confidence < 0.8 ? "text-db-amber" : "text-db-muted")}>
            confidence {(x.confidence * 100).toFixed(0)}%
          </span>
        ) : null}
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] sm:grid-cols-4">
        <div>
          <dt className="text-db-muted">Department</dt>
          <dd className="text-db-ink">{r.department_id}</dd>
        </div>
        <div>
          <dt className="text-db-muted">Service limit</dt>
          <dd className="font-num text-db-ink">{r.statutory_days} d</dd>
        </div>
        <div>
          <dt className="text-db-muted">Deemed</dt>
          <dd className="text-db-ink">{r.deemed_exists ? `${r.deemed_days} d — ${r.deemed_reference}` : "No clause"}</dd>
        </div>
        <div>
          <dt className="text-db-muted">Source</dt>
          <dd className="flex items-center gap-1 text-db-ink">
            {r.source_document_id} {r.section}
            {url ? (
              <a href={url} target="_blank" rel="noreferrer" aria-label="Open source" className="text-db-blue">
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </dd>
        </div>
      </dl>

      {x.excerpt ? (
        <blockquote className="mt-2.5 border-l-2 border-db-blue/40 pl-3 text-[12px] italic leading-relaxed text-db-muted">
          <FileSearch className="mr-1 inline h-3 w-3 not-italic" />
          {x.excerpt}
          {x.page ? <span className="not-italic text-db-faint"> — p. {x.page}</span> : null}
        </blockquote>
      ) : null}

      {r.body.required_documents?.length ? (
        <p className="mt-2 text-[12px] text-db-muted">
          Documents: <span className="text-db-ink">{r.body.required_documents.join(" · ")}</span>
        </p>
      ) : null}

      {r.body.proposed_edges?.length ? (
        <ul className="mt-2 flex flex-col gap-1 text-[12px]">
          {r.body.proposed_edges.map((e, i) => (
            <li key={i} className="text-db-muted">
              <span className="font-mono text-db-ink">{e.from_approval_id} → {r.approval_id}</span> · {e.edge_type} ·{" "}
              {(e.confidence * 100).toFixed(0)}% — {e.rationale}
            </li>
          ))}
        </ul>
      ) : null}

      {flags.length ? (
        <p className="mt-2 text-[12px] text-db-amber">Flagged by the pipeline: {flags.join(", ")}</p>
      ) : null}

      {r.review_status === "draft" ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-db-line pt-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 1000))}
            placeholder="Your note — what you checked against the source (at least 5 characters)"
            aria-label="Review note"
            className="h-9 rounded-lg border border-db-line bg-surface px-2.5 text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => act("publish")}
              disabled={busy !== null || note.trim().length < 5}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-db-blue px-3 text-[12px] font-semibold text-white disabled:opacity-45"
            >
              {busy === "publish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookCheck className="h-3.5 w-3.5" />}
              Publish as new rule version
            </button>
            <button
              onClick={() => act("reject")}
              disabled={busy !== null || note.trim().length < 5}
              className="h-8 rounded-lg border border-db-red-line px-3 text-[12px] font-semibold text-db-red disabled:opacity-45"
            >
              Reject draft
            </button>
            {note.trim().length < 5 ? (
              <span className="font-mono text-[10.5px] text-db-faint">{note.trim().length}/5 — say what you checked</span>
            ) : null}
            {err ? <span className="text-[12px] text-db-red">{err}</span> : null}
          </div>
        </div>
      ) : r.review_note ? (
        <p className="mt-2 text-[12px] text-db-muted">
          Reviewer&apos;s note: <span className="text-db-ink">{r.review_note}</span>
        </p>
      ) : null}
    </article>
  );
}
