"use client";
import { useState } from "react";
import { Check, X, Zap } from "lucide-react";
import type { ApplicationFile } from "@/types/matrix";
import { isOpen } from "@/lib/matrix/engine";
import { useMatrixStore } from "@/store/useMatrixStore";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * Departmental desks in a demonstration build.
 *
 * In a deployment each of these buttons lives on a different officer's screen
 * in a different building; here they are collected in one strip so the whole
 * protocol can be walked in a minute. The engine cannot tell the difference —
 * a decision is a decision whichever screen it came from.
 */
export function DecisionBar({ app }: { app: ApplicationFile }) {
  const decide = useMatrixStore((s) => s.decide);
  const triggerClash = useMatrixStore((s) => s.triggerClash);
  const [active, setActive] = useState<string | null>(null);
  const [score, setScore] = useState<string>("");

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

  const act = (state: "approved" | "rejected") => {
    if (!selected) return;
    const parsed = Number(score);
    decide(selected.dept_id, state, {
      score: weighted && score !== "" && !Number.isNaN(parsed) ? Math.max(0, Math.min(100, parsed)) : undefined,
      remarks:
        state === "approved"
          ? `Cleared by ${selected.dept_short} on day ${app.day}.`
          : `Rejected by ${selected.dept_short} on day ${app.day}.`,
    });
    setActive(null);
    setScore("");
  };

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
              onClick={() => setActive(r.dept_id === active ? null : r.dept_id)}
              aria-pressed={r.dept_id === active}
              disabled={settled}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-xl border px-2.5 font-mono text-[11px] transition-colors",
                "disabled:opacity-40",
                r.dept_id === active
                  ? "border-db-blue bg-db-blue-tint font-medium text-db-blue"
                  : "border-db-line text-db-muted hover:border-db-blue/50 hover:text-db-blue",
              )}
            >
              {r.dept_short}
              <span className="text-[9.5px] text-db-faint">{r.approval_id}</span>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="flex items-center gap-2 rounded-xl border border-db-line bg-db-bg px-2 py-1.5">
            <span className="text-[11.5px] text-db-muted">
              Acting as {selected.officer_name}, {selected.officer_designation}
            </span>
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
            <Button onClick={() => act("approved")} className="h-7 px-2.5">
              <Check className="h-3 w-3 text-db-green" strokeWidth={2} />
              Approve
            </Button>
            <Button onClick={() => act("rejected")} className="h-7 px-2.5">
              <X className="h-3 w-3 text-db-red" strokeWidth={2} />
              Reject
            </Button>
          </div>
        ) : null}

        <div className="flex-1" />

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
      </div>
    </div>
  );
}
