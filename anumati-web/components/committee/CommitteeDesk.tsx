"use client";
import { useCallback, useEffect, useState } from "react";
import { errorLine } from "@/lib/api/explain";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Anchor, Gavel, Inbox, Loader2, Scale, Timer } from "lucide-react";
import { api, ApiError, subscribe } from "@/lib/api/client";
import { DeskShell } from "@/components/layout/DeskShell";
import { LedgerPanel } from "@/components/ledger/LedgerPanel";
import { cn } from "@/lib/utils";

interface QueueItem {
  kind: "transferred" | "tie_breaker" | "grievance" | "overdue";
  application_id: string;
  applicant?: string;
  dept_id?: string;
  dept_short?: string;
  approval_id?: string;
  approval_name?: string;
  grievance_id?: string;
  since_day?: number | null;
  day?: number;
  days_pending?: number;
  detail: string;
  authority: string;
}

const KIND: Record<QueueItem["kind"], { label: string; Icon: typeof Gavel; tone: string }> = {
  tie_breaker: { label: "Deadlock", Icon: Scale, tone: "text-db-red bg-db-red-tint" },
  transferred: { label: "Transferred — s. 5", Icon: ArrowUpRight, tone: "text-db-amber bg-db-amber-tint" },
  grievance: { label: "Grievance", Icon: AlertTriangle, tone: "text-db-blue bg-db-blue-tint" },
  overdue: { label: "Past limit", Icon: Timer, tone: "text-db-muted bg-db-bg" },
};

/** What each decision does, said before it is taken. */
const AFTER: Record<QueueItem["kind"], string> = {
  transferred:
    "Grant issues the approval under the relevant law; Refuse records a refusal. Either way your reasons go on the ledger, the desk leaves this queue and the applicant sees the outcome.",
  tie_breaker:
    "Overrule sets the objection aside and the phase clears. Sustain returns the file to the applicant to correct. Both are binding and recorded with your reasons.",
  grievance:
    "Resolving records your reasons on the ledger and shows them to the applicant. It does not decide the approval itself — the department or a transfer still does.",
  overdue:
    "Nothing to decide yet — the desk has not been transferred. Open the file to call for the department's reasons.",
};

const errMsg = (e: unknown, f: string) => errorLine(e, f);

/**
 * The Empowered Committee's desk: every file that has left a department's
 * hands, and why. Each item carries the provision that put it here, and each
 * decision taken here must carry a written reason — it goes on the ledger.
 */
