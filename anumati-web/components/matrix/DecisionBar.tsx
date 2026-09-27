"use client";
import { useState } from "react";
import { Check, HelpCircle, Lock, X, Zap } from "lucide-react";
import type { ApplicationFile } from "@/types/matrix";
import { isOpen } from "@/lib/matrix/engine";
import { useMatrixStore } from "@/store/useMatrixStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * Departmental desks.
 *
 * Demo mode: every desk is collected in one strip so the whole protocol can
 * be walked in a minute.
 *
 * Live mode: an officer sees every open desk but can act only on their own
 * department's — the server refuses anything else, and the strip says so
 * before the officer tries. A rejection must carry a reason; a query pauses
 * that desk's clock until the applicant answers.
 */
const departmentOf = (deptId: string) => deptId.split(":")[0];
export function DecisionBar({ app }: { app: ApplicationFile }) {
  const decide = useMatrixStore((s) => s.decide);
  const triggerClash = useMatrixStore((s) => s.triggerClash);
  const raiseQuery = useMatrixStore((s) => s.raiseQuery);
  const mode = useMatrixStore((s) => s.mode);
  const demoControls = useMatrixStore((s) => s.demoControls);
  const busy = useMatrixStore((s) => s.busy);
  const session = useAuthStore((s) => s.session);
  const [active, setActive] = useState<string | null>(null);
  const [score, setScore] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [asking, setAsking] = useState(false);

  const live = mode === "live";
  const mine = (deptId: string) =>
    !live || session?.role === "admin" || (session?.role === "officer" && departmentOf(deptId) === session.department_id);

  const openReviews = app.reviews.filter(isOpen);
  const selected = app.reviews.find((r) => r.dept_id === active) ?? null;
  const weighted = app.rule.kind === "weighted";
  const settled = Boolean(app.resolution);

  const approver = app.reviews.find((r) => r.dept_id === app.demo.approver_dept);
  const rejecter = app.reviews.find((r) => r.dept_id === app.demo.rejecter_dept);
  // Replayable: as long as the objecting desk is still open, the clash can be
  // staged again — after a withdrawal, say — without resetting the file.
  const clashReady =
    app.dispatched &&
    !settled &&
    Boolean(rejecter && isOpen(rejecter)) &&
    Boolean(approver && (isOpen(approver) || approver.state === "approved" || approver.state === "deemed_approved"));

  const reset = () => {
    setActive(null);
    setScore("");
    setRemarks("");
    setAsking(false);
  };

  const act = (state: "approved" | "rejected") => {
    if (!selected) return;
    const parsed = Number(score);
    const note = remarks.trim();
    decide(selected.dept_id, state, {
      score: weighted && score !== "" && !Number.isNaN(parsed) ? Math.max(0, Math.min(100, parsed)) : undefined,
      remarks:
        note ||
        (state === "approved"
          ? `Cleared by ${selected.dept_short} on day ${app.day}.`
          : `Rejected by ${selected.dept_short} on day ${app.day}.`),
    });
    reset();
  };

  const ask = () => {
    if (!selected || remarks.trim().length < 10) return;
    raiseQuery(selected.dept_id, remarks.trim());
    reset();
  };

  // A live rejection with no written reason is not a decision anyone can appeal.
  const rejectBlocked = live && remarks.trim().length < 10;

  return (
    <div className="flex-none border-t border-db-line bg-surface px-5 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Label className="flex-none">Departmental desks</Label>

        <div className="flex flex-wrap items-center gap-1.5">
          {openReviews.length === 0 ? (
            <span className="text-[12px] text-db-muted">Every desk on this file has decided.</span>
          ) : null}
          {openReviews.map((r) => (
            <button
              key={r.dept_id}
              onClick={() => {
                setActive(r.dept_id === active ? null : r.dept_id);
                setAsking(false);
                setRemarks("");
              }}
              aria-pressed={r.dept_id === active}
              disabled={settled || !mine(r.dept_id) || busy}
              title={
                !mine(r.dept_id)
                  ? `Only ${r.dept_short} can act here — you are signed in for ${session?.department_id ?? session?.role}`
                  : r.query_open
                    ? "A query is open — the clock is paused until the applicant answers"
                    : undefined
              }
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-xl border px-2.5 font-mono text-[11px] transition-colors",
                "disabled:opacity-40",
                r.dept_id === active
                  ? "border-db-blue bg-db-blue-tint font-medium text-db-blue"
                  : "border-db-line text-db-muted hover:border-db-blue/50 hover:text-db-blue",
              )}
            >
              {!mine(r.dept_id) ? <Lock className="h-2.5 w-2.5" strokeWidth={2} /> : null}
              {r.dept_short}
              <span className="text-[9.5px] text-db-faint">{r.approval_id}</span>
              {r.query_open ? (
                <span className="rounded bg-db-amber-tint px-1 text-[9px] font-semibold text-db-amber">QUERY</span>
              ) : null}
            </button>
          ))}
        </div>

        {selected ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-db-line bg-db-bg px-2 py-1.5">
            <span className="text-[11.5px] text-db-muted">
              {live ? `${selected.dept_short} desk` : `Acting as ${selected.officer_name}, ${selected.officer_designation}`}
            </span>
            <input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value.slice(0, 2000))}
              placeholder={asking ? "What do you need from the applicant?" : live ? "Reason (required to reject)" : "Remarks (optional)"}
              aria-label={asking ? "Query to the applicant" : "Remarks"}
              className="h-7 w-[260px] rounded-xl border border-db-line bg-surface px-2 text-[11.5px] text-db-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            {asking ? (
              <>
                <Button onClick={ask} disabled={remarks.trim().length < 10} className="h-7 px-2.5" title="At least 10 characters">
                  <HelpCircle className="h-3 w-3 text-db-amber" strokeWidth={2} />
                  Send query · pause clock
                </Button>
                <Button onClick={() => setAsking(false)} className="h-7 px-2.5">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {weighted ? (
                  <label className="flex items-center gap-1.5">
                    <span className="label">Score</span>
                    <input
                      value={score}
                      onChange={(e) => setScore(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                      placeholder="0–100"
                      inputMode="numeric"
                      aria-label={`Score out of 100 for ${selected.dept_short}`}
                      className="h-7 w-[68px] rounded-xl border border-db-line bg-surface px-2 font-mono text-[11.5px] text-db-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  </label>
                ) : null}
                <Button onClick={() => act("approved")} disabled={busy || selected.query_open} className="h-7 px-2.5">
                  <Check className="h-3 w-3 text-db-green" strokeWidth={2} />
                  Approve
                </Button>
                <Button
                  onClick={() => act("rejected")}
                  disabled={busy || rejectBlocked || selected.query_open}
                  title={rejectBlocked ? "Write the reason first (at least 10 characters)" : undefined}
                  className="h-7 px-2.5"
                >
                  <X className="h-3 w-3 text-db-red" strokeWidth={2} />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setAsking(true);
                    setRemarks("");
                  }}
                  disabled={busy || Boolean(selected.query_open) || selected.state !== "in_review"}
                  title={selected.query_open ? "A query is already open on this desk" : "Ask the applicant — this desk's clock pauses"}
                  className="h-7 px-2.5"
                >
                  <HelpCircle className="h-3 w-3 text-db-amber" strokeWidth={2} />
                  Raise query
                </Button>
              </>
            )}
          </div>
        ) : null}

        <div className="flex-1" />

        {!live || (demoControls && (session?.role === "admin" || session?.department_id === "single-window")) ? (
        <Button
          variant="deemed"
          onClick={triggerClash}
          disabled={!clashReady}
          title={
            clashReady
              ? "Commit both decisions on the same timestamp"
              : "The objecting desk must still be open on a dispatched file"
          }
        >
          <Zap className="h-3 w-3" strokeWidth={1.6} />
          Simultaneous clash — {approver?.dept_short ?? "?"} approve + {rejecter?.dept_short ?? "?"} reject
        </Button>
        ) : null}
      </div>
    </div>
  );
}