export function CommitteeDesk() {
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ data: QueueItem[] }>("/v1/committee/queue");
      setItems(r.data);
      setError(null);
    } catch (e) {
      setError(errMsg(e, "Could not load the queue."));
      setItems((s) => s ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
    return subscribe(() => void load());
  }, [load]);

  const doAnchor = async () => {
    try {
      const r = await api<{ anchor: { day: string; head_seq: number; head_hash: string } | null }>("/v1/ledger/anchor", { method: "POST" });
      setAnchor(r.anchor ? `Anchored ${r.anchor.day}: row #${r.anchor.head_seq} · ${r.anchor.head_hash.slice(0, 16)}…` : "The ledger is empty.");
    } catch (e) {
      setAnchor(errMsg(e, "Anchor failed."));
    }
  };

  return (
    <DeskShell active="committee">
      <div className="mx-auto grid w-full max-w-[1280px] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-db-ink">Empowered Committee</h1>
              <p className="mt-1 text-[13px] text-db-muted">
                Deadlocks, lapsed desks and grievances — each with the provision that brought it here.
              </p>
            </div>
            <span className="font-num text-[12px] text-db-muted">{items ? `${items.length} item${items.length === 1 ? "" : "s"}` : ""}</span>
          </div>

          {error ? <p className="mt-3 text-[12.5px] text-db-red">{error}</p> : null}

          <div className="mt-4 flex flex-col gap-3">
            {items === null ? (
              [0, 1, 2].map((i) => <div key={i} className="h-[112px] animate-pulse rounded-xl border border-db-line bg-surface" />)
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-db-line bg-surface px-6 py-14 text-center">
                <Inbox className="h-7 w-7 text-db-faint" strokeWidth={1.5} />
                <p className="text-[14px] font-semibold text-db-ink">Nothing has reached the Committee</p>
                <p className="max-w-[380px] text-[12.5px] text-db-muted">
                  Items arrive here when a desk lapses, two departments deadlock, or an applicant raises a grievance.
                </p>
              </div>
            ) : (
              items.map((it, i) => <QueueCard key={`${it.kind}-${it.application_id}-${it.dept_id ?? it.grievance_id ?? i}`} item={it} onDone={load} />)
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-3">
          <div className="rounded-xl border border-db-line bg-surface p-4">
            <LedgerPanel
              actions={
                <div className="mt-2.5 border-t border-db-line pt-2.5">
                  <button
                    onClick={doAnchor}
                    className="flex h-7 items-center gap-1.5 rounded-lg border border-db-line bg-surface px-2.5 text-[11.5px] text-db-ink hover:border-db-blue/50"
                  >
                    <Anchor className="h-3 w-3" strokeWidth={1.8} /> Anchor today&apos;s head
                  </button>
                  {anchor ? <p className="mt-1.5 break-all font-mono text-[10.5px] text-db-muted">{anchor}</p> : null}
                  <p className="mt-1.5 text-[11px] leading-snug text-db-muted">
                    Publish the anchored hash outside this system (gazette, notice board). A later edit to any row then
                    cannot go unnoticed.
                  </p>
                </div>
              }
            />
          </div>
        </aside>
      </div>
    </DeskShell>
  );
}

function QueueCard({ item: it, onDone }: { item: QueueItem; onDone: () => Promise<void> }) {
  const k = KIND[it.kind];
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      setNote("");
      await onDone();
    } catch (e) {
      setErr(errMsg(e, "Not accepted."));
    } finally {
      setBusy(false);
    }
  };

  const cmd = (body: Record<string, unknown>) =>
    run(() => api(`/v1/matrix/files/${encodeURIComponent(it.application_id)}/commands`, { method: "POST", body }));

  const needsNote = it.kind !== "overdue";
  const noteOk = note.trim().length >= (it.kind === "grievance" ? 5 : 3);

  return (
    <article className="rounded-xl border border-db-line bg-surface px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold", k.tone)}>
          <k.Icon className="h-3 w-3" strokeWidth={1.8} /> {k.label}
        </span>
        <Link href={`/matrix?file=${encodeURIComponent(it.application_id)}`} className="font-mono text-[11.5px] font-semibold text-db-ink">
          {it.application_id}
        </Link>
        {it.approval_id ? <span className="font-mono text-[11px] text-db-muted">{it.approval_id}</span> : null}
        {it.dept_short ? <span className="text-[11.5px] text-db-muted">{it.dept_short}</span> : null}
        <div className="flex-1" />
        <span className="text-[11px] text-db-faint">{it.authority}</span>
      </div>
      {it.approval_name || it.applicant ? (
        <p className="mt-1 text-[12.5px] text-db-ink">{[it.approval_name, it.applicant].filter(Boolean).join(" · ")}</p>
      ) : null}
      <p className="mt-1 text-[12.5px] leading-relaxed text-db-muted">{it.detail}</p>
      <p className="mt-1.5 text-[11.5px] leading-snug text-db-ink">
        <span className="font-semibold">After your decision: </span>
        {AFTER[it.kind]}
      </p>

      {needsNote ? (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 2000))}
            rows={2}
            placeholder="The Committee's reasons — recorded on the ledger"
            aria-label="Reasons"
            className="rounded-lg border border-db-line bg-surface px-2.5 py-2 text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <div className="flex flex-wrap items-center gap-2">
            {it.kind === "transferred" && it.dept_id ? (
              <>
                <ActionButton disabled={busy || !noteOk} onClick={() => cmd({ type: "committee_decide", dept_id: it.dept_id, outcome: "approved", note: note.trim() })}>
                  Grant {it.approval_id}
                </ActionButton>
                <ActionButton tone="danger" disabled={busy || !noteOk} onClick={() => cmd({ type: "committee_decide", dept_id: it.dept_id, outcome: "rejected", note: note.trim() })}>
                  Refuse
                </ActionButton>
              </>
            ) : null}
            {it.kind === "tie_breaker" ? (
              <>
                <ActionButton disabled={busy || !noteOk} onClick={() => cmd({ type: "tie_break", outcome: "overrule", note: note.trim() })}>
                  Overrule the objection
                </ActionButton>
                <ActionButton tone="danger" disabled={busy || !noteOk} onClick={() => cmd({ type: "tie_break", outcome: "sustain", note: note.trim() })}>
                  Sustain the objection
                </ActionButton>
              </>
            ) : null}
            {it.kind === "grievance" && it.grievance_id ? (
              <ActionButton
                disabled={busy || !noteOk}
                onClick={() =>
                  run(() => api(`/v1/grievances/${encodeURIComponent(it.grievance_id as string)}/resolve`, { method: "POST", body: { resolution: note.trim() } }))
                }
              >
                Resolve grievance
              </ActionButton>
            ) : null}
            {!noteOk ? (
              <span className="font-mono text-[10.5px] text-db-faint">
                {note.trim().length}/{it.kind === "grievance" ? 5 : 3} — write the reasons first
              </span>
            ) : null}
            {busy ? <Loader2 className="h-4 w-4 animate-spin text-db-muted" /> : null}
            {err ? <span className="text-[12px] text-db-red">{err}</span> : null}
          </div>
        </div>
      ) : (
        <Link
          href={`/matrix?file=${encodeURIComponent(it.application_id)}`}
          className="mt-2 inline-flex text-[12px] font-medium text-db-blue"
        >
          Review the file in the console →
        </Link>
      )}
    </article>
  );
}

function ActionButton({
  tone = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "danger" }) {
  return (
    <button
      {...props}
      className={cn(
        "flex h-8 items-center rounded-lg px-3 text-[12px] font-semibold transition-colors disabled:opacity-45",
        tone === "primary" ? "bg-db-blue text-white hover:brightness-95" : "border border-db-red-line text-db-red hover:bg-db-red-tint",
        className,
      )}
    />
  );
}
